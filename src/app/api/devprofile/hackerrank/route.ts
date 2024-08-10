import { NextRequest, NextResponse } from "next/server";
import { signWithProviderID } from "@/config/reclaim/reclaimService";
import { getHackerrankStats } from "@/config/reclaim/hackerrank/service";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider");
  const username = req.nextUrl.searchParams.get("username") || "";
  let data = await getHackerrankStats(username);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { userId, providerId } = await req.json();

  try {
    const signedUrl = await signWithProviderID(
      userId,
      providerId,
      "hackerrank"
    );
    const qrCode = await QRCode.toDataURL(signedUrl);
    return NextResponse.json({ success: true, url: signedUrl, qr: qrCode });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: "An unknown error occurred" },
        { status: 500 }
      );
    }
  }
}