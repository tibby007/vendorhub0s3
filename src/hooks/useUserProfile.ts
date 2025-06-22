
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthUser extends User {
  role?: string;
  name?: string;
  partnerId?: string;
}

export const useUserProfile = () => {
  const upsertUserProfile = async (authUser: User): Promise<AuthUser> => {
    try {
      console.log('Upserting user profile for:', authUser.id);
      
      // First check if user exists
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking existing user:', selectError);
      }

      let userData;
      
      if (existingUser) {
        console.log('User profile already exists, using existing data:', existingUser);
        userData = existingUser;
      } else {
        // Create new profile with proper defaults
        const defaultRole = authUser.user_metadata?.role || 'Partner Admin';
        const defaultName = authUser.user_metadata?.name || 
                           authUser.email?.split('@')[0] || 
                           'User';

        console.log('Creating new user profile with:', { defaultRole, defaultName });
        
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email || '',
            name: defaultName,
            role: defaultRole,
            partner_id: defaultRole === 'Partner Admin' ? crypto.randomUUID() : null
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user profile:', insertError);
          // If insert fails due to conflict, try to fetch existing user again
          if (insertError.code === '23505') {
            console.log('Conflict detected, fetching existing user...');
            const { data: conflictUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', authUser.id)
              .single();
            userData = conflictUser;
          } else {
            throw insertError;
          }
        } else {
          userData = newUser;
        }
      }

      // Return enriched user data
      return {
        ...authUser,
        role: userData?.role || authUser.user_metadata?.role || 'Partner Admin',
        name: userData?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        partnerId: userData?.partner_id,
      } as AuthUser;

    } catch (err) {
      console.error('Error in upsertUserProfile:', err);
      // Fallback to user metadata if available
      return {
        ...authUser,
        role: authUser.user_metadata?.role || 'Partner Admin',
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        partnerId: null,
      } as AuthUser;
    }
  };

  return { upsertUserProfile };
};
