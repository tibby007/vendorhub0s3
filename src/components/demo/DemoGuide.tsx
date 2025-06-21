
import React from 'react';
import { useDemo } from '@/contexts/DemoContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ArrowRight, ArrowLeft, Play } from 'lucide-react';

const demoSteps = [
  {
    title: "Welcome to VendorHub Demo",
    description: "This is a live demo of our Partner Admin dashboard. You'll see how easy it is to manage your vendor network and grow your business.",
    highlight: "overview"
  },
  {
    title: "Vendor Management",
    description: "Easily add, monitor, and manage all your vendor partners. Track their performance and revenue contributions in real-time.",
    highlight: "vendors"
  },
  {
    title: "Deal Submissions",
    description: "Review customer applications submitted by your vendors. Approve, reject, or request manual review with just a few clicks.",
    highlight: "submissions"
  },
  {
    title: "Revenue Analytics",
    description: "Get detailed insights into your revenue streams, growth trends, and vendor performance metrics.",
    highlight: "analytics"
  },
  {
    title: "White-Label Branding",
    description: "Customize the platform with your own branding to create a seamless experience for your vendors.",
    highlight: "branding"
  }
];

const DemoGuide = () => {
  const { showGuide, setShowGuide, currentStep, setCurrentStep } = useDemo();

  if (!showGuide) return null;

  const currentStepData = demoSteps[currentStep];
  const isLastStep = currentStep === demoSteps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-vendor-green-600" />
              Demo Guide
            </CardTitle>
            <CardDescription>
              Step {currentStep + 1} of {demoSteps.length}
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
            {demoSteps.map((_, index) => (
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
