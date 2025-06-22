
import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUser } from '@/types/auth';

// Simple in-memory cache to prevent duplicate requests
const profileCache = new Map<string, Promise<AuthUser>>();
const profileData = new Map<string, AuthUser>();

export const useUserProfile = () => {
  const [isLoading, setIsLoading] = useState(false);

  const upsertUserProfile = async (user: User): Promise<AuthUser> => {
    // Return cached data if available
    if (profileData.has(user.id)) {
      console.log('🎯 Using cached profile for:', user.email);
      return profileData.get(user.id)!;
    }

    // Return existing promise if already in progress
    if (profileCache.has(user.id)) {
      console.log('⏳ Profile request already in progress for:', user.email);
      return profileCache.get(user.id)!;
    }

    setIsLoading(true);
    
    const profilePromise = performUpsertProfile(user);
    profileCache.set(user.id, profilePromise);
    
    try {
      const result = await profilePromise;
      profileData.set(user.id, result);
      return result;
    } finally {
      profileCache.delete(user.id);
      setIsLoading(false);
    }
  };

  const performUpsertProfile = async (user: User): Promise<AuthUser> => {
    try {
      console.log('Upserting user profile for:', user.email);
      
      // First, try to get existing profile with retry logic
      let profile = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          const { data: existingProfile, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
          }

          profile = existingProfile;
          break;
        } catch (error: any) {
          retryCount++;
          if (error.message?.includes('Failed to fetch') || error.message?.includes('INSUFFICIENT_RESOURCES')) {
            if (retryCount < maxRetries) {
              console.log(`🔄 Retrying profile fetch (attempt ${retryCount}/${maxRetries}) for:`, user.email);
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000)); // Exponential backoff
              continue;
            }
          }
          throw error;
        }
      }

      // If profile exists, return enriched user
      if (profile) {
        console.log('✅ Found existing profile for:', user.email);
        return {
          ...user,
          role: profile.role || 'Vendor',
          name: profile.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          partnerId: profile.partner_id,
        } as AuthUser;
      }

      // Only create new profile if none exists
      console.log('Creating new profile for user:', user.id);
      
      const newProfile = {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        role: 'Vendor',
        partner_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      retryCount = 0;
      while (retryCount < maxRetries) {
        try {
          const { data: insertedProfile, error: insertError } = await supabase
            .from('users')
            .insert(newProfile)
            .select()
            .single();

          if (insertError) {
            // If user already exists, fetch it instead
            if (insertError.code === '23505') {
              console.log('👤 Profile already exists, fetching existing profile');
              const { data: existingProfile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();
              
              if (existingProfile) {
                return {
                  ...user,
                  role: existingProfile.role || 'Vendor',
                  name: existingProfile.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                  partnerId: existingProfile.partner_id,
                } as AuthUser;
              }
            }
            throw insertError;
          }

          console.log('✅ Created new profile for:', user.email);
          return {
            ...user,
            role: insertedProfile.role || 'Vendor',
            name: insertedProfile.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            partnerId: insertedProfile.partner_id,
          } as AuthUser;
        } catch (error: any) {
          retryCount++;
          if (error.message?.includes('Failed to fetch') || error.message?.includes('INSUFFICIENT_RESOURCES')) {
            if (retryCount < maxRetries) {
              console.log(`🔄 Retrying profile creation (attempt ${retryCount}/${maxRetries}) for:`, user.email);
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
              continue;
            }
          }
          throw error;
        }
      }

      // Fallback if all retries failed
      throw new Error('Failed to create profile after retries');
      
    } catch (error) {
      console.error('Error in profile upsert:', error);
      // Return basic user data as fallback
      return {
        ...user,
        role: 'Vendor',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      } as AuthUser;
    }
  };

  const clearProfileCache = () => {
    profileCache.clear();
    profileData.clear();
  };

  return {
    upsertUserProfile,
    clearProfileCache,
    isLoading,
  };
};
