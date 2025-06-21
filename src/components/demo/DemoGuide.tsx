
import React from 'react';
import { useDemo } from '@/contexts/DemoContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ArrowRight, ArrowLeft, Play } from 'lucide-react';

const partnerAdminSteps = [
  {
    title: "Welcome to VendorHub Partner Admin",
    description: "Manage your vendor network, review applications, and track revenue across your entire partner ecosystem.",
    highlight: "overview"
  },
  {
    title: "Vendor Management",
    description: "Add, monitor, and manage all your vendor partners. Track their performance and revenue contributions in real-time.",
    highlight: "vendors"
  },
  {
    title: "Deal Submissions Review",
    description: "Review customer applications submitted by your vendors. Approve, reject, or request manual review with detailed insights.",
    highlight: "submissions"
  },
  {
    title: "Revenue Analytics",
    description: "Get comprehensive insights into revenue streams, growth trends, and vendor performance metrics.",
    highlight: "analytics"
  },
  {
    title: "Switch to Vendor View",
    description: "Use the role selector above to experience the vendor dashboard and see how your partners interact with the system.",
    highlight: "role-switch"
  }
];

const vendorSteps = [
  {
    title: "Welcome to VendorHub Vendor Portal",
    description: "Submit customer applications, track their status, and monitor your commission earnings through an intuitive interface.",
    highlight: "overview"
  },
  {
    title: "Submit Applications",
    description: "Easily submit new customer funding applications with our streamlined form. All required information is captured efficiently.",
    highlight: "submit"
  },
  {
    title: "Track Your Submissions",
    description: "Monitor the status of all your applications in real-time. See approvals, pending reviews, and detailed feedback.",
    highlight: "submissions"
  },
  {
    title: "Commission Tracking",
    description: "Track your earnings with detailed commission breakdowns and performance metrics to optimize your sales strategy.",
    highlight: "analytics"
  },
  {
    title: "Switch to Partner View",
    description: "Use the role selector above to see the Partner Admin dashboard and understand the complete workflow.",
    highlight: "role-switch"
  }
];

const DemoGuide = () => {
  const { showGuide, setShowGuide, currentStep, setCurrentStep, currentDemoRole } = useDemo();

  if (!showGuide) return null;

  const steps = currentDemoRole === 'Partner Admin' ? partnerAdminSteps : vendorSteps;
  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-vendor-green-600" />
              {currentDemoRole} Demo Guide
            </CardTitle>
            <CardDescription>
              Step {currentStep + 1} of {steps.length}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGuide(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">{currentStepData.title}</h3>
            <p className="text-gray-600">{currentStepData.description}</p>
          </div>
          
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            {isLastStep ? (
              <Button
                onClick={() => setShowGuide(false)}
                className="bg-vendor-green-600 hover:bg-vendor-green-700"
              >
                Start Exploring
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="bg-vendor-green-600 hover:bg-vendor-green-700"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
          
          <div className="flex space-x-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded ${
                  index <= currentStep ? 'bg-vendor-green-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoGuide;
