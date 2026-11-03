'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  Database,
  Key,
  Table,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  Globe,
} from 'lucide-react';

interface HealthData {
  status: 'ok' | 'warning' | 'critical';
  uptime: number;
  timestamp: string;
  checks: {
    database: string;
    databaseDetails: string | null;
    redis: string;
    tables: Record<string, 'ok' | 'missing'>;
    environment: Record<string, 'ok' | 'missing'>;
    clerkKeyMode: 'test' | 'production' | 'unknown';
  };
  warnings: string[];
  responseTime: string;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'ok') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> OK
      </span>
    );
  }
  if (status === 'warning' || status === 'test') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
        <AlertTriangle className="w-3 h-3" /> Warning
      </span>
    );
  }
  if (status === 'critical' || status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
        <XCircle className="w-3 h-3" /> Critical
      </span>
    );
  }
  if (status === 'missing') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
        <XCircle className="w-3 h-3" /> Missing
      </span>
    );
  }
  if (status === 'production') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Production
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-muted text-gray-700 dark:text-muted-foreground rounded-full">
      Unknown
    </span>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function SystemHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health/detailed');
      if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const overallStatusColor = {
    ok: 'border-green-500 bg-green-50 dark:bg-green-900/10',
    warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10',
    critical: 'border-red-500 bg-red-50 dark:bg-red-900/10',
  };

  const tables = data?.checks.tables || {};
  const envVars = data?.checks.environment || {};

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            System Health
          </h1>
          <p className="text-gray-600 dark:text-muted-foreground text-sm mt-1">
            Monitor environment configuration, database tables, and service status
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-card border border-gray-300 dark:border-border rounded-lg hover:bg-gray-50 dark:hover:bg-muted transition disabled:opacity-50"
          aria-label="Refresh health status"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          Failed to load health data: {error}
        </div>
      )}

      {data && (
        <>
          {/* Overall Status */}
          <div className={`mb-6 p-4 rounded-lg border-2 ${overallStatusColor[data.status] || ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">Overall Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={data.status} />
                  <span className="text-sm text-gray-500">
                    Uptime: {formatUptime(data.uptime)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-muted-foreground">Response Time</p>
                <p className="text-lg font-mono font-bold text-foreground">
                  {data.responseTime}
                </p>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {data.warnings.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h2 className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Warnings ({data.warnings.length})
              </h2>
              <ul className="space-y-1">
                {data.warnings.map((w, i) => (
                  <li key={i} className="text-sm text-blue-700 dark:text-blue-400">
                    • {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Database */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                Database
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-muted-foreground">Connectivity</span>
                  <StatusBadge status={data.checks.database} />
                </div>
                {data.checks.databaseDetails && (
                  <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    {data.checks.databaseDetails}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-muted-foreground">Redis Cache</span>
                  <StatusBadge status={data.checks.redis} />
                </div>
              </div>
            </div>

            {/* Environment Variables */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-600" />
                Environment Variables
              </h2>
              <div className="space-y-2">
                {Object.entries(envVars).map(([name, status]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-sm font-mono text-gray-700 dark:text-foreground">{name}</span>
                    <StatusBadge status={status} />
                  </div>
                ))}
              </div>
            </div>

            {/* Database Tables */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm md:col-span-2">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Table className="w-5 h-5 text-green-600" />
                Required Database Tables
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {Object.entries(tables).map(([name, status]) => (
                  <div key={name} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-input/50 rounded">
                    <span className="text-sm text-gray-700 dark:text-foreground">{name}</span>
                    <StatusBadge status={status} />
                  </div>
                ))}
              </div>
            </div>

            {/* Clerk Configuration */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                Clerk Configuration
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-muted-foreground">API Key Mode</span>
                  <StatusBadge status={data.checks.clerkKeyMode} />
                </div>
                {data.checks.clerkKeyMode === 'test' && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-700 dark:text-yellow-400">
                    <p className="font-medium mb-1">Test keys detected</p>
                    <p>Some Clerk features may be limited. Switch to <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">pk_live_</code> keys for production.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Server Info */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Server className="w-5 h-5 text-gray-600" />
                Server Info
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-muted-foreground">Uptime</span>
                  <span className="text-sm font-mono text-foreground">
                    {formatUptime(data.uptime)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-muted-foreground">Last Check</span>
                  <span className="text-sm font-mono text-foreground">
                    {new Date(data.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-muted-foreground">Response Time</span>
                  <span className="text-sm font-mono text-foreground">
                    {data.responseTime}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
