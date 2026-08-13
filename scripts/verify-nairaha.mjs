import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";

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

async function check() {
  const q = query(collection(db, "nai-raha"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  console.log(`Total nai-raha docs: ${snapshot.size}`);
  
  console.log("\nSample entries:");
  const sample = snapshot.docs.slice(0, 3);
  for (const docSnap of sample) {
    const data = docSnap.data();
    console.log("Name:", data.name);
    console.log("Phone:", data.phone);
    console.log("City:", data.city);
    console.log("Area:", data.area);
    console.log("Services:", data.services?.slice(0, 3));
    console.log("---");
  }
}

check();
