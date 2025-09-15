import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardStats, Device } from "@shared/api";
import { Link } from "react-router-dom";
import { FirebaseService } from "@/services/firebaseService";
import {
  Activity,
  Droplets,
  Server,
  TrendingUp,
  AlertTriangle,
  Clock,
} from "lucide-react";

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    // Set up real-time listeners for dashboard stats and devices
    const statsUnsubscribe = FirebaseService.onDashboardStats((statsData) => {
      setStats(statsData);
      setLoading(false);
    });

    const devicesUnsubscribe = FirebaseService.onDevices((devicesData) => {
      setDevices(devicesData);
      setLoading(false);
    });

    // Cleanup function
    return () => {
      statsUnsubscribe();
      devicesUnsubscribe();
    };
  }, []);

  const getStatusBadge = (status: Device["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Active
          </Badge>
        );
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return "Never";
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  return (
    <Layout className="bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Well Monitoring Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor water level sensors and system performance
          </p>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Devices
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.totalDevices}
                    </p>
                  </div>
                  <Server className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Active Devices
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      {stats.activeDevices}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Readings
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.totalReadings}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Avg Level
                    </p>
                    <p className="text-3xl font-bold text-blue-600">
                      {stats.averageLevel}m
                    </p>
                  </div>
                  <Droplets className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Devices Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-5 w-5" />
                <span>Device Status</span>
              </CardTitle>
              <CardDescription>
                Current status of all monitoring devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse flex items-center space-x-3"
                    >
                      <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                      <div className="h-4 bg-gray-200 rounded flex-1"></div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : devices.length > 0 ? (
                <div className="space-y-3">
                  {devices.slice(0, 5).map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {device.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {device.location}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(device.status)}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatLastSeen(device.lastSeen)}
                        </p>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="mt-2"
                        >
                          <Link to={`/devices/${device.id}`}>View Data</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {devices.length > 5 && (
                    <p className="text-sm text-gray-500 text-center pt-2">
                      And {devices.length - 5} more devices...
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No devices found</p>
                  <p className="text-sm text-gray-400">
                    Add your first device to start monitoring
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>
                Latest system updates and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats && (
                  <div className="p-3 rounded-lg bg-blue-50">
                    <p className="text-sm font-medium text-blue-900">
                      System Status
                    </p>
                    <p className="text-xs text-blue-700">
                      Last updated:{" "}
                      {new Date(stats.lastUpdate).toLocaleString()}
                    </p>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-green-50">
                  <p className="text-sm font-medium text-green-900">Welcome!</p>
                  <p className="text-xs text-green-700">
                    You're now connected to the Waleki monitoring system
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                {isAdmin
                  ? "Manage system"
                  : "Access water level data and reports"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {isAdmin ? (
                  <>
                    <Button asChild className="h-20 flex-col">
                      <Link to="/devices">
                        <Server className="h-6 w-6 mb-2" />
                        Manage Devices
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-20 flex-col">
                      <Link to="/settings">
                        <Activity className="h-6 w-6 mb-2" />
                        System Settings
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-20 flex-col">
                      <Link to="/reports">
                        <TrendingUp className="h-6 w-6 mb-2" />
                        View Reports
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    {devices.slice(0, 3).map((device) => (
                      <Button
                        key={device.id}
                        asChild
                        variant="outline"
                        className="h-20 flex-col"
                      >
                        <Link to={`/devices/${device.id}`}>
                          <Droplets className="h-6 w-6 mb-2" />
                          {device.name}
                        </Link>
                      </Button>
                    ))}
                    {devices.length === 0 && (
                      <div className="col-span-3 text-center py-6">
                        <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No devices available</p>
                        <p className="text-sm text-gray-400">
                          Contact your administrator to add devices
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
