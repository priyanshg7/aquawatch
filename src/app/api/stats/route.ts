import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Device from "@/models/Device";
import PumpEvent from "@/models/PumpEvent";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date"); // Optional specific date

    await connectToDatabase();
    
    // Get user's device
    const device = await Device.findOne({ userId: session.user.id });
    if (!device) return NextResponse.json({ events: [] });

    let query: any = { deviceId: device.deviceId, status: 'completed' };

    if (dateParam) {
      const startOfDay = new Date(dateParam);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateParam);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.startTime = { $gte: startOfDay, $lte: endOfDay };
    }

    // Fetch the last 50 events for analytics
    const events = await PumpEvent.find(query).sort({ startTime: -1 }).limit(50);

    return NextResponse.json({ events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
