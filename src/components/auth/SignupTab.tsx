
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const SignupTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'Partner Admin'
  });

  const createUserProfile = async (userId: string, email: string, name: string, role: string) => {
    try {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          name: name,
          role: role
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        toast({
          title: "Profile Creation Failed",
          description: profileError.message,
          variant: "destructive",
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return false;
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: signupData.name,
            role: signupData.role
          }
        }
      });

      if (error) {
        toast({
          title: "Signup Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        const profileCreated = await createUserProfile(
          data.user.id,
          signupData.email,
          signupData.name,
          signupData.role
        );

        if (!profileCreated) {
          return;
        }

        toast({
          title: "Account Created Successfully",
          description: "You can now log in with your credentials. Email verification is optional.",
        });

        setSignupData({
          email: '',
          password: '',
          confirmPassword: '',
          name: '',
          role: 'Partner Admin'
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Sign up for a new account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-name">Full Name</Label>
            <Input
              id="signup-name"
              type="text"
              placeholder="Enter your full name"
              value={signupData.name}
              onChange={(e) => setSignupData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="Enter your email"
              value={signupData.email}
              onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              type="password"
              placeholder="Create a password"
              value={signupData.password}
              onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm your password"
              value={signupData.confirmPassword}
              onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SignupTab;
