import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, query, limit, startAfter, DocumentSnapshot } from "firebase/firestore";
import { sendWhatsAppMessage, delay } from "@/lib/whatsapp";

const firebaseConfig = {
  apiKey: "AIzaSyDmcuRyNFxLSApRSz6-tXVewGAYHuuokBc",
  authDomain: "whatsapp-campaign-xxx.firebaseapp.com",
  projectId: "whatsapp-campaign-xxx",
  storageBucket: "whatsapp-campaign-xxx.firebasestorage.app",
  messagingSenderId: "305280023526",
  appId: "1:305280023526:web:7e243cfeb48f418a047427",
  measurementId: "G-93L237NX8L",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const BATCH_SIZE = 100;
const MESSAGE_DELAY_MS = 8000; // 8 seconds between messages
const BATCH_DELAY_MS = 60000; // 60 seconds between batches

interface Escort {
  id: string;
  name: string;
  phone: string;
  city: string;
  area: string;
  services: string[];
}

async function getEscortsBatch(collectionName: string, lastDoc?: DocumentSnapshot): Promise<{ escorts: Escort[]; lastDoc: DocumentSnapshot | null }> {
  let q = query(collection(db, collectionName), limit(BATCH_SIZE));
  
  if (lastDoc) {
    q = query(collection(db, collectionName), startAfter(lastDoc), limit(BATCH_SIZE));
  }
  
  const snapshot = await getDocs(q);
  const escorts: Escort[] = [];
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.phone) {
      escorts.push({
        id: doc.id,
        name: data.name || "",
        phone: data.phone,
        city: data.city || "",
        area: data.area || "",
        services: data.services || [],
      });
    }
  }
  
  return {
    escorts,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
  };
}

function personalizeMessage(template: string, escort: Escort): string {
  return template
    .replace(/\{\{name\}\}/gi, escort.name)
    .replace(/\{\{city\}\}/gi, escort.city)
    .replace(/\{\{area\}\}/gi, escort.area)
    .replace(/\{\{phone\}\}/gi, escort.phone);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, collection: collectionName = "nai-raha", maxBatches } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Missing 'message' field" },
        { status: 400 }
      );
    }

    const results = {
      total: 0,
      sent: 0,
      failed: 0,
      batches: 0,
      errors: [] as string[],
    };

    let lastDoc: DocumentSnapshot | null = null;
    let batchCount = 0;

    while (true) {
      const { escorts, lastDoc: newLastDoc } = await getEscortsBatch(collectionName, lastDoc);
      
      if (escorts.length === 0) {
        break;
      }

      batchCount++;
      if (maxBatches && batchCount > maxBatches) {
        break;
      }

      results.batches++;
      results.total += escorts.length;

      console.log(`Processing batch ${batchCount} with ${escorts.length} contacts...`);

      for (const escort of escorts) {
        const personalizedMessage = personalizeMessage(message, escort);
        const result = await sendWhatsAppMessage({
          to: escort.phone,
          text: personalizedMessage,
        });

        if (result.success) {
          results.sent++;
          console.log(`✓ Sent to ${escort.name} (${escort.phone})`);
        } else {
          results.failed++;
          results.errors.push(`${escort.name}: ${result.error}`);
          console.log(`✗ Failed for ${escort.name}: ${result.error}`);
        }

        // Delay between messages to avoid restrictions
        await delay(MESSAGE_DELAY_MS);
      }

      // Delay between batches
      if (escorts.length === BATCH_SIZE) {
        console.log(`Batch ${batchCount} complete. Waiting ${BATCH_DELAY_MS/1000}s before next batch...`);
        await delay(BATCH_DELAY_MS);
      }

      lastDoc = newLastDoc;
      if (!lastDoc) break;
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Bulk send error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
