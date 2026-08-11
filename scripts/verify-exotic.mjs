import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "firebase/firestore";

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
  const q = query(collection(db, "exotic"), orderBy("createdAt", "desc"), limit(5));
  const snapshot = await getDocs(q);
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    console.log("ID:", docSnap.id);
    console.log("Name:", data.name);
    console.log("Phone:", data.phone);
    console.log("City:", data.city);
    console.log("County:", data.county);
    console.log("Services:", data.services?.slice(0, 5));
    console.log("---");
  }
}

check();
