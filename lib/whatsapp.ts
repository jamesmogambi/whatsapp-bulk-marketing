const WASENDER_KEY = process.env.WASENDER_KEY;
const WASENDER_URL = "https://api.wasenderapi.com/api/send-message";

export interface SendMessageOptions {
  to: string;
  text: string;
}

export interface SendResult {
  success: boolean;
  msgId?: number;
  jid?: string;
  status?: string;
  error?: string;
}

export async function sendWhatsAppMessage(options: SendMessageOptions): Promise<SendResult> {
  if (!WASENDER_KEY) {
    return { success: false, error: "WASENDER_KEY not configured" };
  }

  const phone = normalizePhone(options.to);
  if (!phone) {
    return { success: false, error: "Invalid phone number" };
  }

  try {
    const response = await fetch(WASENDER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WASENDER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        text: options.text,
      }),
    });

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        msgId: data.data?.msgId,
        jid: data.data?.jid,
        status: data.data?.status,
      };
    } else {
      return {
        success: false,
        error: data.message || "Failed to send message",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function normalizePhone(phone: string): string | null {
  let cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1);
  } else if (cleaned.startsWith("254")) {
    // already correct
  } else if (!cleaned.startsWith("254") && cleaned.length === 9) {
    cleaned = "254" + cleaned;
  }
  
  if (cleaned.length !== 12 || !cleaned.startsWith("254")) {
    return null;
  }
  
  return "+" + cleaned;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
