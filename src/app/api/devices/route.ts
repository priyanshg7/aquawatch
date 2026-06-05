import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Device from "@/models/Device";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const devices = await Device.find({ userId: session.user.id });
    return NextResponse.json({ devices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    await connectToDatabase();

    const newDevice = await Device.create({
      ...body,
      userId: session.user.id
    });

    return NextResponse.json({ device: newDevice }, { status: 201 });
  } catch (error: any) {
    // If error is duplicate key error
    if (error.code === 11000) {
      return NextResponse.json({ error: "Device ID is already registered." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    await connectToDatabase();
    await Device.findOneAndDelete({ _id: id, userId: session.user.id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) return NextResponse.json({ error: "Device ID is required" }, { status: 400 });

    await connectToDatabase();
    
    // Ensure the device belongs to the user
    const updatedDevice = await Device.findOneAndUpdate(
      { _id, userId: session.user.id },
      { $set: updateData },
      { new: true }
    );

    if (!updatedDevice) {
      return NextResponse.json({ error: "Device not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, device: updatedDevice });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
