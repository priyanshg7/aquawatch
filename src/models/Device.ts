import mongoose from 'mongoose';

const DeviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true }, // Unique identifier, e.g., MAC address
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, default: 'My Smart Tank' },
  // Tank Configuration
  shape: { type: String, enum: ['cylindrical', 'rectangular'], default: 'cylindrical' },
  height: { type: Number, default: 100 }, // Total height in cm
  radius: { type: Number }, // For cylindrical (cm)
  length: { type: Number }, // For rectangular (cm)
  breadth: { type: Number }, // For rectangular (cm)
  sensorOffset: { type: Number, default: 0 }, // Distance from sensor to max water level (cm)
  
  // Current Status
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date },
  pumpStatus: { type: Boolean, default: false }, // true = ON, false = OFF
  manualOverride: { type: String, enum: ['none', 'on', 'off'], default: 'none' }, // Commanded state
  
  // Advanced Settings & Failsafes
  enableAveraging: { type: Boolean, default: true },
  enableFailsafe: { type: Boolean, default: true },
  maxFillBuffer: { type: Number, default: 5 }, // minutes buffer
  noChangeDuration: { type: Number, default: 60 }, // seconds before no-change triggers error
  testMode: { type: Boolean, default: false }, // Relaxes rules for demo/testing
  targetSSID: { type: String, default: "" },
  targetPassword: { type: String, default: "" },
  
  // Stabilization Logic State
  consecutiveEmptyReadings: { type: Number, default: 0 },
  consecutiveFullReadings: { type: Number, default: 0 },
}, { timestamps: true });

// Delete the cached model to allow HMR to update the schema
delete mongoose.models.Device;
export default mongoose.model('Device', DeviceSchema);
