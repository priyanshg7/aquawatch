"use client";

import { useEffect, useState, useCallback } from "react";
import TankVisualization from "@/components/TankVisualization";
import styles from "./Dashboard.module.css";
import { Activity, Droplet, Thermometer, Wind, AlertCircle, Clock, BellRing, History, ShieldAlert, Info } from "lucide-react";

interface TelemetryData {
  waterLevel: number;
  volume: number;
  temperature: number;
  humidity: number;
  pumpStatus: boolean;
  rain?: boolean;
  error?: string;
  updatedAt: string;
}

interface DeviceConfig {
  deviceId: string;
  name: string;
  shape: 'cylindrical' | 'rectangular';
  height: number;
  isOnline: boolean;
  manualOverride: string;
}

interface PumpEvent {
  _id: string;
  startTime: string;
  stopTime?: string;
  durationSeconds?: number;
  volumeFilled?: number;
}

// Dummy data for Demo Mode
const DEMO_DEVICE: DeviceConfig = {
  deviceId: "demo-device",
  name: "Demo Smart Tank",
  shape: 'cylindrical',
  height: 100,
  isOnline: false,
  manualOverride: 'none',
};

const DEMO_TELEMETRY: TelemetryData = {
  waterLevel: 65,
  volume: 1250,
  temperature: 24.5,
  humidity: 55,
  pumpStatus: false,
  rain: false,
  updatedAt: new Date().toISOString(),
};

const DEMO_EVENTS: PumpEvent[] = [
  { _id: '1', startTime: new Date(Date.now() - 3600000 * 2).toISOString(), stopTime: new Date(Date.now() - 3600000 * 2 + 600000).toISOString(), durationSeconds: 600, volumeFilled: 150 },
  { _id: '2', startTime: new Date(Date.now() - 3600000 * 24).toISOString(), stopTime: new Date(Date.now() - 3600000 * 24 + 900000).toISOString(), durationSeconds: 900, volumeFilled: 220 },
];

