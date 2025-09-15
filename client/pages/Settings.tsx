import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  ArrowLeft,
  Database,
  Mail,
  Clock,
  Globe,
  Save,
  AlertTriangle,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";

export default function Settings() {
  const { user, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    alertThresholds: true,
    deviceOffline: true,
    weeklyReports: true,
    systemMaintenance: true,
  });

  // System settings state (admin only)
  const [systemSettings, setSystemSettings] = useState({
    dataRetentionDays: 365,
    measurementPrecision: 2,
    defaultMeasurementInterval: 15,
    alertEmailTimeout: 60,
    backupFrequency: "daily",
    enableApiAccess: true,
    maxDevicesPerUser: 10,
  });

  const handleSaveNotifications = async () => {
    setSaving(true);
    setMessage("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage("Notification settings saved successfully!");
    } catch (error) {
      setMessage("Failed to save notification settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSystem = async () => {
    setSaving(true);
    setMessage("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage("System settings saved successfully!");
    } catch (error) {
      setMessage("Failed to save system settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout className="bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <SettingsIcon className="h-8 w-8 mr-3 text-blue-600" />
              Settings
            </h1>
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          <p className="text-gray-600 mt-2">
            Manage account preferences and system configuration
          </p>
        </div>

        {/* Messages */}
        {message && (
          <Alert
            className={`mb-6 ${message.includes("Failed") ? "border-red-200" : "border-green-200"}`}
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList
            className={`grid w-full ${isAdmin ? "grid-cols-2" : "grid-cols-1"}`}
          >
            <TabsTrigger
              value="notifications"
              className="flex items-center space-x-2"
            >
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger
                value="system"
                className="flex items-center space-x-2"
              >
                <Shield className="h-4 w-4" />
                <span>System</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
                <CardDescription>
                  Configure how you want to receive alerts and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">
                        Receive general notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          emailNotifications: checked,
                        }))
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-gray-500">
                        Receive urgent alerts via SMS
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          smsNotifications: checked,
                        }))
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Alert Threshold Breaches</Label>
                      <p className="text-sm text-gray-500">
                        Get notified when water levels exceed thresholds
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.alertThresholds}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          alertThresholds: checked,
                        }))
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Device Offline Alerts</Label>
                      <p className="text-sm text-gray-500">
                        Get notified when devices go offline
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.deviceOffline}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          deviceOffline: checked,
                        }))
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Reports</Label>
                      <p className="text-sm text-gray-500">
                        Receive weekly summary reports
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.weeklyReports}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          weeklyReports: checked,
                        }))
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>System Maintenance</Label>
                      <p className="text-sm text-gray-500">
                        Get notified about system maintenance
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.systemMaintenance}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          systemMaintenance: checked,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveNotifications} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Notifications"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings (Admin Only) */}
          {isAdmin && (
            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>System Configuration</span>
                  </CardTitle>
                  <CardDescription>
                    Configure system-wide settings and defaults (Admin only)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dataRetention">
                        Data Retention (days)
                      </Label>
                      <Input
                        id="dataRetention"
                        type="number"
                        value={systemSettings.dataRetentionDays}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            dataRetentionDays: parseInt(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="measurementPrecision">
                        Measurement Precision (decimal places)
                      </Label>
                      <Input
                        id="measurementPrecision"
                        type="number"
                        min="0"
                        max="4"
                        value={systemSettings.measurementPrecision}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            measurementPrecision: parseInt(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="defaultInterval">
                        Default Measurement Interval (minutes)
                      </Label>
                      <Input
                        id="defaultInterval"
                        type="number"
                        value={systemSettings.defaultMeasurementInterval}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            defaultMeasurementInterval: parseInt(
                              e.target.value,
                            ),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alertTimeout">
                        Alert Email Timeout (minutes)
                      </Label>
                      <Input
                        id="alertTimeout"
                        type="number"
                        value={systemSettings.alertEmailTimeout}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            alertEmailTimeout: parseInt(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="backupFrequency">Backup Frequency</Label>
                      <Select
                        value={systemSettings.backupFrequency}
                        onValueChange={(value) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            backupFrequency: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxDevices">Max Devices Per User</Label>
                      <Input
                        id="maxDevices"
                        type="number"
                        value={systemSettings.maxDevicesPerUser}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            maxDevicesPerUser: parseInt(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable API Access</Label>
                      <p className="text-sm text-gray-500">
                        Allow external API access to the system
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.enableApiAccess}
                      onCheckedChange={(checked) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          enableApiAccess: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveSystem} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Saving..." : "Save System Settings"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}
