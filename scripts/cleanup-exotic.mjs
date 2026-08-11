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

const agencyPatterns = [
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

async function cleanup() {
  const q = collection(db, "exotic");
  const snapshot = await getDocs(q);
  let deleted = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const name = data.name || "";
    if (agencyPatterns.some((p) => p.test(name))) {
      console.log(`Deleting agency: ${name}`);
      await deleteDoc(doc(db, "exotic", docSnap.id));
      deleted++;
    }
  }

  console.log(`Deleted ${deleted} agencies`);
}

cleanup();
