
import { useAuth } from '@/contexts/AuthContext';

export const useRoleCheck = () => {
  const { user } = useAuth();

  const isSuperAdmin = () => {
    return user?.role === 'Super Admin';
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

  return {
    isSuperAdmin,
    isPartnerAdmin,
    isVendor,
    hasRole,
    canCreatePartnerAdmin,
    canManageVendors,
    currentRole: user?.role
  };
};
