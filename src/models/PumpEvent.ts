import mongoose from 'mongoose';

const PumpEventSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  startTime: { type: Date, required: true },
  stopTime: { type: Date },
  durationSeconds: { type: Number },
  startVolume: { type: Number },
  stopVolume: { type: Number },
  volumeFilled: { type: Number },
  status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
  anomaly: { type: String }, // e.g., 'no_level_change'
}, { timestamps: true });

export default mongoose.models.PumpEvent || mongoose.model('PumpEvent', PumpEventSchema);
