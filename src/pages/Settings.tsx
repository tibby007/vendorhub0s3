import React, { useState } from 'react';
import {
  CogIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  UserGroupIcon,
  PaintBrushIcon,
  BellIcon,
  ShieldCheckIcon,
  PhotoIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

interface OrganizationSettings {
  name: string;
  primary_color: string;
  secondary_color: string;
  logo_url?: string;
  subscription_tier: 'solo' | 'pro' | 'enterprise';
  notification_preferences: {
    email_notifications: boolean;
    deal_updates: boolean;
    vendor_invites: boolean;
    system_alerts: boolean;
  };
  white_label: {
    enabled: boolean;
    custom_domain?: string;
    custom_branding: boolean;
  };
}

// Mock organization data
const MOCK_ORGANIZATION: OrganizationSettings = {
  name: 'VendorHub Finance',
  primary_color: '#22C55E',
  secondary_color: '#F97316',
  logo_url: undefined,
  subscription_tier: 'pro',
  notification_preferences: {
    email_notifications: true,
    deal_updates: true,
    vendor_invites: true,
    system_alerts: false
  },
  white_label: {
    enabled: true,
    custom_domain: 'finance.vendorhub.com',
    custom_branding: true
  }
};

export const Settings: React.FC = () => {
  const { userProfile } = useAuth();
  const [settings, setSettings] = useState<OrganizationSettings>(MOCK_ORGANIZATION);
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'notifications' | 'subscription' | 'security'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 1000);
  };

  const updateSettings = (updates: Partial<OrganizationSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const updateNotificationPreferences = (key: keyof OrganizationSettings['notification_preferences'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [key]: value
      }
    }));
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'solo':
        return { name: 'Solo', price: '$49.99', color: 'bg-blue-100 text-blue-800' };
      case 'pro':
        return { name: 'Pro', price: '$97.99', color: 'bg-green-100 text-green-800' };
      case 'enterprise':
        return { name: 'Enterprise', price: '$397', color: 'bg-purple-100 text-purple-800' };
      default:
        return { name: 'Solo', price: '$49.99', color: 'bg-blue-100 text-blue-800' };
    }
  };

  const tierInfo = getTierInfo(settings.subscription_tier);

  const tabs = [
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'branding', name: 'Branding', icon: PaintBrushIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'subscription', name: 'Subscription', icon: CreditCardIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon }
  ] as const;

  // Only show settings if user is a broker or superadmin
  if (userProfile?.role !== 'broker' && userProfile?.role !== 'superadmin') {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">
            Organization settings are only available to broker and superadmin accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
            <p className="text-gray-600 mt-1">Manage your organization preferences and configurations</p>
          </div>
          <div className="flex items-center space-x-3">
            {saveStatus === 'success' && (
              <div className="flex items-center text-green-600">
                <CheckIcon className="w-4 h-4 mr-1" />
                <span className="text-sm">Saved</span>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <nav className="px-4 py-6 space-y-1">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="w-5 h-5 mr-3" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Information</h3>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Organization Name
                        </label>
                        <input
                          type="text"
                          value={settings.name}
                          onChange={(e) => updateSettings({ name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Organization ID
                        </label>
                        <input
                          type="text"
                          value="3f977fec-56c6-4c47-9548-82e961b7a27e"
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Team Information</h3>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <UserGroupIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">12</div>
                        <div className="text-sm text-gray-600">Total Users</div>
                      </div>
                      <div className="text-center">
                        <BuildingOfficeIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">5</div>
                        <div className="text-sm text-gray-600">Active Vendors</div>
                      </div>
                      <div className="text-center">
                        <CogIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">3</div>
                        <div className="text-sm text-gray-600">Loan Officers</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'branding' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Brand Colors</h3>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Color
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={settings.primary_color}
                            onChange={(e) => updateSettings({ primary_color: e.target.value })}
                            className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={settings.primary_color}
                            onChange={(e) => updateSettings({ primary_color: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="#22C55E"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Secondary Color
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={settings.secondary_color}
                            onChange={(e) => updateSettings({ secondary_color: e.target.value })}
                            className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={settings.secondary_color}
                            onChange={(e) => updateSettings({ secondary_color: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="#F97316"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Logo</h3>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center space-x-6">
                      <div className="flex-shrink-0">
                        {settings.logo_url ? (
                          <img src={settings.logo_url} alt="Logo" className="w-16 h-16 rounded-lg object-cover" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <PhotoIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 mb-2">
                          Upload your organization logo. Recommended size: 200x200px
                        </div>
                        <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                          <PhotoIcon className="w-4 h-4 mr-2" />
                          Upload Logo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">White Label Settings</h3>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">Enable White Label</div>
                          <div className="text-sm text-gray-600">Remove VendorHub branding from vendor portals</div>
                        </div>
                        <button
                          onClick={() => updateSettings({ 
                            white_label: { ...settings.white_label, enabled: !settings.white_label.enabled } 
                          })}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                            settings.white_label.enabled ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              settings.white_label.enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      {settings.white_label.enabled && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Custom Domain
                          </label>
                          <input
                            type="text"
                            value={settings.white_label.custom_domain || ''}
                            onChange={(e) => updateSettings({ 
                              white_label: { ...settings.white_label, custom_domain: e.target.value } 
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="finance.yourcompany.com"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="space-y-6">
                      {Object.entries(settings.notification_preferences).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            <div className="text-sm text-gray-600">
                              {key === 'email_notifications' && 'Receive email notifications for important updates'}
                              {key === 'deal_updates' && 'Get notified when deal statuses change'}
                              {key === 'vendor_invites' && 'Notifications when vendors are invited or activated'}
                              {key === 'system_alerts' && 'System maintenance and security alerts'}
                            </div>
                          </div>
                          <button
                            onClick={() => updateNotificationPreferences(key as keyof OrganizationSettings['notification_preferences'], !value)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                              value ? 'bg-green-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                value ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'subscription' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Current Plan</h3>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${tierInfo.color}`}>
                          {tierInfo.name}
                        </div>
                        <div className="ml-4">
                          <div className="text-2xl font-bold text-gray-900">{tierInfo.price}/month</div>
                          <div className="text-sm text-gray-600">Billed monthly</div>
                        </div>
                      </div>
                      <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                        Upgrade Plan
                      </button>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Plan Features</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-700">Up to 7 vendors</span>
                        </div>
                        <div className="flex items-center">
                          <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-700">3 loan officers</span>
                        </div>
                        <div className="flex items-center">
                          <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-700">25GB storage</span>
                        </div>
                        <div className="flex items-center">
                          <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-700">API access</span>
                        </div>
                        <div className="flex items-center">
                          <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-700">Priority support</span>
                        </div>
                        <div className="flex items-center">
                          <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-700">White label branding</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Statistics</h3>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Vendors</div>
                        <div className="text-2xl font-bold text-gray-900">5 / 7</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '71%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">Storage</div>
                        <div className="text-2xl font-bold text-gray-900">12.3 / 25 GB</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '49%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">API Calls</div>
                        <div className="text-2xl font-bold text-gray-900">8.2K / ∞</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-4">Authentication</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900">Two-Factor Authentication</div>
                              <div className="text-sm text-gray-600">Require 2FA for all organization users</div>
                            </div>
                            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                              Configure
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900">Session Timeout</div>
                              <div className="text-sm text-gray-600">Current: 24 hours</div>
                            </div>
                            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                              Change
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-4">Data Protection</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900">Data Encryption</div>
                              <div className="text-sm text-gray-600">AES-256 encryption enabled</div>
                            </div>
                            <div className="flex items-center text-green-600">
                              <CheckIcon className="w-4 h-4 mr-1" />
                              <span className="text-sm">Active</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900">Audit Logging</div>
                              <div className="text-sm text-gray-600">Track all user activities</div>
                            </div>
                            <div className="flex items-center text-green-600">
                              <CheckIcon className="w-4 h-4 mr-1" />
                              <span className="text-sm">Active</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance</h3>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <ShieldCheckIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <div className="text-sm font-medium text-gray-900">SOC 2 Type II</div>
                        <div className="text-xs text-gray-600">Compliant</div>
                      </div>
                      <div className="text-center">
                        <ShieldCheckIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <div className="text-sm font-medium text-gray-900">GDPR</div>
                        <div className="text-xs text-gray-600">Compliant</div>
                      </div>
                      <div className="text-center">
                        <ShieldCheckIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <div className="text-sm font-medium text-gray-900">CCPA</div>
                        <div className="text-xs text-gray-600">Compliant</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};