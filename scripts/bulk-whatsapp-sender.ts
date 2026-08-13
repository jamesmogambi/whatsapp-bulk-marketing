import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, query, limit, startAfter, DocumentSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
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

function parseArgs(): { message: string; collection?: string; maxBatches?: number; dryRun?: boolean } {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const value = args[i + 1];
      if (value && !value.startsWith("--")) {
        params[key] = value;
        i++;
      }
    }
  }
  
  if (!params.message) {
    console.error("Usage: npx tsx scripts/bulk-whatsapp-sender.ts --message \"Your message here\" [--collection nai-raha] [--maxBatches 5] [--dryRun]");
    console.error("\nPlaceholders: {{name}}, {{city}}, {{area}}, {{phone}}");
    process.exit(1);
  }
  
  return {
    message: params.message,
    collection: params.collection || "nai-raha",
    maxBatches: params.maxBatches ? parseInt(params.maxBatches, 10) : undefined,
    dryRun: params.dryRun === "true",
  };
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

async function logResult(escortId: string, phone: string, success: boolean, error?: string, msgId?: number) {
  await addDoc(collection(db, "whatsapp-logs"), {
    escortId,
    phone,
    success,
    error,
    msgId,
    sentAt: serverTimestamp(),
  });
}

async function runBulkSender() {
  const { message, collection, maxBatches, dryRun } = parseArgs();
  
  console.log("=".repeat(60));
  console.log("WhatsApp Bulk Sender");
  console.log("=".repeat(60));
  console.log(`Collection:         ${collection}`);
  console.log(`Message template: ${message.substring(0, 100)}${message.length > 100 ? "..." : ""}`);
  console.log(`Max batches: ${maxBatches || "All"}`);
  console.log(`Dry run: ${dryRun ? "Yes" : "No"}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Message delay: ${MESSAGE_DELAY_MS/1000}s`);
  console.log(`Batch delay: ${BATCH_DELAY_MS/1000}s`);
  console.log("=".repeat(60));

  const results = {
    total: 0,
    sent: 0,
    failed: 0,
    batches: 0,
    startTime: new Date(),
    errors: [] as string[],
  };

  let lastDoc: DocumentSnapshot | null = null;
  let batchCount = 0;

  while (true) {
    const { escorts, lastDoc: newLastDoc } = await getEscortsBatch(collection, lastDoc);
    
    if (escorts.length === 0) {
      break;
    }

    batchCount++;
    if (maxBatches && batchCount > maxBatches) {
      console.log(`\nReached max batches limit: ${maxBatches}`);
      break;
    }

    results.batches++;
    results.total += escorts.length;

    console.log(`\n--- Batch ${batchCount}: ${escorts.length} contacts ---`);

    for (const escort of escorts) {
      const personalizedMessage = personalizeMessage(message, escort);
      
      if (dryRun) {
        console.log(`[DRY RUN] Would send to ${escort.name} (${escort.phone})`);
        console.log(`  Message: ${personalizedMessage.substring(0, 80)}...`);
        results.sent++;
        await delay(MESSAGE_DELAY_MS);
        continue;
      }

      const result = await sendWhatsAppMessage({
        to: escort.phone,
        text: personalizedMessage,
      });

      await logResult(escort.id, escort.phone, result.success, result.error, result.msgId);

      if (result.success) {
        results.sent++;
        console.log(`✓ ${escort.name} (${escort.phone})`);
      } else {
        results.failed++;
        results.errors.push(`${escort.name}: ${result.error}`);
        console.log(`✗ ${escort.name} (${escort.phone}): ${result.error}`);
      }

      // Delay between messages to avoid restrictions
      await delay(MESSAGE_DELAY_MS);
    }

    // Delay between batches
    if (escorts.length === BATCH_SIZE) {
      console.log(`\nBatch ${batchCount} complete. Waiting ${BATCH_DELAY_MS/1000}s...`);
      await delay(BATCH_DELAY_MS);
    }

    lastDoc = newLastDoc;
    if (!lastDoc) break;
  }

  const duration = ((Date.now() - results.startTime.getTime()) / 1000 / 60).toFixed(1);
  
  console.log("\n" + "=".repeat(60));
  console.log("BULK SEND COMPLETE");
  console.log("=".repeat(60));
  console.log(`Total contacts:     ${results.total}`);
  console.log(`Sent successfully:  ${results.sent}`);
  console.log(`Failed:             ${results.failed}`);
  console.log(`Batches processed:  ${results.batches}`);
  console.log(`Duration:           ${duration} minutes`);
  
  if (results.errors.length > 0) {
    console.log(`\nErrors (${results.errors.length}):`);
    results.errors.forEach((err, i) => {
      if (i < 10) console.log(`  - ${err}`);
    });
    if (results.errors.length > 10) {
      console.log(`  ... and ${results.errors.length - 10} more`);
    }
  }
  
  console.log("=".repeat(60));

  if (results.failed > 0) {
    process.exit(1);
  }
}

runBulkSender().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
