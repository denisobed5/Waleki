import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Code, ServerCog, Network, Shield, Activity } from 'lucide-react';

export default function Api() {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080';

  return (
    <Layout className="bg-gray-50">
      <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ServerCog className="h-7 w-7 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">API</h1>
          </div>
          <p className="text-gray-600">Endpoints for device data ingestion and platform access.</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-blue-600" /> Ingest Water Readings</CardTitle>
            <CardDescription>Send device telemetry to the server.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">POST</Badge>
              <code className="text-sm">{`${baseUrl}/api/data/ingest`}</code>
            </div>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm leading-relaxed">{`curl -X POST ${baseUrl}/api/data/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "deviceId": 1,
    "level": 2.5,
    "temperature": 22.3,
    "batteryLevel": 85,
    "timestamp": "${new Date().toISOString()}"
  }'`}</pre>
            </div>
            <p className="text-sm text-gray-600">
              Fields: deviceId (number), level (number, meters), temperature (optional, °C), batteryLevel (optional, %), timestamp (optional ISO8601).
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Network className="h-5 w-5 text-blue-600" /> Devices</CardTitle>
            <CardDescription>Manage devices (requires authentication).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Endpoint method="GET" url={`${baseUrl}/api/devices`} desc="List devices" />
            <Endpoint method="GET" url={`${baseUrl}/api/devices/:id`} desc="Get device by ID" />
            <Endpoint method="POST" url={`${baseUrl}/api/devices`} desc="Create device" />
            <Endpoint method="PUT" url={`${baseUrl}/api/devices/:id`} desc="Update device" />
            <Endpoint method="DELETE" url={`${baseUrl}/api/devices/:id`} desc="Delete device" />
            <Endpoint method="GET" url={`${baseUrl}/api/devices/:id/readings`} desc="List device readings" />
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-blue-600" /> Auth</CardTitle>
            <CardDescription>Session-based auth. In demo mode, auth is bypassed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Endpoint method="POST" url={`${baseUrl}/api/auth/login`} desc="Login (username, password)" />
            <Endpoint method="POST" url={`${baseUrl}/api/auth/logout`} desc="Logout" />
            <Endpoint method="GET" url={`${baseUrl}/api/auth/me`} desc="Current user" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5 text-blue-600" /> Notes</CardTitle>
            <CardDescription>Best practices</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-gray-700 space-y-2">
            <ul className="list-disc pl-5 space-y-1">
              <li>Use HTTPS and include Authorization: Bearer &lt;token&gt; when not in demo mode.</li>
              <li>Send JSON bodies with Content-Type: application/json.</li>
              <li>Respect rate limits; batch readings on the device if network is unstable.</li>
              <li>Validate numeric types and timestamps at the edge before sending.</li>
            </ul>
            <Separator />
            <p>
              Need help? Contact support or check the Dashboard for examples.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function Endpoint({ method, url, desc }: { method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, desc: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border rounded-md p-3 bg-white">
      <div className="flex items-center gap-2">
        <Badge variant={method === 'GET' ? 'default' : method === 'POST' ? 'secondary' : method === 'PUT' ? 'outline' : 'destructive'}>
          {method}
        </Badge>
        <code className="text-sm">{url}</code>
      </div>
      <span className="text-sm text-gray-600">{desc}</span>
    </div>
  );
}
