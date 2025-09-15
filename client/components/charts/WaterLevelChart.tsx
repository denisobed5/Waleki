import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TimeRange, DeviceChartData, WaterLevelReading } from "@shared/api";
import { MockApiService } from "@/services/mockApi";
import {
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  Activity,
  Droplets,
  Eye,
} from "lucide-react";

interface WaterLevelChartProps {
  deviceId: number;
  deviceName: string;
  timeRange?: TimeRange;
  onExport?: (format: "json" | "excel" | "image") => void;
  showExportButtons?: boolean;
  chartType?: "line" | "area" | "bar";
  exportContainerId?: string;
}

export function WaterLevelChart({
  deviceId,
  deviceName,
  timeRange = "1day",
  onExport,
  showExportButtons = true,
  chartType = "line",
  exportContainerId,
}: WaterLevelChartProps) {
  const [data, setData] = useState<WaterLevelReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] =
    useState<TimeRange>(timeRange);
  const [selectedChartType, setSelectedChartType] = useState(chartType);
  const [previewModalOpen, setPreviewModalOpen] = useState<
    "excel" | "json" | "graph" | null
  >(null);

  useEffect(() => {
    if (deviceId) {
      fetchChartData();
    }
  }, [deviceId, selectedTimeRange]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();

      // Calculate start date based on time range
      switch (selectedTimeRange) {
        case "30min":
          startDate.setMinutes(endDate.getMinutes() - 30);
          break;
        case "1hour":
          startDate.setHours(endDate.getHours() - 1);
          break;
        case "6hours":
          startDate.setHours(endDate.getHours() - 6);
          break;
        case "1day":
          startDate.setDate(endDate.getDate() - 1);
          break;
        case "1week":
          startDate.setDate(endDate.getDate() - 7);
          break;
        default:
          startDate.setDate(endDate.getDate() - 1);
      }

      const readings = await MockApiService.getDeviceReadings(
        deviceId,
        startDate.toISOString(),
        endDate.toISOString(),
      );
      setData(readings.reverse()); // Reverse to show chronological order
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatXAxisTick = (tickItem: string) => {
    const date = new Date(tickItem);
    switch (selectedTimeRange) {
      case "30min":
      case "1hour":
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      case "6hours":
      case "1day":
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      case "1week":
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      default:
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
    }
  };

  const formatTooltipLabel = (label: string) => {
    return new Date(label).toLocaleString();
  };

  const getStats = () => {
    if (data.length === 0) return null;

    const levels = data.map((d) => d.level);
    const min = Math.min(...levels);
    const max = Math.max(...levels);
    const avg = levels.reduce((sum, level) => sum + level, 0) / levels.length;
    const latest = levels[levels.length - 1];
    const previous = levels[levels.length - 2];
    const trend =
      latest > previous ? "up" : latest < previous ? "down" : "stable";

    return { min, max, avg, latest, trend };
  };

  const stats = getStats();

  const generateExcelPreview = () => {
    return data.map((reading) => ({
      Timestamp: new Date(reading.timestamp).toLocaleString(),
      "Water Level (m)": reading.level.toFixed(2),
      "Temperature (°C)": reading.temperature
        ? reading.temperature.toFixed(1)
        : "N/A",
      "Battery Level (%)": reading.batteryLevel
        ? reading.batteryLevel.toString()
        : "N/A",
    }));
  };

  const generateJsonPreview = () => {
    const exportData = {
      device: {
        id: deviceId,
        name: deviceName,
      },
      exportDate: new Date().toISOString(),
      timeRange: selectedTimeRange,
      dataPoints: data.length,
      readings: data.map((reading) => ({
        timestamp: reading.timestamp,
        level: reading.level,
        temperature: reading.temperature,
        batteryLevel: reading.batteryLevel,
      })),
    };
    return JSON.stringify(exportData, null, 2);
  };

  const renderChart = () => {
    const chartData = data.map((reading) => ({
      timestamp: reading.timestamp,
      level: reading.level,
      temperature: reading.temperature,
    }));

    switch (selectedChartType) {
      case "area":
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxisTick}
              stroke="#666"
            />
            <YAxis
              stroke="#666"
              label={{
                value: "Water Level (m)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip
              labelFormatter={formatTooltipLabel}
              formatter={(value: number, name: string) => [
                `${value.toFixed(2)}${name === "level" ? "m" : "°C"}`,
                name === "level" ? "Water Level" : "Temperature",
              ]}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="level"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              name="Water Level"
            />
            {data.some((d) => d.temperature !== undefined) && (
              <Area
                type="monotone"
                dataKey="temperature"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.2}
                name="Temperature"
              />
            )}
          </AreaChart>
        );

      case "bar":
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxisTick}
              stroke="#666"
            />
            <YAxis
              stroke="#666"
              label={{
                value: "Water Level (m)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip
              labelFormatter={formatTooltipLabel}
              formatter={(value: number, name: string) => [
                `${value.toFixed(2)}${name === "level" ? "m" : "°C"}`,
                name === "level" ? "Water Level" : "Temperature",
              ]}
            />
            <Legend />
            <Bar dataKey="level" fill="#3b82f6" name="Water Level" />
          </BarChart>
        );

      default: // line
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxisTick}
              stroke="#666"
            />
            <YAxis
              stroke="#666"
              label={{
                value: "Water Level (m)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip
              labelFormatter={formatTooltipLabel}
              formatter={(value: number, name: string) => [
                `${value.toFixed(2)}${name === "level" ? "m" : "°C"}`,
                name === "level" ? "Water Level" : "Temperature",
              ]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="level"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
              name="Water Level"
            />
            {data.some((d) => d.temperature !== undefined) && (
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: "#f59e0b", strokeWidth: 2, r: 3 }}
                name="Temperature"
              />
            )}
          </LineChart>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Droplets className="h-5 w-5 text-blue-600" />
              <span>{deviceName} - Water Level Data</span>
            </CardTitle>
            <CardDescription>
              Water level readings over time with trend analysis
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={selectedTimeRange}
              onValueChange={(value: TimeRange) => setSelectedTimeRange(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30min">30 minutes</SelectItem>
                <SelectItem value="1hour">1 hour</SelectItem>
                <SelectItem value="6hours">6 hours</SelectItem>
                <SelectItem value="1day">1 day</SelectItem>
                <SelectItem value="1week">1 week</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedChartType}
              onValueChange={(value: "line" | "area" | "bar") =>
                setSelectedChartType(value)
              }
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="area">Area</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Current</p>
              <p className="text-xl font-bold text-blue-600">
                {stats.latest.toFixed(2)}m
              </p>
              <Badge
                variant={
                  stats.trend === "up"
                    ? "default"
                    : stats.trend === "down"
                      ? "destructive"
                      : "secondary"
                }
              >
                {stats.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : stats.trend === "down" ? (
                  <TrendingDown className="h-3 w-3 mr-1" />
                ) : (
                  <Activity className="h-3 w-3 mr-1" />
                )}
                {stats.trend}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Average</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.avg.toFixed(2)}m
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Minimum</p>
              <p className="text-xl font-bold text-red-600">
                {stats.min.toFixed(2)}m
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Maximum</p>
              <p className="text-xl font-bold text-green-600">
                {stats.max.toFixed(2)}m
              </p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <Activity className="h-8 w-8 animate-pulse text-blue-600 mx-auto mb-2" />
              <p className="text-gray-500">Loading chart data...</p>
            </div>
          </div>
        ) : data.length > 0 ? (
          <>
            <div className="h-80 w-full" id={exportContainerId}>
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            </div>
            {showExportButtons && (
              <div className="space-y-3 mt-4 pt-4 border-t">
                <div className="text-sm font-medium text-gray-700">
                  Preview Data:
                </div>
                <div className="flex flex-wrap gap-2">
                  <Dialog
                    open={previewModalOpen === "excel"}
                    onOpenChange={(open) =>
                      setPreviewModalOpen(open ? "excel" : null)
                    }
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        Preview Excel
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Excel Data Preview</DialogTitle>
                        <DialogDescription>
                          Preview of data that will be exported to Excel/CSV
                          format
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="h-96">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Timestamp</TableHead>
                              <TableHead>Water Level (m)</TableHead>
                              <TableHead>Temperature (°C)</TableHead>
                              <TableHead>Battery Level (%)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {generateExcelPreview().map((row, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-mono text-xs">
                                  {row["Timestamp"]}
                                </TableCell>
                                <TableCell className="font-mono">
                                  {row["Water Level (m)"]}
                                </TableCell>
                                <TableCell className="font-mono">
                                  {row["Temperature (°C)"]}
                                </TableCell>
                                <TableCell className="font-mono">
                                  {row["Battery Level (%)"]}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                      <div className="flex justify-between items-center pt-4">
                        <div className="text-sm text-gray-500">
                          {data.length} data points • {selectedTimeRange} time
                          range
                        </div>
                        {onExport && (
                          <Button onClick={() => onExport("excel")}>
                            <Download className="h-4 w-4 mr-2" />
                            Export Excel
                          </Button>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog
                    open={previewModalOpen === "json"}
                    onOpenChange={(open) =>
                      setPreviewModalOpen(open ? "json" : null)
                    }
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        Preview JSON
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>JSON Data Preview</DialogTitle>
                        <DialogDescription>
                          Preview of data that will be exported to JSON format
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="h-96">
                        <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto">
                          <code>{generateJsonPreview()}</code>
                        </pre>
                      </ScrollArea>
                      <div className="flex justify-between items-center pt-4">
                        <div className="text-sm text-gray-500">
                          {data.length} data points • JSON format
                        </div>
                        {onExport && (
                          <Button onClick={() => onExport("json")}>
                            <Download className="h-4 w-4 mr-2" />
                            Export JSON
                          </Button>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog
                    open={previewModalOpen === "graph"}
                    onOpenChange={(open) =>
                      setPreviewModalOpen(open ? "graph" : null)
                    }
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        Preview Graph
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle>
                          Graph Preview for Image Export
                        </DialogTitle>
                        <DialogDescription>
                          Preview of the chart that will be exported as an image
                        </DialogDescription>
                      </DialogHeader>
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="h-96 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            {renderChart()}
                          </ResponsiveContainer>
                        </div>
                        {stats && (
                          <div className="grid grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="text-center">
                              <p className="text-sm text-gray-500">Current</p>
                              <p className="text-lg font-bold text-blue-600">
                                {stats.latest.toFixed(2)}m
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-500">Average</p>
                              <p className="text-lg font-bold text-gray-900">
                                {stats.avg.toFixed(2)}m
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-500">Minimum</p>
                              <p className="text-lg font-bold text-red-600">
                                {stats.min.toFixed(2)}m
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-500">Maximum</p>
                              <p className="text-lg font-bold text-green-600">
                                {stats.max.toFixed(2)}m
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center pt-4">
                        <div className="text-sm text-gray-500">
                          {deviceName} • {selectedTimeRange} •{" "}
                          {selectedChartType} chart
                        </div>
                        {onExport && (
                          <Button onClick={() => onExport("image")}>
                            <Download className="h-4 w-4 mr-2" />
                            Export Image
                          </Button>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {onExport && (
                  <>
                    <div className="text-sm font-medium text-gray-700">
                      Direct Export:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onExport("json")}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Export JSON
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onExport("excel")}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Export Excel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onExport("image")}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Export Image
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No data available
              </h3>
              <p className="text-gray-500">
                No water level readings found for the selected time range.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
