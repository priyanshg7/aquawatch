import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Device from "@/models/Device";
import Telemetry from "@/models/Telemetry";
import PumpEvent from "@/models/PumpEvent";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Get user's first device for the prototype
    const device = await Device.findOne({ userId: session.user.id });
    
    if (!device) {
      return NextResponse.json({ device: null, telemetry: null });
    }

    // Get latest telemetry
    const telemetry = await Telemetry.findOne({ deviceId: device.deviceId }).sort({ createdAt: -1 });

    // Calculate dynamic online status (e.g., seen within the last 2 minutes)
    const isActuallyOnline = device.lastSeen ? (new Date().getTime() - new Date(device.lastSeen).getTime()) < 120000 : false;
    const deviceData = device.toObject();
    deviceData.isOnline = isActuallyOnline;

    // Get recent pump events
    const recentEvents = await PumpEvent.find({ deviceId: device.deviceId, status: 'completed' })
      .sort({ startTime: -1 })
      .limit(6);

    return NextResponse.json({ device: deviceData, telemetry, recentEvents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
