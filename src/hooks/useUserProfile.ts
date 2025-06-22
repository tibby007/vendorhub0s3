
import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUser } from '@/types/auth';

export const useUserProfile = () => {
  const [isLoading, setIsLoading] = useState(false);

  const upsertUserProfile = async (user: User): Promise<AuthUser> => {
    setIsLoading(true);
    
    try {
      console.log('Upserting user profile for:', user.email);
      
      // First, try to get existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching profile:', fetchError);
      }

      let profile = existingProfile;

      // If no profile exists, create one
      if (!profile) {
        console.log('Creating new profile for user:', user.id);
        
        const newProfile = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          role: 'Vendor', // Default role
          partner_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: insertedProfile, error: insertError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          // Don't throw error, just use basic user data
          return {
            ...user,
            role: 'Vendor',
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          } as AuthUser;
        }

        profile = insertedProfile;
      }

      // Return enriched user object
      const enrichedUser: AuthUser = {
        ...user,
        role: profile?.role || 'Vendor',
        name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        partnerId: profile?.partner_id,
      };

      console.log('User profile enriched:', enrichedUser);
      return enrichedUser;
      
    } catch (error) {
      console.error('Unexpected error in upsertUserProfile:', error);
      // Return basic user data as fallback
      return {
        ...user,
        role: 'Vendor',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      } as AuthUser;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    upsertUserProfile,
    isLoading,
  };
};
