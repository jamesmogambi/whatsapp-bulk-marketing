import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

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

const malePatterns = [
  /call boys/i,
  /\bboys\b/i,
  /\bgay\b/i,
  /\bbottom\b/i,
  /\bkamau\b/i,
  /\bkelly\b/i,
  /\bkevin\b/i,
  /\bdairus\b/i,
  /\bmako\b/i,
  /\bzess\b/i,
];

async function cleanup() {
  const q = collection(db, "nai-raha");
  const snapshot = await getDocs(q);
  let deleted = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const name = data.name || "";
    const title = data.title || "";
    
    if (malePatterns.some(p => p.test(name) || p.test(title))) {
      console.log(`Deleting non-female: ${name}`);
      await deleteDoc(doc(db, "nai-raha", docSnap.id));
      deleted++;
    }
  }

  console.log(`Deleted ${deleted} non-female entries`);
}

cleanup();
