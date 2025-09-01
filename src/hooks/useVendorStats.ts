import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { mockVendorStats } from '@/data/mockVendorData';

interface VendorStats {
  total: number;
  pending: number;
  approved: number;
}

export const useVendorStats = () => {
  const { user } = useAuth();
  const [submissionStats, setSubmissionStats] = useState<VendorStats>({
    total: 0,
    pending: 0,
    approved: 0
  });

  useEffect(() => {
    const fetchSubmissionStats = async () => {
      if (!user?.id) return;
      
      // Check for demo mode using multiple methods
      const isDemo = user.email === 'vendor@demo.com' || 
                     user.email === 'partner@demo.com' ||
                     user.id === 'demo-partner-123' ||
                     user.id === 'demo-vendor-456' ||
                     sessionStorage.getItem('demoCredentials') !== null ||
                     sessionStorage.getItem('isDemoMode') !== null;
      
      if (isDemo) {
        console.log('🎭 Demo mode: Using mock vendor stats');
        setSubmissionStats({
          total: mockVendorStats.totalSubmissions,
          pending: mockVendorStats.pendingSubmissions,
          approved: mockVendorStats.approvedSubmissions
        });
        return;
      }
      
      try {
        // Get vendor record to find submissions
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (vendorError || !vendorData) {
          console.log('No vendor record found for user');
          return;
        }

        // Get submission statistics
        const { data: submissions, error: submissionsError } = await supabase
          .from('submissions')
          .select('status')
          .eq('vendor_id', vendorData.id);

        if (submissionsError) {
          console.error('Error fetching submissions:', submissionsError);
          return;
        }

        const total = submissions?.length || 0;
        const pending = submissions?.filter(s => s.status.toLowerCase() === 'pending').length || 0;
        const approved = submissions?.filter(s => s.status.toLowerCase() === 'approved').length || 0;

        setSubmissionStats({ total, pending, approved });
      } catch (error) {
        console.error('Error fetching submission stats:', error);
        // Fallback to mock data on error
        setSubmissionStats({
          total: mockVendorStats.totalSubmissions,
          pending: mockVendorStats.pendingSubmissions,
          approved: mockVendorStats.approvedSubmissions
        });
      }
    };

    fetchSubmissionStats();
  }, [user]);

  return submissionStats;
};