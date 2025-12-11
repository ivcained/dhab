import { NextRequest, NextResponse } from "next/server";
import {
  getUserSobrietyData,
  saveUserSobrietyData,
  deleteUserSobrietyData,
  initializeDatabase,
} from "~/lib/db";

// Initialize database on first request
let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

// GET - Fetch user sobriety data by FID
export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized();

    const { searchParams } = new URL(request.url);
    const fid = searchParams.get("fid");

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    const fidNumber = parseInt(fid, 10);
    if (isNaN(fidNumber)) {
      return NextResponse.json(
        { error: "Invalid FID format" },
        { status: 400 }
      );
    }

    const data = await getUserSobrietyData(fidNumber);

    if (!data) {
      return NextResponse.json(
        { data: null, message: "No data found for this user" },
        { status: 200 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("GET /api/sobriety error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Save or update user sobriety data
export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized();

    const body = await request.json();
    const {
      fid,
      startDate,
      startTime,
      addiction,
      customAddiction,
      dailyCost,
      motivation,
      pledgeDate,
      walletAddress,
      authStrategy,
    } = body;

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    if (!startDate || !addiction) {
      return NextResponse.json(
        { error: "Start date and addiction are required" },
        { status: 400 }
      );
    }

    const result = await saveUserSobrietyData({
      fid: parseInt(fid, 10),
      startDate,
      startTime: startTime || "",
      addiction,
      customAddiction: customAddiction || "",
      dailyCost: dailyCost || 8,
      motivation: motivation || "",
      pledgeDate: pledgeDate || "",
      walletAddress: walletAddress || "",
      authStrategy: authStrategy || "",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to save data" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Data saved successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/sobriety error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Reset user sobriety data
export async function DELETE(request: NextRequest) {
  try {
    await ensureDbInitialized();

    const { searchParams } = new URL(request.url);
    const fid = searchParams.get("fid");

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    const fidNumber = parseInt(fid, 10);
    if (isNaN(fidNumber)) {
      return NextResponse.json(
        { error: "Invalid FID format" },
        { status: 400 }
      );
    }

    const result = await deleteUserSobrietyData(fidNumber);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to delete data" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Data deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/sobriety error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
