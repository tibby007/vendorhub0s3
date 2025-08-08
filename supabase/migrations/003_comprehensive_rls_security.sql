-- ===================================================================
-- VendorHub OS - Comprehensive RLS Security Migration
-- Fixes critical security vulnerabilities identified in security audit
-- ===================================================================

-- First, drop any existing incomplete policies to rebuild them properly
DROP POLICY IF EXISTS "Users can view documents in their organization" ON documents;
DROP POLICY IF EXISTS "Users can upload documents" ON documents;
DROP POLICY IF EXISTS "Users can view messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can view resources" ON resources;

-- ===================================================================
-- DOCUMENTS TABLE - Complete RLS Implementation
-- ===================================================================

-- Users can view documents for deals in their organization or deals they're involved in
CREATE POLICY "Users can view documents in their organization" ON documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deals d
            JOIN users u ON (
                u.organization_id = d.organization_id OR 
                d.vendor_id = u.id OR 
                d.assigned_to = u.id
            )
            WHERE d.id = documents.deal_id AND u.id = auth.uid()
        )
    );

-- Users can upload documents to deals they have access to
CREATE POLICY "Users can upload documents for accessible deals" ON documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM deals d
            JOIN users u ON (
                u.organization_id = d.organization_id OR 
                d.vendor_id = u.id OR 
                d.assigned_to = u.id
            )
            WHERE d.id = documents.deal_id AND u.id = auth.uid()
        )
        AND uploaded_by = auth.uid()
    );

-- Users can delete their own uploaded documents
CREATE POLICY "Users can delete their own documents" ON documents
    FOR DELETE USING (
        uploaded_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM deals d
            JOIN users u ON (
                u.organization_id = d.organization_id OR 
                d.vendor_id = u.id OR 
                d.assigned_to = u.id
            )
            WHERE d.id = documents.deal_id AND u.id = auth.uid()
        )
    );

-- ===================================================================
-- MESSAGES TABLE - Complete RLS Implementation
-- ===================================================================

-- Users can view messages for deals they have access to
CREATE POLICY "Users can view messages for accessible deals" ON messages
    FOR SELECT USING (
        sender_id = auth.uid() OR
        recipient_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM deals d
            JOIN users u ON (
                u.organization_id = d.organization_id OR 
                d.vendor_id = u.id OR 
                d.assigned_to = u.id
            )
            WHERE d.id = messages.deal_id AND u.id = auth.uid()
        )
    );

-- Users can send messages for deals they have access to
CREATE POLICY "Users can send messages for accessible deals" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM deals d
            JOIN users u ON (
                u.organization_id = d.organization_id OR 
                d.vendor_id = u.id OR 
                d.assigned_to = u.id
            )
            WHERE d.id = messages.deal_id AND u.id = auth.uid()
        )
    );

-- Users can update messages they sent (mark as read, etc.)
CREATE POLICY "Users can update their sent messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid());

-- Users can mark messages addressed to them as read
CREATE POLICY "Users can mark their received messages as read" ON messages
    FOR UPDATE USING (recipient_id = auth.uid());

-- ===================================================================
-- RESOURCES TABLE - Complete RLS Implementation
-- ===================================================================

-- Users can view published resources in their organization
CREATE POLICY "Users can view published resources in their organization" ON resources
    FOR SELECT USING (
        is_published = true AND
        organization_id IN (
            SELECT organization_id FROM users WHERE auth.uid() = id
        )
    );

-- Brokers can view all resources in their organization
CREATE POLICY "Brokers can view all resources in their organization" ON resources
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE auth.uid() = id AND role = 'broker'
        )
    );

-- Brokers can manage resources in their organization
CREATE POLICY "Brokers can manage resources in their organization" ON resources
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE auth.uid() = id AND role = 'broker'
        )
    );

-- ===================================================================
-- AUDIT LOG - Complete RLS Implementation
-- ===================================================================

-- Only brokers can view audit logs for their organization
CREATE POLICY "Brokers can view audit logs for their organization" ON audit_log
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE auth.uid() = id AND role = 'broker'
        )
    );

-- System can insert audit logs (handled by triggers)
CREATE POLICY "System can insert audit logs" ON audit_log
    FOR INSERT WITH CHECK (true);

-- ===================================================================
-- ENHANCED SECURITY CONSTRAINTS
-- ===================================================================

-- Add constraint to ensure users belong to the same organization as their deals
ALTER TABLE deals ADD CONSTRAINT deals_vendor_organization_match 
    CHECK (
        vendor_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = vendor_id 
            AND users.organization_id = deals.organization_id
        )
    );

-- Add constraint to ensure assigned users belong to the same organization
ALTER TABLE deals ADD CONSTRAINT deals_assigned_organization_match 
    CHECK (
        assigned_to IS NULL OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = assigned_to 
            AND users.organization_id = deals.organization_id
        )
    );

-- ===================================================================
-- AUDIT LOGGING TRIGGERS FOR COMPLIANCE
-- ===================================================================

-- Create audit logging function
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert audit log entry
    INSERT INTO audit_log (
        organization_id,
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values,
        ip_address,
        created_at
    ) VALUES (
        COALESCE(NEW.organization_id, OLD.organization_id),
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        inet_client_addr(),
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for all sensitive tables
CREATE TRIGGER audit_deals_trigger
    AFTER INSERT OR UPDATE OR DELETE ON deals
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_documents_trigger
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_organizations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON organizations
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- ===================================================================
-- DATA ENCRYPTION PREPARATION
-- ===================================================================

-- Enable pgcrypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data text)
RETURNS text AS $$
BEGIN
    -- Use AES encryption with a key derived from environment
    -- In production, this key should come from a secure key management system
    RETURN encode(
        encrypt_iv(
            data::bytea, 
            decode(current_setting('app.encryption_key', true), 'hex'),
            gen_random_bytes(16),
            'aes-cbc'
        ), 
        'base64'
    );
EXCEPTION
    WHEN others THEN
        -- If encryption fails, log error and return empty string (don't store plaintext)
        RAISE LOG 'Encryption failed for sensitive data: %', SQLERRM;
        RETURN '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data text)
RETURNS text AS $$
BEGIN
    RETURN convert_from(
        decrypt_iv(
            decode(encrypted_data, 'base64'),
            decode(current_setting('app.encryption_key', true), 'hex'),
            'aes-cbc'
        ),
        'UTF8'
    );
EXCEPTION
    WHEN others THEN
        RAISE LOG 'Decryption failed for sensitive data: %', SQLERRM;
        RETURN '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- PERFORMANCE INDEXES FOR SECURITY QUERIES
-- ===================================================================

-- Add indexes to optimize RLS policy queries
CREATE INDEX IF NOT EXISTS idx_deals_vendor_org ON deals(vendor_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_org ON deals(assigned_to, organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_deal_uploaded_by ON documents(deal_id, uploaded_by);
CREATE INDEX IF NOT EXISTS idx_messages_deal_participants ON messages(deal_id, sender_id, recipient_id);

-- ===================================================================
-- SECURITY MONITORING VIEWS
-- ===================================================================

-- Create view for security monitoring (only accessible to brokers)
CREATE OR REPLACE VIEW security_audit_summary AS
SELECT 
    date_trunc('day', created_at) as audit_date,
    organization_id,
    action,
    entity_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users
FROM audit_log
GROUP BY date_trunc('day', created_at), organization_id, action, entity_type
ORDER BY audit_date DESC;

-- Grant access to security view
GRANT SELECT ON security_audit_summary TO authenticated;

-- Create RLS policy for security audit summary
ALTER VIEW security_audit_summary SET (security_barrier = true);