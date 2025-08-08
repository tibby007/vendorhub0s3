-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('solo', 'pro', 'enterprise');
CREATE TYPE user_role AS ENUM ('broker', 'loan_officer', 'vendor');
CREATE TYPE deal_status AS ENUM ('submitted', 'credit_pulled', 'submitted_for_approval', 'approved', 'term_sheet_issued', 'declined', 'funded');
CREATE TYPE prequalification_result AS ENUM ('green', 'yellow', 'red');
CREATE TYPE document_type AS ENUM ('customer_id', 'equipment_quote', 'spec_sheet', 'term_sheet', 'other');
CREATE TYPE resource_type AS ENUM ('guideline', 'blog_post', 'document');

-- Organizations table (multi-tenant)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subscription_tier subscription_tier DEFAULT 'solo',
    brand_colors JSONB DEFAULT '{"primary": "#22C55E", "secondary": "#F97316"}',
    logo_url TEXT,
    contact_info JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deals table
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    status deal_status DEFAULT 'submitted',
    customer_info JSONB NOT NULL,
    equipment_info JSONB NOT NULL,
    financial_info JSONB NOT NULL,
    prequalification_result prequalification_result,
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    document_type document_type NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    file_url TEXT NOT NULL,
    mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message_content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resources table
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    resource_type resource_type NOT NULL,
    file_url TEXT,
    is_published BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_deals_organization ON deals(organization_id);
CREATE INDEX idx_deals_vendor ON deals(vendor_id);
CREATE INDEX idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_documents_deal ON documents(deal_id);
CREATE INDEX idx_messages_deal ON messages(deal_id);
CREATE INDEX idx_resources_organization ON resources(organization_id);
CREATE INDEX idx_audit_log_organization ON audit_log(organization_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);

-- Row Level Security Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view their own organization" ON organizations
    FOR SELECT USING (id IN (
        SELECT organization_id FROM users WHERE auth.uid() = id
    ));

CREATE POLICY "Brokers can update their organization" ON organizations
    FOR UPDATE USING (id IN (
        SELECT organization_id FROM users WHERE auth.uid() = id AND role = 'broker'
    ));

-- RLS Policies for users
CREATE POLICY "Users can view users in their organization" ON users
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM users WHERE auth.uid() = id
    ));

CREATE POLICY "Brokers can manage users in their organization" ON users
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE auth.uid() = id AND role = 'broker'
        )
    );

-- RLS Policies for deals
CREATE POLICY "Users can view deals in their organization" ON deals
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE auth.uid() = id
        ) OR
        vendor_id = auth.uid() OR
        assigned_to = auth.uid()
    );

CREATE POLICY "Vendors can create deals" ON deals
    FOR INSERT WITH CHECK (
        vendor_id = auth.uid() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'vendor')
    );

CREATE POLICY "Brokers and assigned users can update deals" ON deals
    FOR UPDATE USING (
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('broker', 'loan_officer')
            AND organization_id = deals.organization_id
        )
    );

-- Functions for updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();