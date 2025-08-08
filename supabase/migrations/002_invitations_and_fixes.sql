-- Add invitations table for proper vendor invitation management
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for token lookups
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_organization ON invitations(organization_id);

-- RLS Policies for invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations for their organization" ON invitations
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE auth.uid() = id
        )
    );

CREATE POLICY "Brokers can create invitations" ON invitations
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE auth.uid() = id AND role = 'broker'
        )
    );

CREATE POLICY "Brokers can update invitations" ON invitations
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE auth.uid() = id AND role = 'broker'
        )
    );

-- Function to generate invitation tokens
CREATE OR REPLACE FUNCTION generate_invitation_token(org_id UUID, broker_email TEXT)
RETURNS TEXT AS $$
DECLARE
    token_data TEXT;
    encoded_token TEXT;
BEGIN
    -- Create token data: organizationId:brokerEmail:timestamp
    token_data := org_id::text || ':' || broker_email || ':' || extract(epoch from now() * 1000)::bigint::text;
    
    -- Base64 encode the token data
    encoded_token := encode(token_data::bytea, 'base64');
    
    RETURN encoded_token;
END;
$$ LANGUAGE plpgsql;

-- Function to create vendor invitations
CREATE OR REPLACE FUNCTION create_vendor_invitation(vendor_email TEXT)
RETURNS TABLE(
    invitation_id UUID,
    token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    current_user_org UUID;
    current_user_email TEXT;
    new_token TEXT;
    invitation_record RECORD;
BEGIN
    -- Get current user's organization and email
    SELECT organization_id, email 
    INTO current_user_org, current_user_email
    FROM users 
    WHERE id = auth.uid() AND role = 'broker';
    
    IF current_user_org IS NULL THEN
        RAISE EXCEPTION 'Only brokers can create invitations';
    END IF;
    
    -- Generate token
    new_token := generate_invitation_token(current_user_org, current_user_email);
    
    -- Insert invitation
    INSERT INTO invitations (organization_id, created_by, email, token)
    VALUES (current_user_org, auth.uid(), vendor_email, new_token)
    RETURNING id, token, expires_at INTO invitation_record;
    
    -- Return the invitation details
    RETURN QUERY SELECT invitation_record.id, invitation_record.token, invitation_record.expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the users table constraint to allow NULL organization_id initially
ALTER TABLE users ALTER COLUMN organization_id DROP NOT NULL;

-- Add a trigger to automatically create user profile when auth user is created
-- This would typically be handled via Supabase Auth hooks, but we'll add a placeholder function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- This function would be called by Supabase Auth hooks
    -- For now, it's a placeholder since we handle user creation in the Netlify functions
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add some helpful indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_deals_submission_date ON deals(submission_date);
CREATE INDEX IF NOT EXISTS idx_deals_last_updated ON deals(last_updated);

-- Grant necessary permissions for the service role
-- These would typically be set up in Supabase dashboard
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
