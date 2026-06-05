import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Device from "@/models/Device";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deviceId, action } = await req.json();

    if (!deviceId || !action || !['on', 'off', 'none'].includes(action)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    await connectToDatabase();

    const device = await Device.findOneAndUpdate(
      { deviceId, userId: session.user.id },
      { manualOverride: action },
      { new: true }
    );

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, device });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
