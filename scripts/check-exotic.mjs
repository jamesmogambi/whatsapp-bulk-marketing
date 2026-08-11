import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

const suspiciousPatterns = [
  /agency/i,
  /agent/i,
  /pimp/i,
  /services/i,
  /escort jobs/i,
  /\bescorts$/i,
  /spa/i,
  /massage tower/i,
  /tower/i,
  /jobs/i,
  /service$/i,
];

async function check() {
  const q = collection(db, "exotic");
  const snapshot = await getDocs(q);
  console.log(`Total docs: ${snapshot.size}`);
  
  const suspicious = [];
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const name = data.name || "";
    if (suspiciousPatterns.some(p => p.test(name))) {
      suspicious.push({ id: docSnap.id, name });
    }
  }
  
  console.log(`Suspicious entries: ${suspicious.length}`);
  for (const s of suspicious) {
    console.log(s.id, s.name);
  }
}

check();
