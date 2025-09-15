import { useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Droplets, 
  Activity, 
  Shield, 
  TrendingUp,
  Smartphone,
  BarChart,
  ArrowRight,
  Loader2
} from 'lucide-react';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect authenticated users to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const features = [
    {
      icon: Activity,
      title: 'Real-time Monitoring',
      description: 'Monitor water levels in real-time with instant updates from your Raspberry Pi sensors.'
    },
    {
      icon: BarChart,
      title: 'Advanced Analytics',
      description: 'Comprehensive data visualization with charts, graphs, and historical analysis.'
    },
    {
      icon: Smartphone,
      title: 'Multi-device Support',
      description: 'Manage multiple water level sensors from a single, unified dashboard.'
    },
    {
      icon: Shield,
      title: 'Secure Access',
      description: 'Role-based access control with admin and user permissions for secure monitoring.'
    },
    {
      icon: TrendingUp,
      title: 'Data Export',
      description: 'Export your data in multiple formats including JSON, Excel, and chart images.'
    },
    {
      icon: Droplets,
      title: 'Alert System',
      description: 'Configurable alerts for high and low water level thresholds.'
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Droplets className="h-16 w-16" />
            </div>
            <h1 className="text-5xl font-bold mb-6">Waleki</h1>
            <p className="text-xl mb-4 text-blue-100">Water Level Monitoring from Kisima</p>
            <p className="text-lg mb-8 text-blue-200 max-w-3xl mx-auto">
              A comprehensive water level monitoring solution that connects your Raspberry Pi sensors 
              to a powerful web dashboard for real-time analytics and alerts.
            </p>
            <div className="space-x-4">
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <Link to="/dashboard">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful Features for Water Monitoring
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to monitor, analyze, and manage your water level data effectively.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-blue-600 mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                How Waleki Works
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Connect Your Sensors</h3>
                    <p className="text-gray-600">
                      Deploy Raspberry Pi devices with water level sensors in your wells or tanks.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Real-time Data Collection</h3>
                    <p className="text-gray-600">
                      Devices automatically send water level, temperature, and battery data to Waleki.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Monitor & Analyze</h3>
                    <p className="text-gray-600">
                      View real-time dashboards, set alerts, and export data for analysis.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl">
              <div className="text-center">
                <Droplets className="h-20 w-20 text-blue-600 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Ready to Start Monitoring?
                </h3>
                <p className="text-gray-600 mb-6">
                  Sign in to access your dashboard and start monitoring your water levels.
                </p>
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link to="/dashboard">
                    Access Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Information */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Easy Integration
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect your Raspberry Pi devices using our simple REST API.
            </p>
          </div>

          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Raspberry Pi Integration</CardTitle>
              <CardDescription>
                Send water level data to Waleki using a simple HTTP POST request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <code className="text-sm">
                  {`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080'}/api/data/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "deviceId": 1,
    "level": 2.5,
    "temperature": 22.3,
    "batteryLevel": 85
  }'`}
                </code>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                This endpoint accepts water level data from your Raspberry Pi sensors and stores it for analysis.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
