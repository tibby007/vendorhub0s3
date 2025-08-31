
import { useAuth } from '@/contexts/AuthContext';

export const useRoleCheck = () => {
  const { user } = useAuth();

  const isSuperAdmin = () => {
    // OWNER BYPASS: support@emergestack.dev is always SuperAdmin
    if (user?.email === 'support@emergestack.dev') {
      console.log('🔍 ROLE CHECK - Owner bypass: treating as Super Admin');
      return true;
    }
    
    const result = user?.role === 'Super Admin';
    console.log('🔍 ROLE CHECK - isSuperAdmin():', result, 'user.role:', user?.role, 'user.email:', user?.email);
    return result;
  };

  const isPartnerAdmin = () => {
    return user?.role === 'Partner Admin';
  };

  const isVendor = () => {
    return user?.role === 'Vendor';
  };

  const hasRole = (role: string) => {
    return user?.role === role;
  };

  const canCreatePartnerAdmin = () => {
    return isSuperAdmin();
  };

  const canManageVendors = () => {
    return isSuperAdmin() || isPartnerAdmin();
  };

  // OWNER BYPASS: Show 'Super Admin' role for owner account
  const getCurrentRole = () => {
    if (user?.email === 'support@emergestack.dev') {
      return 'Super Admin';
    }
    return user?.role;
  };

  return {
    isSuperAdmin,
    isPartnerAdmin,
    isVendor,
    hasRole,
    canCreatePartnerAdmin,
    canManageVendors,
    currentRole: getCurrentRole()
  };
};
