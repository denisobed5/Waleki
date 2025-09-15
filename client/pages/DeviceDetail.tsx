import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FirebaseService } from "@/services/firebaseService";
import { Layout } from "@/components/layout/Layout";
import { WaterLevelChart } from "@/components/charts/WaterLevelChart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Device,
  WaterLevelReading,
  TimeRange,
  ExportFormat,
  UpdateDeviceRequest,
} from "@shared/api";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Settings,
  Activity,
  Thermometer,
  Battery,
  AlertTriangle,
  Download,
  Loader2,
} from "lucide-react";

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, isAdmin } = useAuth();
  const [device, setDevice] = useState<Device | null>(null);
  const [recentReadings, setRecentReadings] = useState<WaterLevelReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    measurementInterval: 15,
    alertThresholds: {
      low: 0.5,
      high: 5.0,
    },
    calibration: {
      offset: 0,
      scale: 1,
    },
  });

  useEffect(() => {
    if (!id) return;
    
    const deviceId = parseInt(id);
    setLoading(true);
    
    // Fetch device data once
    FirebaseService.getDevice(deviceId)
      .then((deviceData) => {
        setDevice(deviceData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching device:", error);
        setError("Failed to fetch device data");
        setLoading(false);
      });

    // Set up real-time listener for device readings
    const readingsUnsubscribe = FirebaseService.onDeviceReadings(
      deviceId,
      (readings) => {
        setRecentReadings(readings.slice(0, 10)); // Keep only 10 most recent
      },
      10
    );

    // Cleanup function
    return () => {
      readingsUnsubscribe();
    };
  }, [id]);

  const handleExport = async (format: ExportFormat) => {
    if (!device) return;

    try {
      if (format === "image") {
        alert(
          "Image export functionality: Use browser screenshot or implement html2canvas for automatic image generation.",
        );
      } else {
        // Get readings data from Firebase
        const readings = await FirebaseService.getDeviceReadings(device.id, 100);

        if (format === "json") {
          const exportData = {
            device: {
              id: device.id,
              name: device.name,
              location: device.location,
            },
            exportDate: new Date().toISOString(),
            dataPoints: readings.length,
            readings: readings,
          };

          const dataStr = JSON.stringify(exportData, null, 2);
          const dataUri =
            "data:application/json;charset=utf-8," +
            encodeURIComponent(dataStr);
          const filename = `${device.name.replace(/\s+/g, "_")}_water_levels.json`;

          const a = document.createElement("a");
          a.href = dataUri;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else if (format === "excel") {
          // Generate CSV format for Excel compatibility
          const csvHeader =
            "Timestamp,Water Level (m),Temperature (°C),Battery Level (%)\n";
          const csvRows = readings
            .map(
              (reading) =>
                `${reading.timestamp},${reading.level},${reading.temperature || ""},${reading.batteryLevel || ""}`,
            )
            .join("\n");

          const csvContent = csvHeader + csvRows;
          const dataUri =
            "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
          const filename = `${device.name.replace(/\s+/g, "_")}_water_levels.csv`;

          const a = document.createElement("a");
          a.href = dataUri;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }

        alert(`${format.toUpperCase()} export completed successfully!`);
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Export failed. Please try again.");
    }
  };

  const openEditModal = () => {
    if (!device) return;

    setFormData({
      name: device.name,
      location: device.location,
      description: device.description || "",
      measurementInterval: device.settings.measurementInterval,
      alertThresholds: device.settings.alertThresholds,
      calibration: device.settings.calibration,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device) return;

    setSubmitting(true);
    setError("");

    try {
      const deviceData: UpdateDeviceRequest = {
        name: formData.name,
        location: formData.location,
        description: formData.description || undefined,
        settings: {
          measurementInterval: formData.measurementInterval,
          alertThresholds: formData.alertThresholds,
          calibration: formData.calibration,
        },
      };

      const updatedDevice = await FirebaseService.updateDevice(device.id, deviceData);
      setDevice(updatedDevice);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating device:", error);
      setError("Failed to update device");
    } finally {
      setSubmitting(false);
    }
  };

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
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading device details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !device) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error || "Device not found"}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const latestReading = recentReadings[0];

  return (
    <Layout className="bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {device.name}
              </h1>
              <p className="text-gray-600 flex items-center mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {device.location}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(device.status)}
            {isAdmin && (
              <Button onClick={openEditModal}>
                <Settings className="h-4 w-4 mr-2" />
                Edit Device
              </Button>
            )}
          </div>
        </div>

        {/* Device Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {device.status === "active" ? "Online" : "Offline"}
                  </p>
                </div>
                <Activity
                  className={`h-8 w-8 ${device.status === "active" ? "text-green-600" : "text-gray-400"}`}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Last seen: {formatLastSeen(device.lastSeen)}
              </p>
            </CardContent>
          </Card>

          {latestReading && (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Water Level
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {latestReading.level.toFixed(2)}m
                      </p>
                    </div>
                    <Settings className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(latestReading.timestamp).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              {latestReading.temperature !== undefined && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Temperature
                        </p>
                        <p className="text-2xl font-bold text-orange-600">
                          {latestReading.temperature.toFixed(1)}°C
                        </p>
                      </div>
                      <Thermometer className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {latestReading.batteryLevel !== undefined && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Battery
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {latestReading.batteryLevel}%
                        </p>
                      </div>
                      <Battery className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Chart */}
        <div className="mb-8">
          <WaterLevelChart
            deviceId={device.id}
            deviceName={device.name}
            onExport={handleExport}
            showExportButtons={true}
          />
        </div>

        {/* Device Details and Recent Readings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Device Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Device Configuration</span>
              </CardTitle>
              <CardDescription>
                Current device settings and thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {device.description && (
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Description
                  </p>
                  <p className="text-sm text-gray-600">{device.description}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-900">
                  Measurement Interval
                </p>
                <p className="text-sm text-gray-600">
                  {device.settings.measurementInterval} minutes
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900">
                  Alert Thresholds
                </p>
                <div className="flex space-x-4 mt-1">
                  <span className="text-sm text-red-600">
                    Low: {device.settings.alertThresholds.low}m
                  </span>
                  <span className="text-sm text-green-600">
                    High: {device.settings.alertThresholds.high}m
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900">Calibration</p>
                <div className="flex space-x-4 mt-1">
                  <span className="text-sm text-gray-600">
                    Offset: {device.settings.calibration.offset}
                  </span>
                  <span className="text-sm text-gray-600">
                    Scale: {device.settings.calibration.scale}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900">Created</p>
                <p className="text-sm text-gray-600">
                  {new Date(device.createdAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Readings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Readings</span>
              </CardTitle>
              <CardDescription>
                Latest 10 water level measurements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentReadings.length > 0 ? (
                <div className="space-y-3">
                  {recentReadings.map((reading) => (
                    <div
                      key={reading.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {reading.level.toFixed(2)}m
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(reading.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        {reading.temperature !== undefined && (
                          <p className="text-sm text-orange-600">
                            {reading.temperature.toFixed(1)}°C
                          </p>
                        )}
                        {reading.batteryLevel !== undefined && (
                          <p className="text-xs text-gray-500">
                            Battery: {reading.batteryLevel}%
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No readings available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Device Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Device</DialogTitle>
              <DialogDescription>
                Update the device configuration.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Device Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location *</Label>
                  <Input
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-interval">Interval (minutes)</Label>
                    <Input
                      id="edit-interval"
                      type="number"
                      min="1"
                      value={formData.measurementInterval}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          measurementInterval: parseInt(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-low-threshold">Low Alert (m)</Label>
                    <Input
                      id="edit-low-threshold"
                      type="number"
                      step="0.1"
                      value={formData.alertThresholds.low}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          alertThresholds: {
                            ...prev.alertThresholds,
                            low: parseFloat(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-high-threshold">High Alert (m)</Label>
                    <Input
                      id="edit-high-threshold"
                      type="number"
                      step="0.1"
                      value={formData.alertThresholds.high}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          alertThresholds: {
                            ...prev.alertThresholds,
                            high: parseFloat(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-scale">Scale Factor</Label>
                    <Input
                      id="edit-scale"
                      type="number"
                      step="0.01"
                      value={formData.calibration.scale}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          calibration: {
                            ...prev.calibration,
                            scale: parseFloat(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Device"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
