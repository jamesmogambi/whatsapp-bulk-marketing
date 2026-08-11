import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import * as cheerio from "cheerio";
import https from "https";

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

function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

function extractEscorts(html) {
  const $ = cheerio.load(html);
  const escorts = [];

  $(".girl.escort-card").each((_, el) => {
    const $el = $(el);
    const name = $el.find(".girl-name").text().trim();
    const locationText = $el.find(".girl-desc-location__text").text().trim();
    const phone = $el.find("a[href^='tel:'] .contact-btn__label").text().trim();
    const url = $el.find(".escort-card__media").attr("href") || $el.find(".escort-card__primary-link").attr("href");

    if (name && url) {
      const [city, county] = locationText.split(",").map((s) => s.trim());
      escorts.push({
        name,
        phone,
        city: city || "",
        county: county || "",
        location: locationText,
        url: url.trim(),
        source: "exotickenya",
      });
    }
  });

  return escorts;
}

async function getServices(url) {
  try {
    const html = await fetch(url);
    const $ = cheerio.load(html);
    const services = [];
    $(".profile-service-chip__label").each((_, el) => {
      services.push($(el).text().trim());
    });
    return services;
  } catch (e) {
    console.error(`Failed to fetch services for ${url}:`, e.message);
    return [];
  }
}

function isAgency(name) {
  const lower = name.toLowerCase();
  return /agency|agent|pimp|services/.test(lower);
}

async function scrapeAll() {
  const allEscorts = [];
  const baseUrl = "https://www.exotickenya.com/female-escorts";

  console.log("Scraping listings...");
  const baseHtml = await fetch(baseUrl);
  allEscorts.push(...extractEscorts(baseHtml));

  for (let page = 2; page <= 10; page++) {
    console.log(`Scraping page ${page}...`);
    const html = await fetch(`${baseUrl}/page/${page}/`);
    allEscorts.push(...extractEscorts(html));
  }

  console.log(`Total listings found: ${allEscorts.length}`);

  const filtered = allEscorts.filter((e) => !isAgency(e.name));
  console.log(`After filtering agencies: ${filtered.length}`);

  console.log("Fetching services...");
  const withServices = [];
  const batchSize = 10;
  for (let i = 0; i < filtered.length; i += batchSize) {
    const batch = filtered.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (escort) => {
        const services = await getServices(escort.url);
        return { ...escort, services };
      })
    );
    withServices.push(...results);
    console.log(`Progress: ${Math.min(i + batchSize, filtered.length)}/${filtered.length}`);
  }

  console.log("Saving to Firestore...");
  for (const escort of withServices) {
    await addDoc(collection(db, "exotic"), {
      ...escort,
      createdAt: serverTimestamp(),
    });
    console.log(`Saved ${escort.name}`);
  }

  console.log("Done!");
}

scrapeAll().catch((e) => {
  console.error("Scrape failed:", e);
  process.exit(1);
});
