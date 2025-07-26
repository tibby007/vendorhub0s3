import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { formatStorageSize, getStorageUsagePercentage, StorageData } from '@/utils/storageUtils';
import { HardDrive } from 'lucide-react';

interface StorageUsageCardProps {
  partnerId: string;
}

const StorageUsageCard: React.FC<StorageUsageCardProps> = ({ partnerId }) => {
  const [storageData, setStorageData] = useState<StorageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStorage = async () => {
      try {
        const { data, error } = await supabase
          .from('partners')
          .select('storage_used, storage_limit')
          .eq('id', partnerId)
          .single();

        if (error) throw error;
        
        setStorageData(data);
      } catch (error) {
        console.error('Error fetching storage data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (partnerId) {
      fetchStorage();
    }
  }, [partnerId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!storageData) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">No data</div>
        </CardContent>
      </Card>
    );
  }

  const percentage = getStorageUsagePercentage(storageData.storage_used, storageData.storage_limit);
  
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 70) return 'bg-warning';
    return 'bg-primary';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
        <HardDrive className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{percentage.toFixed(1)}%</div>
        <div className="space-y-2 mt-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatStorageSize(storageData.storage_used)} used</span>
            <span>{formatStorageSize(storageData.storage_limit)} total</span>
          </div>
          <Progress 
            value={percentage} 
            className="w-full h-2"
          />
          {percentage >= 90 && (
            <p className="text-xs text-destructive font-medium">
              Storage limit almost reached
            </p>
          )}
          {percentage >= 70 && percentage < 90 && (
            <p className="text-xs text-warning font-medium">
              Consider upgrading your storage plan
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StorageUsageCard;