"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Settings, Trash2, Cpu, Save, X } from "lucide-react";
import styles from "./Devices.module.css";

interface Device {
  _id: string;
  deviceId: string;
  name: string;
  shape: string;
  height: number;
  radius: number;
  length: number;
  breadth: number;
  enableAveraging?: boolean;
  enableFailsafe?: boolean;
  maxFillBuffer?: number;
  noChangeDuration?: number;
  testMode?: boolean;
  targetSSID?: string;
  targetPassword?: string;
}

export default function DevicesClient({ userId }: { userId: string }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeDevice, setActiveDevice] = useState<Device | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State for Registration
  const [deviceId, setDeviceId] = useState("");
  const [name, setName] = useState("My Smart Tank");
  const [shape, setShape] = useState("cylindrical");
  const [height, setHeight] = useState(100);
  const [radius, setRadius] = useState(50);
  const [length, setLength] = useState(100);
  const [breadth, setBreadth] = useState(100);

  // Form State for Settings
  const [settingsForm, setSettingsForm] = useState({
    enableAveraging: true,
    enableFailsafe: true,
    maxFillBuffer: 5,
    noChangeDuration: 60,
    testMode: false,
    targetSSID: "",
    targetPassword: ""
  });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/devices");
      const data = await res.json();
      setDevices(data.devices || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, name, shape, height, radius, length, breadth }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to register device.");
        return;
      }
      
      setShowModal(false);
      fetchDevices();
      
      // Reset form
      setDeviceId("");
      setName("My Smart Tank");
    } catch (e) {
      console.error(e);
      setErrorMsg("A network error occurred.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetch(`/api/devices?id=${id}`, { method: "DELETE" });
      fetchDevices();
    } catch (e) {
      console.error(e);
    }
  };

  const openSettings = (device: Device) => {
    setActiveDevice(device);
    setSettingsForm({
      enableAveraging: device.enableAveraging ?? true,
      enableFailsafe: device.enableFailsafe ?? true,
      maxFillBuffer: device.maxFillBuffer ?? 5,
      noChangeDuration: device.noChangeDuration ?? 60,
      testMode: device.testMode ?? false,
      targetSSID: device.targetSSID ?? "",
      targetPassword: device.targetPassword ?? ""
    });
    setShowSettingsModal(true);
    setErrorMsg("");
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!activeDevice) return;

    try {
      const res = await fetch("/api/devices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: activeDevice._id,
          ...settingsForm
        }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update settings.");
        return;
      }
      
      setShowSettingsModal(false);
      fetchDevices();
    } catch (e) {
      console.error(e);
      setErrorMsg("A network error occurred while saving settings.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className="text-gradient">Manage Devices</h1>
        <button className={styles.addBtn} onClick={() => { setShowModal(true); setErrorMsg(""); }}>
          <PlusCircle size={20} /> Add Device
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Loading Devices...</div>
      ) : devices.length === 0 ? (
        <div className={`premium-card ${styles.emptyState}`}>
          <div className={styles.emptyIcon}><Cpu size={48} /></div>
          <h2>No Devices Connected</h2>
          <p>You haven't paired any smart tank yet. Register your IoT device to start monitoring.</p>
          <button className={styles.addBtnLarge} onClick={() => { setShowModal(true); setErrorMsg(""); }}>
            <PlusCircle size={20} /> Register Your First Device
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {devices.map(d => (
            <div key={d._id} className={`premium-card ${styles.card}`}>
              <div className={styles.cardHeader}>
                <h3>{d.name}</h3>
                <Settings className={styles.icon} onClick={() => openSettings(d)} style={{cursor: 'pointer'}} />
              </div>
              <div className={styles.cardBody}>
                <p><strong>Device ID:</strong> {d.deviceId}</p>
                <p><strong>Shape:</strong> <span style={{textTransform: 'capitalize'}}>{d.shape}</span></p>
                <p><strong>Dimensions:</strong> {d.height}cm (H) {d.shape === 'cylindrical' ? `x ${d.radius}cm (R)` : `x ${d.length}cm (L) x ${d.breadth}cm (B)`}</p>
                {d.testMode && <span style={{display:'inline-block', background:'#f59e0b', color:'white', padding:'2px 8px', borderRadius:'12px', fontSize:'0.75rem', marginTop:'8px'}}>Testing Mode Active</span>}
              </div>
              <div style={{display:'flex', gap:'10px', marginTop:'16px'}}>
                <button className={styles.deleteBtn} onClick={() => handleDelete(d._id)} style={{flex: 1}}>
                  <Trash2 size={16} /> Remove
                </button>
                <button className={styles.addBtn} onClick={() => openSettings(d)} style={{flex: 1, padding:'8px 12px'}}>
                  Configure
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Registration Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={`premium-card ${styles.modal}`}>
            <h2 style={{ marginBottom: '16px', textAlign: 'center' }}>Register New Device</h2>
            
            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', fontWeight: 500 }}>
                {errorMsg}
              </div>
            )}
            
            <form onSubmit={handleRegister} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Device ID / MAC Address</label>
                <input required value={deviceId} onChange={e => setDeviceId(e.target.value)} placeholder="e.g., ESP-123456" />
              </div>
              <div className={styles.inputGroup}>
                <label>Nickname</label>
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Main Roof Tank" />
              </div>
              <div className={styles.inputGroup}>
                <label>Tank Shape</label>
                <select value={shape} onChange={e => setShape(e.target.value)}>
                  <option value="cylindrical">Cylindrical</option>
                  <option value="rectangular">Rectangular</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Total Height (cm)</label>
                <input type="number" required value={height} onChange={e => setHeight(Number(e.target.value))} />
              </div>

              {shape === 'cylindrical' ? (
                <div className={styles.inputGroup}>
                  <label>Radius (cm)</label>
                  <input type="number" required value={radius} onChange={e => setRadius(Number(e.target.value))} />
                </div>
              ) : (
                <>
                  <div className={styles.inputGroup}>
                    <label>Length (cm)</label>
                    <input type="number" required value={length} onChange={e => setLength(Number(e.target.value))} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Breadth (cm)</label>
                    <input type="number" required value={breadth} onChange={e => setBreadth(Number(e.target.value))} />
                  </div>
                </>
              )}

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.addBtn}>Register Device</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className={styles.modalOverlay}>
          <div className={`premium-card ${styles.modal}`} style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2>Advanced Settings</h2>
              <X size={24} style={{cursor: 'pointer', color: 'var(--text-secondary)'}} onClick={() => setShowSettingsModal(false)} />
            </div>
            
            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', fontWeight: 500 }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveSettings} className={styles.form}>
              
              <div style={{background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: '8px', marginBottom: '16px'}}>
                <h4 style={{margin: 0, color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <Settings size={16} /> Operation Mode
                </h4>
                <label style={{display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', cursor: 'pointer'}}>
                  <input type="checkbox" checked={settingsForm.testMode} onChange={e => setSettingsForm({...settingsForm, testMode: e.target.checked})} />
                  <span style={{fontWeight: 500}}>Testing / Demo Mode</span>
                </label>
                <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 24px'}}>
                  Relaxes fail-safes and disables debouncing (stabilization) for immediate responsiveness during testing.
                </p>
              </div>

              <div className={styles.inputGroup} style={{marginBottom: '8px'}}>
                <label style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <input type="checkbox" checked={settingsForm.enableAveraging} onChange={e => setSettingsForm({...settingsForm, enableAveraging: e.target.checked})} />
                  Enable Data Stabilization (Debouncing)
                </label>
                <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 24px'}}>
                  Requires consecutive identical readings before toggling pump state to prevent oscillation.
                </p>
              </div>

              <div className={styles.inputGroup}>
                <label style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <input type="checkbox" checked={settingsForm.enableFailsafe} onChange={e => setSettingsForm({...settingsForm, enableFailsafe: e.target.checked})} />
                  Enable Fail-safe Timeout Logic
                </label>
                <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 24px'}}>
                  Automatically forces the pump OFF if it runs longer than the defined Max Fill Buffer.
                </p>
              </div>

              {settingsForm.enableFailsafe && (
                <div style={{marginLeft: '24px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  <div className={styles.inputGroup}>
                    <label>Max Fill Time Buffer (Minutes)</label>
                    <input type="number" min="1" value={settingsForm.maxFillBuffer} onChange={e => setSettingsForm({...settingsForm, maxFillBuffer: Number(e.target.value)})} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>No-Change Detection Duration (Seconds)</label>
                    <input type="number" min="10" value={settingsForm.noChangeDuration} onChange={e => setSettingsForm({...settingsForm, noChangeDuration: Number(e.target.value)})} />
                    <p style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px'}}>
                      If the water level doesn't change for this duration while the pump is ON, it assumes pump failure and stops.
                    </p>
                  </div>
                </div>
              )}

              <hr style={{margin: '24px 0', borderColor: 'var(--border-color)', opacity: 0.5}} />
              
              <h4 style={{margin: '0 0 16px 0'}}>Hardware WiFi Configuration</h4>
              <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px'}}>
                Update the WiFi credentials the ESP8266 should attempt to connect to. (Requires hardware support for dynamic fetching).
              </p>
              
              <div className={styles.inputGroup}>
                <label>Target SSID</label>
                <input value={settingsForm.targetSSID} onChange={e => setSettingsForm({...settingsForm, targetSSID: e.target.value})} placeholder="e.g., Home_Network" />
              </div>
              <div className={styles.inputGroup}>
                <label>Target Password</label>
                <input type="text" value={settingsForm.targetPassword} onChange={e => setSettingsForm({...settingsForm, targetPassword: e.target.value})} placeholder="Leave blank for open networks" />
              </div>

              <div className={styles.modalActions} style={{marginTop: '24px'}}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowSettingsModal(false)}>Cancel</button>
                <button type="submit" className={styles.addBtn} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <Save size={16} /> Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