export default function DashboardClient({ userId }: { userId: string }) {
  const [device, setDevice] = useState<DeviceConfig | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [recentEvents, setRecentEvents] = useState<PumpEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/live");
      if (res.ok) {
        const data = await res.json();
        if (data.device) {
          setDevice(data.device);
          setTelemetry(data.telemetry);
          setRecentEvents(data.recentEvents || []);
          setIsDemoMode(false);
        } else {
          // Fallback to Demo Mode
          setDevice(DEMO_DEVICE);
          setTelemetry(DEMO_TELEMETRY);
          setRecentEvents(DEMO_EVENTS);
          setIsDemoMode(true);
        }
      }
    } catch (error) {
      // Use console.warn instead of console.error to prevent Next.js dev overlay from popping up
      // if the server momentarily restarts or connection drops during the 5-second polling.
      console.warn("Failed to fetch dashboard data (server may be restarting)", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const togglePump = async (action: 'on' | 'off' | 'none') => {
    if (!device || !device.isOnline || isDemoMode) return;
    try {
      await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: device.deviceId, action })
      });
      fetchData();
    } catch (error) {
      console.error("Control failed", error);
    }
  };

  if (loading) {
    return <div className={styles.loadingState}>Loading Dashboard...</div>;
  }

  const activeDevice = device || DEMO_DEVICE;
  const activeTelemetry = telemetry || DEMO_TELEMETRY;

  const percentage = (activeTelemetry.waterLevel / activeDevice.height) * 100;
  const safePercentage = Math.max(0, Math.min(100, percentage));
  const isPumpOn = activeTelemetry.pumpStatus;
  const volumeStr = `${activeTelemetry.volume.toFixed(1)} L`;
  const tempStr = activeTelemetry.temperature ? `${activeTelemetry.temperature}°C` : '-- °C';
  const humStr = activeTelemetry.humidity ? `${activeTelemetry.humidity}%` : '-- %';

  const alerts = [];
  if (safePercentage >= 95) alerts.push("Tank Full");
  if (safePercentage <= 5) alerts.push("Tank Empty");
  if (activeTelemetry.rain) alerts.push("Leakage / Rain Detected!");
  if (activeTelemetry.error) alerts.push(`Hardware Error: ${activeTelemetry.error}`);
  if (!activeDevice.isOnline && !isDemoMode) alerts.push("Connection Lost");

  let estimatedFillTime = "--";
  if (isPumpOn && safePercentage < 100) {
    const remainingPercent = 100 - safePercentage;
    const mins = Math.ceil(remainingPercent / 5);
    estimatedFillTime = `~${mins} mins remaining`;
  } else if (safePercentage >= 100) {
    estimatedFillTime = "Full";
  }

  return (
    <div className={styles.dashboardContainer}>
      {isDemoMode && (
        <div className={styles.demoBanner}>
          <Info size={18} />
          <span>No device connected. Displaying demo data. Go to <a href="/devices" style={{textDecoration: 'underline'}}>Devices</a> to link your smart tank.</span>
        </div>
      )}

      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>{activeDevice.name}</h1>
          <div className={styles.statusBadge} data-online={activeDevice.isOnline}>
            <span className={styles.dot}></span>
            {activeDevice.isOnline ? 'Online' : 'Offline'}
          </div>
          {activeTelemetry.updatedAt && !isDemoMode && (
            <p className={styles.lastUpdated}>
              Last updated: {new Date(activeTelemetry.updatedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
        
        <div className={styles.controls}>
          <h3>Pump Control</h3>
          {(!activeDevice.isOnline || isDemoMode) ? (
            <div className={styles.offlineWarning}>
              <ShieldAlert size={16} /> Device Offline - Control Disabled
            </div>
          ) : (
            <div className={styles.btnGroup}>
              <button 
                className={`${styles.ctrlBtn} ${activeDevice.manualOverride === 'on' ? styles.activeOn : ''}`}
                onClick={() => togglePump('on')}
              >
                Force ON
              </button>
              <button 
                className={`${styles.ctrlBtn} ${activeDevice.manualOverride === 'none' ? styles.activeAuto : ''}`}
                onClick={() => togglePump('none')}
              >
                Auto
              </button>
              <button 
                className={`${styles.ctrlBtn} ${activeDevice.manualOverride === 'off' ? styles.activeOff : ''}`}
                onClick={() => togglePump('off')}
              >
                Force OFF
              </button>
            </div>
          )}
        </div>
      </header>

      {alerts.length > 0 && (
        <div className={`premium-card ${styles.alertsCard}`}>
          <h3 className={styles.alertsTitle}><BellRing size={20} /> Active Alerts</h3>
          <ul className={styles.alertsList}>
            {alerts.map((alert, idx) => (
              <li key={idx}>
                <AlertCircle size={16} /> {alert}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.grid}>
        <div className={`premium-card ${styles.tankCard}`}>
          <h3 className={styles.cardHeader}>
            <Droplet className="text-gradient" size={20} /> Live Tank View
          </h3>
          <div className={styles.tankWrapper}>
            <TankVisualization 
              percentage={percentage} 
              shape={activeDevice.shape} 
              isPumpOn={isPumpOn} 
            />
          </div>
          {isPumpOn && (
            <div className={styles.estimatedTime}>
              <Clock size={16} /> {estimatedFillTime}
            </div>
          )}
        </div>

        <div className={styles.metricsGrid}>
          <div className={`premium-card ${styles.metricCard}`}>
            <div className={styles.iconWrapper} style={{background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary-color)'}}>
              <Wind size={24} />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Water Volume</span>
              <span className={styles.metricValue}>{volumeStr}</span>
            </div>
          </div>
          <div className={`premium-card ${styles.metricCard}`}>
            <div className={styles.iconWrapper} style={{background: isPumpOn ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)', color: isPumpOn ? 'var(--success)' : 'var(--text-muted)'}}>
              <Activity size={24} />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Pump Status</span>
              <span className={styles.metricValue} style={{ color: isPumpOn ? 'var(--success)' : 'inherit' }}>
                {isPumpOn ? 'Running' : 'Idle'}
              </span>
            </div>
          </div>
          <div className={`premium-card ${styles.metricCard}`}>
            <div className={styles.iconWrapper} style={{background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)'}}>
              <Thermometer size={24} />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Temperature</span>
              <span className={styles.metricValue}>{tempStr}</span>
            </div>
          </div>
          <div className={`premium-card ${styles.metricCard}`}>
            <div className={styles.iconWrapper} style={{background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8'}}>
              <Droplet size={24} />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Humidity</span>
              <span className={styles.metricValue}>{humStr}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`premium-card`} style={{ marginTop: '8px' }}>
        <h3 className={styles.cardHeader}>
          <Wind size={20} className="text-gradient" /> Leakage / Rain Detection
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: activeTelemetry.rain ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)', padding: '20px', borderRadius: '12px', border: `1px solid ${activeTelemetry.rain ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}` }}>
          <div style={{ background: activeTelemetry.rain ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: activeTelemetry.rain ? 'var(--danger)' : 'var(--success)', padding: '12px', borderRadius: '50%' }}>
            <Droplet size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: activeTelemetry.rain ? 'var(--danger)' : 'var(--success)' }}>
              {activeTelemetry.rain ? '🌧️ Water Detected' : 'Dry / No Leakage'}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Independent monitoring module reading from D4
            </div>
          </div>
        </div>
      </div>

      <div className={`premium-card ${styles.recentActivity}`}>
        <h3 className={styles.cardHeader}>
          <History size={20} className="text-gradient" /> Recent Pump Activity
        </h3>
        {recentEvents.length === 0 ? (
          <div className={styles.emptyState}>No recent activity found.</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.activityTable}>
              <thead>
                <tr>
                  <th>Start Time</th>
                  <th>Stop Time</th>
                  <th>Duration</th>
                  <th>Volume Filled</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event, i) => (
                  <tr key={event._id || i}>
                    <td>{new Date(event.startTime).toLocaleString()}</td>
                    <td>{event.stopTime ? new Date(event.stopTime).toLocaleTimeString() : 'Running...'}</td>
                    <td>{event.durationSeconds ? `${Math.round(event.durationSeconds / 60)} mins` : '--'}</td>
                    <td>{event.volumeFilled ? `${Math.round(event.volumeFilled)} L` : '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
