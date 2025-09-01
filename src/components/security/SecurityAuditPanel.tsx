import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, Clock, MapPin } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface AuditLog {
  id: string;
  action: string;
  file_name: string;
  file_size: number | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const SecurityAuditPanel = () => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchAuditLogs();
    }
  }, [user]);

  const fetchAuditLogs = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('storage_audit_log')
        .select('*')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditLogs((data || []).map(log => ({
        id: log.id,
        action: log.action,
        file_name: log.file_name,
        file_size: log.file_size || 0,
        ip_address: (log.ip_address as string) || 'unknown',
        user_agent: (log.user_agent as string) || 'unknown',
        created_at: log.created_at
      })));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'upload': return '📤';
      case 'delete': return '🗑️';
      case 'access': return '👁️';
      case 'validation_check': return '✅';
      default: return '📋';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'upload': return 'text-green-600';
      case 'delete': return 'text-red-600';
      case 'access': return 'text-blue-600';
      case 'validation_check': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security Audit Log
        </h3>
        <p className="text-sm text-muted-foreground">
          Monitor all file operations and security events for your account
        </p>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> All file operations are logged for security and compliance purposes. 
          This includes uploads, downloads, deletions, and access attempts.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <CardDescription>
            Last 50 security events for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading audit logs...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8">
              <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No audit logs available yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getActionIcon(log.action)}</span>
                    <div>
                      <p className="font-medium">
                        <span className={getActionColor(log.action)}>
                          {log.action.charAt(0).toUpperCase() + log.action.slice(1).replace('_', ' ')}
                        </span>
                        {' '}{log.file_name}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                        {log.file_size && (
                          <span>Size: {formatFileSize(log.file_size)}</span>
                        )}
                        {log.ip_address && log.ip_address !== 'client' && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {log.ip_address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityAuditPanel;