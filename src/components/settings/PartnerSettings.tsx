
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Settings, Bell, Shield, Palette, CreditCard, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import SubscriptionManager from '@/components/subscription/SubscriptionManager';
import ResourcesManagement from '@/components/resources/ResourcesManagement';
import StorageUsageCard from '@/components/dashboard/StorageUsageCard';
import SecurityAuditPanel from '@/components/security/SecurityAuditPanel';

interface PartnerProfile {
  id: string;
  name: string;
  contact_email: string;
  contact_phone?: string;
  company_logo?: string;
  brand_color?: string;
  notification_email?: boolean;
  notification_sms?: boolean;
  auto_approval?: boolean;
  approval_threshold?: number;
}

const PartnerSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [profile, setProfile] = useState<PartnerProfile>({
    id: '',
    name: '',
    contact_email: '',
    contact_phone: '',
    company_logo: '',
    brand_color: '#10B981',
    notification_email: true,
    notification_sms: false,
    auto_approval: false,
    approval_threshold: 1000
  });

  useEffect(() => {
    if (user?.id) {
      fetchPartnerProfile();
    }
  }, [user]);

  const fetchPartnerProfile = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      console.log('[PartnerSettings] Fetching profile for user:', { id: user.id, email: user.email, partner_id: (user as any).partner_id });
      
      // First, try to get from partners table using partner_id if available
      let partnerData = null;
      let partnerError = null;
      
      if ((user as any).partner_id) {
        console.log('[PartnerSettings] User has partner_id, querying by id:', (user as any).partner_id);
        const result = await supabase
          .from('partners')
          .select('*')
          .eq('id', (user as any).partner_id)
          .maybeSingle();
        
        partnerData = result.data;
        partnerError = result.error;
      } else {
        console.log('[PartnerSettings] No partner_id, querying by contact_email:', user.email);
        const result = await supabase
          .from('partners')
          .select('*')
          .eq('contact_email', user.email)
          .maybeSingle();
        
        partnerData = result.data;
        partnerError = result.error;
      }

      if (partnerError && partnerError.code !== 'PGRST116') {
        console.error('[PartnerSettings] Database error:', partnerError);
        throw partnerError;
      }

      if (partnerData) {
        console.log('[PartnerSettings] Found partner data:', partnerData);
        setProfile({
          id: partnerData.id,
          name: partnerData.name,
          contact_email: partnerData.contact_email,
          contact_phone: partnerData.contact_phone || '',
          company_logo: partnerData.company_logo || '',
          brand_color: partnerData.brand_color || '#10B981',
          notification_email: partnerData.notification_email ?? true,
          notification_sms: partnerData.notification_sms ?? false,
          auto_approval: partnerData.auto_approval ?? false,
          approval_threshold: partnerData.approval_threshold || 1000
        });
      } else {
        console.log('[PartnerSettings] No partner data found, using user data as fallback');
        // Use user data as fallback
        setProfile(prev => ({
          ...prev,
          name: user.name || '',
          contact_email: user.email || ''
        }));
      }
    } catch (error: any) {
      console.error('Error fetching partner profile:', error);
      toast({
        title: "Error",
        description: `Failed to load partner settings: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      console.log('[PartnerSettings] Saving profile:', profile);
      console.log('[PartnerSettings] Current user:', { id: user.id, email: user.email, partner_id: (user as any).partner_id });
      
      // Check if we have existing subscription data to preserve
      const { data: existingSubscriber } = await supabase
        .from('subscribers')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();
      
      console.log('[PartnerSettings] Existing subscriber data:', existingSubscriber);
      
      // Prepare upsert data with all required fields, preserving subscription info
      const upsertData: any = {
        name: profile.name || user?.name || 'New Partner',
        contact_email: profile.contact_email || user?.email,
        contact_phone: profile.contact_phone || '',
        company_logo: profile.company_logo || null,
        brand_color: profile.brand_color || '#10B981',
        notification_email: profile.notification_email,
        notification_sms: profile.notification_sms,
        auto_approval: profile.auto_approval,
        approval_threshold: profile.approval_threshold,
        plan_type: existingSubscriber?.subscription_tier?.toLowerCase() || 'basic',
        billing_status: existingSubscriber?.status || 'trialing',
        vendor_limit: existingSubscriber?.subscription_tier?.toLowerCase() === 'pro' ? 7 : 
                     existingSubscriber?.subscription_tier?.toLowerCase() === 'premium' ? 999999 : 3,
        storage_limit: existingSubscriber?.subscription_tier?.toLowerCase() === 'pro' ? 26843545600 : 
                      existingSubscriber?.subscription_tier?.toLowerCase() === 'premium' ? 107374182400 : 5368709120,
        storage_used: 0,
        trial_end: existingSubscriber?.trial_end || null,
        current_period_end: existingSubscriber?.subscription_end || null,
        stripe_customer_id: existingSubscriber?.stripe_customer_id || null,
        stripe_subscription_id: existingSubscriber?.stripe_subscription_id || null,
        updated_at: new Date().toISOString()
      };
      
      console.log('[PartnerSettings] Upsert data prepared:', upsertData);
      
      // Try to update existing record first if we have an ID
      if (profile.id) {
        console.log('[PartnerSettings] Updating existing partner with ID:', profile.id);
        upsertData.id = profile.id;
        
        const { data, error } = await supabase
          .from('partners')
          .upsert(upsertData, { onConflict: 'id' })
          .select()
          .single();

        if (error) {
          console.error('[PartnerSettings] Update failed:', error);
          throw error;
        }
        
        console.log('[PartnerSettings] Update successful:', data);
      } else {
        // Create new record
        console.log('[PartnerSettings] Creating new partner record');
        upsertData.created_at = new Date().toISOString();
        
        const { data, error } = await supabase
          .from('partners')
          .insert(upsertData)
          .select()
          .single();

        if (error) {
          console.error('[PartnerSettings] Insert failed:', error);
          throw error;
        }
        
        console.log('[PartnerSettings] Insert successful:', data);
        setProfile(prev => ({ ...prev, id: data.id }));
        
        // Update user's partner_id if not set
        if (!(user as any).partner_id) {
          console.log('[PartnerSettings] Updating user partner_id to:', data.id);
          const { error: userUpdateError } = await supabase
            .from('users')
            .update({ partner_id: data.id })
            .eq('id', user.id);
          
          if (userUpdateError) {
            console.error('[PartnerSettings] Failed to update user partner_id:', userUpdateError);
          }
        }
      }

      toast({
        title: "Success",
        description: "Partner settings saved successfully",
      });
    } catch (error: any) {
      console.error('Error saving partner settings:', error);
      toast({
        title: "Error",
        description: "Failed to save partner settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof PartnerProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Partner Settings</h2>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vendor-green-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Partner Settings</h2>
            <p className="text-gray-600">Manage your partner profile and preferences</p>
          </div>
        </div>
        <Button onClick={saveProfile} disabled={isSaving} className="bg-vendor-green-600 hover:bg-vendor-green-700">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Resources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Partner Profile</CardTitle>
                <CardDescription>Update your basic partner information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Your Company Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Contact Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      placeholder="contact@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Contact Phone</Label>
                    <Input
                      id="phone"
                      value={profile.contact_phone}
                      onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {profile.id && (
              <StorageUsageCard partnerId={profile.id} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="subscription">
          <SubscriptionManager />
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding Settings</CardTitle>
              <CardDescription>Customize your brand appearance in the vendor portal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand-color">Brand Color</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="brand-color"
                    type="color"
                    value={profile.brand_color}
                    onChange={(e) => handleInputChange('brand_color', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={profile.brand_color}
                    onChange={(e) => handleInputChange('brand_color', e.target.value)}
                    placeholder="#10B981"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Company Logo URL</Label>
                <Input
                  id="logo"
                  value={profile.company_logo}
                  onChange={(e) => handleInputChange('company_logo', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-sm text-gray-600">
                  Upload your logo to a hosting service and paste the URL here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={profile.notification_email}
                  onCheckedChange={(checked) => handleInputChange('notification_email', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sms-notifications">SMS Notifications</Label>
                  <p className="text-sm text-gray-600">Receive notifications via text message</p>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={profile.notification_sms}
                  onCheckedChange={(checked) => handleInputChange('notification_sms', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security and approval settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-approval">Auto Approval</Label>
                  <p className="text-sm text-gray-600">Automatically approve submissions under threshold</p>
                </div>
                <Switch
                  id="auto-approval"
                  checked={profile.auto_approval}
                  onCheckedChange={(checked) => handleInputChange('auto_approval', checked)}
                />
              </div>
              {profile.auto_approval && (
                <div className="space-y-2">
                  <Label htmlFor="threshold">Auto Approval Threshold ($)</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={profile.approval_threshold}
                    onChange={(e) => handleInputChange('approval_threshold', parseInt(e.target.value) || 0)}
                    placeholder="1000"
                  />
                  <p className="text-sm text-gray-600">
                    Applications under this amount will be automatically approved
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <ResourcesManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PartnerSettings;
