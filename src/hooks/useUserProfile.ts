
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
      
      // First, try to get existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing profile:', fetchError);
      }

      // If profile exists, return enriched user
      if (existingProfile) {
        console.log('✅ Found existing profile for:', user.email, 'with role:', existingProfile.role);
        return {
          ...user,
          role: existingProfile.role || 'Vendor',
          name: existingProfile.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          partnerId: existingProfile.partner_id,
        } as AuthUser;
      }

      // Only create new profile if none exists
      console.log('Creating new profile for user:', user.id);
      
      // Determine role for new users
      const isDemoUser = user.email?.includes('demo-');
      const userRole = isDemoUser ? 
        (user.user_metadata?.role || 'Vendor') : 
        'Partner Admin'; // Default for regular new users
      
      const newProfile = {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        role: userRole,
        partner_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Use upsert to handle race conditions
      const { data: upsertedProfile, error: upsertError } = await supabase
        .from('users')
        .upsert(newProfile, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (upsertError) {
        console.error('Error upserting profile:', upsertError);
        
        // Try one more time to fetch if upsert failed
        const { data: fallbackProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
          
        if (fallbackProfile) {
          console.log('✅ Using fallback profile for:', user.email);
          return {
            ...user,
            role: fallbackProfile.role || 'Vendor',
            name: fallbackProfile.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            partnerId: fallbackProfile.partner_id,
          } as AuthUser;
        }
        
        throw upsertError;
      }

      console.log('✅ Upserted profile for:', user.email);
      return {
        ...user,
        role: upsertedProfile.role || 'Vendor',
        name: upsertedProfile.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        partnerId: upsertedProfile.partner_id,
      } as AuthUser;
      
    } catch (error) {
      console.error('Error in profile upsert:', error);
      // Return basic user data as fallback
      return {
        ...user,
        role: user.email?.includes('demo-') ? 'Vendor' : 'Partner Admin',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      } as AuthUser;
    }
  };

  const clearProfileCache = () => {
    console.log('🧹 Clearing profile cache');
    profileCache.clear();
    profileData.clear();
  };

  return {
    upsertUserProfile,
    clearProfileCache,
    isLoading,
  };
};
