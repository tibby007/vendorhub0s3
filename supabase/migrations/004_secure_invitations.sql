-- ===================================================================
-- VendorHub OS - Secure Invitation System
-- Replaces insecure Base64 token system with cryptographically secure tokens
-- ===================================================================

-- Create invitations table for secure token management
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'vendor',
    token_hash VARCHAR(255) NOT NULL UNIQUE, -- SHA-256 hash of secure token
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_invitations_token_hash ON invitations(token_hash);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_org ON invitations(organization_id);
CREATE INDEX idx_invitations_expires ON invitations(expires_at) WHERE used_at IS NULL;

-- Enable RLS for invitations table
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Brokers can manage invitations in their organization
CREATE POLICY "Brokers can manage invitations in their organization" ON invitations
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE auth.uid() = id AND role = 'broker'
        )
    );

-- RLS Policy: Anyone can validate invitations (for registration)
-- This is needed for the validation endpoint to work
CREATE POLICY "Anyone can validate invitation tokens" ON invitations
    FOR SELECT USING (
        expires_at > NOW() AND 
        used_at IS NULL
    );

-- Function to generate secure invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token(
    p_organization_id UUID,
    p_invited_by UUID,
    p_email VARCHAR(255),
    p_role user_role DEFAULT 'vendor',
    p_expires_hours INTEGER DEFAULT 72
)
RETURNS TEXT AS $$
DECLARE
    secure_token TEXT;
    token_hash TEXT;
BEGIN
    -- Generate cryptographically secure random token (32 bytes = 256 bits)
    secure_token := encode(gen_random_bytes(32), 'base64url');
    
    -- Create SHA-256 hash of the token for storage
    token_hash := encode(digest(secure_token, 'sha256'), 'hex');
    
    -- Insert invitation record with hashed token
    INSERT INTO invitations (
        organization_id,
        invited_by,
        email,
        role,
        token_hash,
        expires_at
    ) VALUES (
        p_organization_id,
        p_invited_by,
        p_email,
        p_role,
        token_hash,
        NOW() + (p_expires_hours || ' hours')::INTERVAL
    );
    
    -- Return the actual token (not the hash) for sending in invitation email
    RETURN secure_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate invitation token
CREATE OR REPLACE FUNCTION validate_invitation_token(p_token TEXT)
RETURNS TABLE(
    invitation_id UUID,
    organization_id UUID,
    organization_name VARCHAR(255),
    email VARCHAR(255),
    role user_role,
    invited_by_name TEXT,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    token_hash TEXT;
BEGIN
    -- Create hash of provided token
    token_hash := encode(digest(p_token, 'sha256'), 'hex');
    
    -- Find valid invitation
    RETURN QUERY
    SELECT 
        i.id,
        i.organization_id,
        o.name,
        i.email,
        i.role,
        CONCAT(u.first_name, ' ', u.last_name),
        i.expires_at
    FROM invitations i
    JOIN organizations o ON o.id = i.organization_id
    LEFT JOIN users u ON u.id = i.invited_by
    WHERE 
        i.token_hash = validate_invitation_token.token_hash
        AND i.expires_at > NOW()
        AND i.used_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark invitation as used
CREATE OR REPLACE FUNCTION mark_invitation_used(p_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    token_hash TEXT;
    rows_affected INTEGER;
BEGIN
    -- Create hash of provided token
    token_hash := encode(digest(p_token, 'sha256'), 'hex');
    
    -- Mark invitation as used
    UPDATE invitations 
    SET used_at = NOW()
    WHERE 
        token_hash = mark_invitation_used.token_hash
        AND expires_at > NOW()
        AND used_at IS NULL;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired invitations (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM invitations 
    WHERE expires_at < NOW() - INTERVAL '7 days'; -- Keep expired for 7 days for audit
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit logging for invitations
CREATE TRIGGER audit_invitations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON invitations
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION generate_invitation_token TO authenticated;
GRANT EXECUTE ON FUNCTION validate_invitation_token TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mark_invitation_used TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_invitations TO authenticated;