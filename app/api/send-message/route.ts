import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, text } = body;

    if (!to || !text) {
      return NextResponse.json(
        { success: false, error: "Missing 'to' or 'text' field" },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppMessage({ to, text });

    if (result.success) {
      return NextResponse.json({ success: true, data: result });
    }
    return NextResponse.json(
      { success: false, error: result.error || "Failed to send message" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
