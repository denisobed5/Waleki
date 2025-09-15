import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FirebaseService } from "@/services/firebaseService";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Device, CreateDeviceRequest, UpdateDeviceRequest } from "@shared/api";
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  Activity,
  AlertTriangle,
  MapPin,
  Clock,
  Loader2,
} from "lucide-react";

export default function DeviceManagement() {
  const { token } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
    setLoading(true);
    
    // Set up real-time listener for devices
    const unsubscribe = FirebaseService.onDevices((devicesData) => {
      setDevices(devicesData);
      setLoading(false);
      setError("");
    });

    // Cleanup function
    return unsubscribe;
  }, []);

  const resetForm = () => {
    setFormData({
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
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (device: Device) => {
    setSelectedDevice(device);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const deviceData: CreateDeviceRequest | UpdateDeviceRequest = {
        name: formData.name,
        location: formData.location,
        description: formData.description || undefined,
        settings: {
          measurementInterval: formData.measurementInterval,
          alertThresholds: formData.alertThresholds,
          calibration: formData.calibration,
        },
      };

      if (isEditModalOpen && selectedDevice?.id != null) {
        await FirebaseService.updateDevice(selectedDevice.id, deviceData);
      } else {
        await FirebaseService.createDevice(deviceData);
      }

      // No need to refetch - real-time listener will update automatically
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      resetForm();
      setSelectedDevice(null);
    } catch (error) {
      console.error("Error saving device:", error);
      const message = error instanceof Error ? error.message : "Failed to save device";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (deviceId: number) => {
    try {
      await FirebaseService.deleteDevice(deviceId);
      // No need to refetch - real-time listener will update automatically
    } catch (error) {
      console.error("Error deleting device:", error);
      const message = error instanceof Error ? error.message : "Failed to delete device";
      setError(message);
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
    return date.toLocaleString();
  };

  return (
    <Layout className="bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Device Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage water level monitoring devices
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/dashboard">Back</Link>
            </Button>
            <Button onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Add Device
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Devices Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : devices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <Card
                key={device.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{device.name}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {device.location}
                      </CardDescription>
                    </div>
                    {getStatusBadge(device.status)}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {device.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      {device.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-500">
                      <Clock className="h-3 w-3 mr-2" />
                      <span>Last seen: {formatLastSeen(device.lastSeen)}</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Activity className="h-3 w-3 mr-2" />
                      <span>
                        Interval: {device.settings.measurementInterval}m
                      </span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Settings className="h-3 w-3 mr-2" />
                      <span>
                        Alerts: {device.settings.alertThresholds.low}m -{" "}
                        {device.settings.alertThresholds.high}m
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/devices/${device.id}`}>
                        <Activity className="h-3 w-3 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(device)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Device</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{device.name}"?
                            This action cannot be undone and will remove all
                            associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(device.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No devices found
              </h3>
              <p className="text-gray-500 mb-4">
                Get started by adding your first water level monitoring device.
              </p>
              <Button onClick={openCreateModal}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Device
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Device Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Device</DialogTitle>
              <DialogDescription>
                Create a new water level monitoring device configuration.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Device Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., Well Monitor #1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="e.g., North Field Well"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Optional description"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interval">Interval (minutes)</Label>
                    <Input
                      id="interval"
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
                    <Label htmlFor="low-threshold">Low Alert (m)</Label>
                    <Input
                      id="low-threshold"
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
                    <Label htmlFor="high-threshold">High Alert (m)</Label>
                    <Input
                      id="high-threshold"
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
                    <Label htmlFor="scale">Scale Factor</Label>
                    <Input
                      id="scale"
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
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Device"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Device Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Device</DialogTitle>
              <DialogDescription>
                Update the device configuration.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
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
