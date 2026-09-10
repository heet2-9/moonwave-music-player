import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const recipientPhone = process.env.RECIPIENT_PHONE_NUMBER;

    if (!accessToken || !phoneNumberId || !recipientPhone) {
      return NextResponse.json(
        {
          success: false,
          error:
            "WhatsApp Business API credentials are not configured in environment variables. Falling back to Web Share API & prefilled WhatsApp URL.",
        },
        { status: 501 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const songTitle = formData.get("songTitle") as string || "Song";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No audio recording file uploaded." },
        { status: 400 }
      );
    }

    // Official WhatsApp Cloud API integration flow
    // 1. Upload media asset to Meta WhatsApp Graph API endpoint
    const uploadUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/media`;
    const mediaFormData = new FormData();
    mediaFormData.append("file", file, file.name);
    mediaFormData.append("type", file.type || "audio/webm");
    mediaFormData.append("messaging_product", "whatsapp");

    const mediaRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: mediaFormData,
    });

    if (!mediaRes.ok) {
      const errText = await mediaRes.text();
      console.error("WhatsApp Media Upload Error:", errText);
      return NextResponse.json(
        { success: false, error: "Failed to upload media to WhatsApp Cloud API." },
        { status: 502 }
      );
    }

    const mediaData = await mediaRes.json();
    const mediaId = mediaData.id;

    // 2. Send Audio Message via WhatsApp Cloud API
    const messageUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    const messageRes = await fetch(messageUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientPhone,
        type: "audio",
        audio: {
          id: mediaId,
        },
      }),
    });

    if (!messageRes.ok) {
      const errText = await messageRes.text();
      console.error("WhatsApp Message Send Error:", errText);
      return NextResponse.json(
        { success: false, error: "Failed to deliver audio message." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Karaoke recording for "${songTitle}" successfully delivered to ${recipientPhone}!`,
    });
  } catch (err: any) {
    console.error("WhatsApp API Route Exception:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}
