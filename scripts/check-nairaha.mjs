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
  
  if (snapshot.size > 0) {
    const last = snapshot.docs[0].data();
    console.log("Last saved:", last.name);
  }
}

check();
