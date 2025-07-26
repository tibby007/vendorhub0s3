import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Star } from 'lucide-react';

const DemoSessionInfo = () => {
  return (
    <div className="mb-8">
      <Card className="bg-gradient-to-r from-vendor-green-50 to-vendor-gold-50 border-vendor-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-vendor-green-500 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Demo Session Active</h3>
                <p className="text-gray-600">10-minute full access • Sample data environment</p>
              </div>
            </div>
            <Badge className="bg-vendor-green-100 text-vendor-green-700">
              <Star className="w-3 h-3 mr-1" />
              Premium Access
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoSessionInfo;