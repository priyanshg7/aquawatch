import mongoose from 'mongoose';

const TelemetrySchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  distance: { type: Number, required: true }, // Raw distance from sensor in cm
  waterLevel: { type: Number, required: true }, // Calculated water level in cm
  volume: { type: Number, required: true }, // Calculated volume in Liters
  temperature: { type: Number },
  humidity: { type: Number },
  pumpStatus: { type: Boolean },
  rain: { type: Boolean, default: false },
  error: { type: String }, // E.g., 'sensor_error', 'dry_run'
}, { timestamps: true });

export default mongoose.models.Telemetry || mongoose.model('Telemetry', TelemetrySchema);
