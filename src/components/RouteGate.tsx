"use client";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RouteGate({ children }: { children: React.ReactNode }) {
  // Hook order is fixed
  const { session, loading } = useAuth();

  // Render-time branching only (no hooks below)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-yellow-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading VendorHub...</p>
        </div>
      </div>
    );
  }
  
  if (!session) return <LoginPageMinimal />;

  return <>{children}</>;
}

// Keep this component dumb. No hooks here.
function LoginPageMinimal() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-yellow-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-green-600">VendorHub</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            You need to be signed in to access VendorHub.
          </p>
          <Button 
            onClick={() => window.location.href = '/auth'}
            className="w-full"
          >
            Go to Sign In
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/demo'}
            className="w-full"
          >
            Try Demo Mode
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}