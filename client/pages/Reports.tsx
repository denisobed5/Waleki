import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WaterLevelChart } from "@/components/charts/WaterLevelChart";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WaterLevelReading } from "@shared/api";
import { MockApiService } from "@/services/mockApi";
import { Device } from "@shared/api";
import { ArrowLeft, TrendingUp } from "lucide-react";

export default function Reports() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [readings, setReadings] = useState<WaterLevelReading[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await MockApiService.getDevices();
        setDevices(list);
        if (list.length > 0) setSelectedId(list[0].id);
      } catch (e) {
        setError("Failed to load devices");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadReadings = async () => {
      if (!selectedId) return;
      try {
        const list = await MockApiService.getDeviceReadings(
          selectedId,
          undefined,
          undefined,
          200,
        );
        setReadings(list);
      } catch (e) {
        setError("Failed to load readings");
      }
    };
    loadReadings();
  }, [selectedId]);

  return (
    <Layout className="bg-gray-50">
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="h-7 w-7 mr-2 text-blue-600" />
              Reports
            </h1>
          </div>
          {devices.length > 0 && (
            <Select
              value={selectedId?.toString() ?? ""}
              onValueChange={(v) => setSelectedId(parseInt(v))}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select device" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Water Level Trends</CardTitle>
            <CardDescription>
              Analyze water levels and export data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className="text-red-600 mb-4 text-sm">{error}</div>}
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : devices.length === 0 ? (
              <div className="text-gray-500">No devices available</div>
            ) : selectedId ? (
              <WaterLevelChart
                deviceId={selectedId}
                deviceName={
                  devices.find((d) => d.id === selectedId)?.name || ""
                }
                onExport={(format) => {
                  if (!selectedId) return;
                  if (format === "excel") {
                    const header =
                      "Timestamp,Water Level (m),Temperature (°C),Battery Level (%)\n";
                    const rows = readings
                      .map(
                        (r) =>
                          `${r.timestamp},${r.level},${r.temperature ?? ""},${r.batteryLevel ?? ""}`,
                      )
                      .join("\n");
                    const csv = header + rows;
                    const uri =
                      "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
                    const a = document.createElement("a");
                    a.href = uri;
                    a.download = `device_${selectedId}_readings.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  } else if (format === "json") {
                    const payload = {
                      deviceId: selectedId,
                      exportDate: new Date().toISOString(),
                      dataPoints: readings.length,
                      readings,
                    };
                    const dataStr = JSON.stringify(payload, null, 2);
                    const uri =
                      "data:application/json;charset=utf-8," +
                      encodeURIComponent(dataStr);
                    const a = document.createElement("a");
                    a.href = uri;
                    a.download = `device_${selectedId}_readings.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  } else if (format === "image") {
                    const el = document.getElementById("reports-chart");
                    const svg = el?.querySelector("svg");
                    if (!svg) return alert("Chart not ready for export");
                    const xml = new XMLSerializer().serializeToString(svg);
                    const svgBlob = new Blob([xml], {
                      type: "image/svg+xml;charset=utf-8",
                    });
                    const url = URL.createObjectURL(svgBlob);
                    const img = new Image();
                    img.onload = () => {
                      const canvas = document.createElement("canvas");
                      canvas.width = img.width;
                      canvas.height = img.height;
                      const ctx = canvas.getContext("2d");
                      if (!ctx) return;
                      ctx.fillStyle = "#ffffff";
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                      ctx.drawImage(img, 0, 0);
                      URL.revokeObjectURL(url);
                      const png = canvas.toDataURL("image/png");
                      const a = document.createElement("a");
                      a.href = png;
                      a.download = `device_${selectedId}_chart.png`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    };
                    img.src = url;
                  }
                }}
                showExportButtons={true}
                exportContainerId="reports-chart"
              />
            ) : null}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Device Data</CardTitle>
            <CardDescription>
              View all readings before exporting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Water Level (m)</TableHead>
                    <TableHead>Temperature (°C)</TableHead>
                    <TableHead>Battery (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">
                        {new Date(r.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>{r.level.toFixed(2)}</TableCell>
                      <TableCell>
                        {r.temperature !== undefined
                          ? r.temperature.toFixed(1)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {r.batteryLevel !== undefined ? r.batteryLevel : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
