import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, Calculator } from 'lucide-react';

interface VendorDashboardStatsProps {
  submissionStats: {
    total: number;
    pending: number;
    approved: number;
  };
  onSectionChange: (section: string) => void;
}

const VendorDashboardStats = ({ submissionStats, onSectionChange }: VendorDashboardStatsProps) => {
  const dashboardCards = [
    {
      title: "Total Submissions",
      value: submissionStats.total.toString(),
      description: "All time submissions",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      section: "submissions"
    },
    {
      title: "Pending Review",
      value: submissionStats.pending.toString(),
      description: "Awaiting partner review",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      section: "submissions"
    },
    {
      title: "Approved",
      value: submissionStats.approved.toString(),
      description: "Successfully approved",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      section: "submissions"
    },
    {
      title: "PreQual Tool",
      value: "Check",
      description: "Pre-qualify customers",
      icon: Calculator,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      section: "prequal"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {dashboardCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card 
            key={index} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onSectionChange(card.section)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`w-8 h-8 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              <p className="text-xs text-gray-600 mt-1">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default VendorDashboardStats;