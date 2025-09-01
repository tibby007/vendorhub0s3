
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Settings, Bell, Shield, Palette, CreditCard, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoMode } from '@/hooks/useDemoMode';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import SubscriptionManager from '@/components/subscription/SubscriptionManager';
import ResourcesManagement from '@/components/resources/ResourcesManagement';
import StorageUsageCard from '@/components/dashboard/StorageUsageCard';
import SecurityAuditPanel from '@/components/security/SecurityAuditPanel';
import { savePartnerSettings } from '@/lib/partner-settings';
import { getCurrentPartner } from '@/lib/partners';
import { logDebug } from '@/lib/log';

interface PartnerProfile {
  id: string;
  name: string;
  contact_email: string;
  contact_phone?: string;
  notification_email?: boolean;
  notification_sms?: boolean;
  auto_approval?: boolean;
  approval_threshold?: number;
}

const PartnerSettings = () => {
  const { user } = useAuth();
  const { isDemo } = useDemoMode();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [profile, setProfile] = useState<PartnerProfile>({
    id: '',
    name: '',
    contact_email: '',
    contact_phone: '',
    notification_email: true,
    notification_sms: false,
    auto_approval: false,
    approval_threshold: 1000
  });

  const fetchPartnerProfile = useCallback(async () => {
    if (!user?.email) return;

    setIsLoading(true);
    
    // Check for demo mode using multiple methods
    const isDemoMode = isDemo || 
                      sessionStorage.getItem('demoCredentials') !== null ||
                      user.email === 'partner@demo.com' ||
                      user.id === 'demo-partner-123';

    if (isDemoMode) {
      console.log('🎭 PartnerSettings: Using mock data in demo mode');
      // Use demo profile data
      setProfile({
        id: 'demo-partner-123',
        name: 'Demo Partner Company',
        contact_email: 'partner@demo.com',
        contact_phone: '(555) 123-4567',
        notification_email: true,
        notification_sms: false,
        auto_approval: false,
        approval_threshold: 1000
      });
      setIsLoading(false);
      return;
    }

    try {
      const partner = await getCurrentPartner();
      logDebug("PARTNER_RESOLVED", { id: partner.id, email: partner.contact_email });
      
      setProfile({
        id: partner.id,
        name: partner.name || '',
        contact_email: partner.contact_email,
        contact_phone: partner.contact_phone || '',
        notification_email: true, // Default values for fields not in helper
        notification_sms: false,
        auto_approval: false,
        approval_threshold: 1000
      });
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
  }, [user?.email, isDemo]);

  useEffect(() => {
    if (user?.id) {
      fetchPartnerProfile();
    }
  }, [user?.id, fetchPartnerProfile]);

  const saveProfile = useCallback(async () => {
    if (!user?.id) return;

    // Check for demo mode using multiple methods
    const isDemoMode = isDemo || 
                      sessionStorage.getItem('demoCredentials') !== null ||
                      user.email === 'partner@demo.com' ||
                      user.id === 'demo-partner-123';

    if (isDemoMode) {
      console.log('🎭 PartnerSettings: Simulating save in demo mode');
      setIsSaving(true);
      // Simulate save delay
      setTimeout(() => {
        toast({
          title: "Demo: Settings Saved",
          description: "Partner settings saved successfully (demo mode)",
        });
        setIsSaving(false);
      }, 1000);
      return;
    }

    setIsSaving(true);
    try {
      logDebug("PARTNER_SETTINGS_SAVE", { profile, user: { id: user.id, email: user.email } });
      
      await savePartnerSettings({
        name: profile.name || undefined,
        contact_email: profile.contact_email || undefined,
        contact_phone: profile.contact_phone || undefined
      });

      // Refetch the partner profile to reflect the saved changes
      await fetchPartnerProfile();

      toast({
        title: "Success",
        description: "Partner settings saved successfully",
      });
    } catch (error: any) {
      console.error('Error saving partner settings:', error);
      toast({
        title: "Error",
        description: `Failed to save partner settings: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, user?.email, isDemo, profile]);

  const handleInputChange = useCallback((field: keyof PartnerProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  }, []);

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
              <div className="text-center py-8">
                <p className="text-gray-600">Branding features are currently being updated.</p>
                <p className="text-sm text-gray-500 mt-2">This feature will be available soon.</p>
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
