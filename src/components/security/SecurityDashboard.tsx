import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Activity, Users, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SecurityService } from '@/services/securityService';

interface SecurityEvent {
  id: string;
  event_type: string;
  user_id?: string;
  target_user_id?: string;
  old_value?: string;
  new_value?: string;
  performed_by?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

interface SecurityStats {
  totalEvents: number;
  suspiciousActivities: number;
  loginAttempts: number;
  roleChanges: number;
  demoAccess: number;
}

export const SecurityDashboard: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityStats>({
    totalEvents: 0,
    suspiciousActivities: 0,
    loginAttempts: 0,
    roleChanges: 0,
    demoAccess: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchSecurityData();
  }, [filter]);

  const fetchSecurityData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch security events
      let query = supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('event_type', filter);
      }

      const { data: eventsData, error: eventsError } = await query;

      if (eventsError) throw eventsError;

      setEvents((eventsData || []).map(event => ({
        ...event,
        ip_address: event.ip_address as string || undefined
      })));

      // Calculate stats
      const { data: statsData, error: statsError } = await supabase
        .from('security_audit_log')
        .select('event_type')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

      if (statsError) throw statsError;

      const newStats = {
        totalEvents: statsData?.length || 0,
        suspiciousActivities: statsData?.filter(e => e.event_type === 'suspicious_activity').length || 0,
        loginAttempts: statsData?.filter(e => e.event_type.includes('login')).length || 0,
        roleChanges: statsData?.filter(e => e.event_type === 'role_change').length || 0,
        demoAccess: statsData?.filter(e => e.event_type === 'demo_access').length || 0
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching security data:', error);
      toast.error('Failed to load security data');
    } finally {
      setIsLoading(false);
    }
  };

  const getEventBadgeVariant = (eventType: string) => {
    switch (eventType) {
      case 'suspicious_activity': return 'destructive';
      case 'login_failure': return 'destructive';
      case 'role_change': return 'default';
      case 'login_success': return 'secondary';
      case 'demo_access': return 'outline';
      default: return 'secondary';
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleCleanupDemoSessions = async () => {
    try {
      await SecurityService.cleanupExpiredDemoSessions();
      toast.success('Demo sessions cleaned up successfully');
      fetchSecurityData(); // Refresh data
    } catch (error) {
      toast.error('Failed to cleanup demo sessions');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Security Dashboard</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Security Dashboard
        </h2>
        <Button onClick={handleCleanupDemoSessions} variant="outline">
          Cleanup Demo Sessions
        </Button>
      </div>

      {/* Security Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Events (7d)</p>
                <p className="text-2xl font-bold">{stats.totalEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Suspicious Activity</p>
                <p className="text-2xl font-bold text-destructive">{stats.suspiciousActivities}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Login Attempts</p>
                <p className="text-2xl font-bold">{stats.loginAttempts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-warning" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role Changes</p>
                <p className="text-2xl font-bold">{stats.roleChanges}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Demo Access</p>
                <p className="text-2xl font-bold">{stats.demoAccess}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats.suspiciousActivities > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {stats.suspiciousActivities} suspicious activities detected in the last 7 days. 
            Please review the security events below.
          </AlertDescription>
        </Alert>
      )}

      {/* Security Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>Last 100 security events</CardDescription>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'suspicious_activity' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('suspicious_activity')}
            >
              Suspicious
            </Button>
            <Button
              variant={filter === 'login_failure' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('login_failure')}
            >
              Failed Logins
            </Button>
            <Button
              variant={filter === 'role_change' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('role_change')}
            >
              Role Changes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <Badge variant={getEventBadgeVariant(event.event_type)}>
                      {formatEventType(event.event_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {event.old_value || 'No details'}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs">{event.ip_address || 'Unknown'}</code>
                  </TableCell>
                  <TableCell>
                    {new Date(event.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};