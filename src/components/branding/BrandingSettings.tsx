
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Palette, Type, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDemoMode } from '@/hooks/useDemoMode';
import { savePartnerSettings } from '@/lib/partner-settings';

interface BrandingData {
  portalName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

const BrandingSettings = () => {
  const { toast } = useToast();
  const { isDemo } = useDemoMode();
  const [branding, setBranding] = useState<BrandingData>({
    portalName: 'VendorHub',
    logoUrl: '',
    primaryColor: '#16a34a', // vendor-green-600
    secondaryColor: '#f59e0b', // vendor-gold-500
    accentColor: '#ffffff'
  });

  const [isUploading, setIsUploading] = useState(false);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Simulate upload - in real implementation, use Supabase storage
      await new Promise(resolve => setTimeout(resolve, 2000));
      const fakeUrl = URL.createObjectURL(file);
      setBranding(prev => ({ ...prev, logoUrl: fakeUrl }));
      toast({
        title: isDemo ? "Demo: Logo uploaded successfully" : "Logo uploaded successfully",
        description: isDemo ? "This is a demo - logo changes are not persisted." : "Your brand logo has been updated."
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Show demo-specific message or save normally
      if (isDemo) {
        toast({
          title: "Demo: Branding settings saved",
          description: "Changes are not persisted in demo mode, but you can see the live preview above!"
        });
      } else {
        // Save branding settings to database in real mode
        await savePartnerSettings({
          brand_color: branding.primaryColor,
          company_logo: branding.logoUrl || null
        });
        
        toast({
          title: "Branding settings saved",
          description: "Your branding settings have been updated successfully."
        });
      }
    } catch (error: any) {
      console.error('Error saving branding settings:', error);
      toast({
        title: "Save failed",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  };

  const presetColors = [
    { name: 'VendorHub Green', primary: '#16a34a', secondary: '#f59e0b' },
    { name: 'Corporate Blue', primary: '#2563eb', secondary: '#dc2626' },
    { name: 'Professional Purple', primary: '#7c3aed', secondary: '#ea580c' },
    { name: 'Modern Teal', primary: '#0891b2', secondary: '#db2777' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">White-Label Branding</h2>
        <p className="text-gray-600">Customize your portal's appearance and branding</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Logo Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {branding.logoUrl ? (
                  <div className="space-y-4">
                    <img 
                      src={branding.logoUrl} 
                      alt="Brand logo" 
                      className="h-16 mx-auto object-contain"
                    />
                    <p className="text-sm text-gray-600">Current logo</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <p className="text-gray-600">Upload your company logo</p>
                    <p className="text-xs text-gray-500">Recommended: PNG or SVG, max 2MB</p>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                  className="mt-4"
                />
                {isUploading && (
                  <p className="text-sm text-blue-600 mt-2">Uploading...</p>
                )}
              </div>
              
              <div className="text-center text-sm text-gray-500">or</div>
              
              <div>
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  type="url"
                  value={branding.logoUrl}
                  onChange={(e) => setBranding(prev => ({ ...prev, logoUrl: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">Enter a direct URL to your logo image</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portal Name */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="w-5 h-5" />
              Portal Name
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="portalName">Portal Name</Label>
                <Input
                  id="portalName"
                  value={branding.portalName}
                  onChange={(e) => setBranding(prev => ({ ...prev, portalName: e.target.value }))}
                  placeholder="Your Company Portal"
                />
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Preview:</p>
                <p className="text-xl font-bold" style={{ color: branding.primaryColor }}>
                  {branding.portalName || 'Your Company Portal'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Customization */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Color Scheme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-20 h-10"
                  />
                  <Input
                    value={branding.primaryColor}
                    onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                    placeholder="#16a34a"
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={branding.secondaryColor}
                    onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-20 h-10"
                  />
                  <Input
                    value={branding.secondaryColor}
                    onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    placeholder="#f59e0b"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="accentColor">Accent Color</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="accentColor"
                    type="color"
                    value={branding.accentColor}
                    onChange={(e) => setBranding(prev => ({ ...prev, accentColor: e.target.value }))}
                    className="w-20 h-10"
                  />
                  <Input
                    value={branding.accentColor}
                    onChange={(e) => setBranding(prev => ({ ...prev, accentColor: e.target.value }))}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Color Presets */}
            <div className="mt-6">
              <Label>Color Presets</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {presetColors.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => setBranding(prev => ({
                      ...prev,
                      primaryColor: preset.primary,
                      secondaryColor: preset.secondary
                    }))}
                    className="p-3 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-2 mb-2">
                      <div 
                        className="w-6 h-6 rounded" 
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div 
                        className="w-6 h-6 rounded" 
                        style={{ backgroundColor: preset.secondary }}
                      />
                    </div>
                    <p className="text-xs text-gray-600">{preset.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview */}
            <div className="mt-6 p-6 border rounded-lg" style={{ 
              background: `linear-gradient(135deg, ${branding.primaryColor}10 0%, ${branding.secondaryColor}10 100%)`
            }}>
              <h3 className="font-medium text-gray-700 mb-4">Live Preview</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {branding.logoUrl && (
                    <img src={branding.logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
                  )}
                  <span className="text-xl font-bold" style={{ color: branding.primaryColor }}>
                    {branding.portalName}
                  </span>
                </div>
                <Button style={{ backgroundColor: branding.primaryColor }}>
                  Sample Button
                </Button>
                <div 
                  className="inline-block px-3 py-1 rounded text-sm font-medium text-white"
                  style={{ backgroundColor: branding.secondaryColor }}
                >
                  Sample Badge
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Branding Settings
        </Button>
      </div>
    </div>
  );
};

export default BrandingSettings;
