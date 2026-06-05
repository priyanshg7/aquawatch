import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Device from "@/models/Device";
import Telemetry from "@/models/Telemetry";
import PumpEvent from "@/models/PumpEvent";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { deviceId, distance, temperature, humidity, pumpStatus, rain, error } = data;

    if (!deviceId || distance === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();

    let device = await Device.findOne({ deviceId });
    if (!device) {
      // Auto-register the device if it does not exist
      const User = require("@/models/User").default;
      const defaultUser = await User.findOne();
      
      if (!defaultUser) {
        return NextResponse.json({ error: "No users exist in the system to bind to" }, { status: 400 });
      }
      
      device = await Device.create({
        deviceId,
        userId: defaultUser._id,
        name: "Auto-Registered Tank",
        shape: "cylindrical",
        height: 100,
        radius: 50,
        isOnline: true,
        lastSeen: new Date(),
        pumpStatus: pumpStatus,
      });
    }

    // Update device online status
    device.isOnline = true;
    device.lastSeen = new Date();
    device.pumpStatus = pumpStatus;

    // Detect Ultrasonic Timeout / Invalid Reading
    // If pulseIn times out, it returns 0 duration -> 0 distance.
    if (distance <= 0) {
       console.warn(`[SENSOR ERROR] Device ${deviceId} reported distance 0 (timeout). Keeping last known state.`);
       // Do not process this reading for control logic, just return the current manualOverride/pumpState
       return NextResponse.json({
         success: true,
         command: 'none', // Maintain current state
         error: "Sensor timeout"
       });
    }

    // Calculate Volume
    let waterLevel = Math.max(0, device.height - distance);
    let volume = 0; // in Liters (1000 cm^3 = 1 Liter)

    if (device.shape === 'cylindrical') {
      volume = (Math.PI * Math.pow(device.radius || 1, 2) * waterLevel) / 1000;
    } else {
      volume = ((device.length || 1) * (device.breadth || 1) * waterLevel) / 1000;
    }
    
    if (isNaN(volume)) volume = 0;

    // Save Telemetry
    const telemetry = await Telemetry.create({
      deviceId,
      distance,
      waterLevel,
      volume,
      temperature,
      humidity,
      pumpStatus,
      rain: rain || false,
      error
    });

    // Handle Pump Events logging
    if (pumpStatus) {
      const activeEvent = await PumpEvent.findOne({ deviceId, status: 'running' });
      if (!activeEvent) {
        await PumpEvent.create({
          deviceId,
          startTime: new Date(),
          startVolume: volume,
          status: 'running'
        });
      }
    } else {
      const activeEvent = await PumpEvent.findOne({ deviceId, status: 'running' });
      if (activeEvent) {
        activeEvent.stopTime = new Date();
        activeEvent.durationSeconds = (activeEvent.stopTime.getTime() - activeEvent.startTime.getTime()) / 1000;
        activeEvent.stopVolume = volume;
        activeEvent.volumeFilled = volume - activeEvent.startVolume;
        activeEvent.status = 'completed';
        await activeEvent.save();
      }
    }

    // Command evaluation
    let responseCommand = device.manualOverride; // 'none', 'on', 'off'
    
    // Server-Side Autonomous Logic if device is set to 'none' (Auto)
    if (responseCommand === 'none') {
      const fillPercentage = (waterLevel / device.height) * 100;
      const { testMode, enableFailsafe, maxFillBuffer, enableAveraging } = device;
      
      if (fillPercentage <= 5) {
        device.consecutiveEmptyReadings = (device.consecutiveEmptyReadings || 0) + 1;
        device.consecutiveFullReadings = 0;
      } else if (fillPercentage >= 95) {
        device.consecutiveFullReadings = (device.consecutiveFullReadings || 0) + 1;
        device.consecutiveEmptyReadings = 0;
      } else {
        device.consecutiveEmptyReadings = 0;
        device.consecutiveFullReadings = 0;
      }

      // Debouncing threshold: Requires N consecutive readings (e.g., 3 readings ≈ 9 seconds)
      const debounceThreshold = (testMode || enableAveraging === false) ? 1 : 3;

      if (device.consecutiveEmptyReadings >= debounceThreshold) {
        responseCommand = 'on';
      } else if (device.consecutiveFullReadings >= debounceThreshold) {
        responseCommand = 'off';
      }
      
      // Failsafe Logic: Max Fill Buffer Timeout
      if (enableFailsafe && pumpStatus && !testMode) {
        const activeEvent = await PumpEvent.findOne({ deviceId, status: 'running' });
        if (activeEvent) {
          const runDurationMins = (new Date().getTime() - activeEvent.startTime.getTime()) / 60000;
          if (runDurationMins > (maxFillBuffer || 5)) {
            // Force pump off to prevent overflow/motor damage
            responseCommand = 'off';
            device.manualOverride = 'off'; // Lock it out
            console.warn(`[FAILSAFE] Device ${deviceId} exceeded max fill time. Locked OFF.`);
          }
        }
      }
    }

    await device.save();

    // Respond with commands
    return NextResponse.json({
      success: true,
      command: responseCommand
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
