import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query } from "firebase/firestore";
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

function extractListings(html) {
  const $ = cheerio.load(html);
  const listings = [];

  $("a[href^='each-escort/']").each((_, el) => {
    const $el = $(el);
    const href = $el.attr("href");
    if (!href) return;

    const name = $el.find(".escinfo1 .titles").text().trim();
    const locationP = $el.find(".escinfo1 p").text().trim();
    const phone = $el.find("a[href^='tel:']").attr("href")?.replace("tel:", "").trim();

    if (name && href) {
      listings.push({
        name,
        phone: phone || "",
        location: locationP,
        url: `https://nai-raha.com/${href.replace(/^\/+/, "")}`,
        source: "nai-raha",
      });
    }
  });

  return listings;
}

async function getProfileDetails(url) {
  try {
    const html = await fetch(url);
    const $ = cheerio.load(html);

    const name = $("h1.titles").first().text().trim();
    const phone = $("a[href^='tel:']").first().attr("href")?.replace("tel:", "").trim();
    
    const locationParts = [];
    $(".escinfo1 p .pnk").each((_, el) => {
      locationParts.push($(el).text().trim());
    });
    
    const services = [];
    $(".accordion-body p").each((_, el) => {
      const text = $(el).text().trim();
      if (text) {
        text.split(",").forEach((s) => {
          const trimmed = s.trim();
          if (trimmed) services.push(trimmed);
        });
      }
    });

    const city = locationParts[0] || "";
    const area = locationParts[1] || "";
    
    return { name, phone, city, area, services };
  } catch (e) {
    console.error(`Failed to fetch profile ${url}:`, e.message);
    return null;
  }
}

function isAgency(name) {
  const lower = name.toLowerCase();
  return /agency|agent|pimp|service|escorts$|jobs|spa|tower/i.test(lower);
}

async function getExistingUrls() {
  const q = query(collection(db, "nai-raha"));
  const snapshot = await getDocs(q);
  const urls = new Set();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.url) urls.add(data.url);
  }
  return urls;
}

async function scrapeAll() {
  const baseUrl = "https://nai-raha.com/all-escort-girls";
  const allListings = [];

  console.log("Scraping listings...");
  
  for (let page = 1; page <= 6; page++) {
    const url = page === 1 ? baseUrl : `${baseUrl}?page=${page}&seed=810203`;
    console.log(`Scraping page ${page}...`);
    const html = await fetch(url);
    const listings = extractListings(html);
    allListings.push(...listings);
    console.log(`Found ${listings.length} listings on page ${page}`);
  }

  console.log(`Total listings found: ${allListings.length}`);

  const filtered = allListings.filter((l) => !isAgency(l.name));
  console.log(`After filtering agencies: ${filtered.length}`);

  console.log("Checking existing records...");
  const existingUrls = await getExistingUrls();
  console.log(`Already saved: ${existingUrls.size}`);

  const toScrape = filtered.filter((l) => !existingUrls.has(l.url));
  console.log(`Need to scrape: ${toScrape.length}`);

  if (toScrape.length === 0) {
    console.log("All done!");
    return;
  }

  console.log("Fetching profile details...");
  const batchSize = 5;
  
  for (let i = 0; i < toScrape.length; i += batchSize) {
    const batch = toScrape.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (listing) => {
        const details = await getProfileDetails(listing.url);
        return details ? { ...listing, ...details } : null;
      })
    );
    
    const valid = results.filter(Boolean);
  for (const escort of valid) {
    const { area, ...rest } = escort;
    const cleanData = Object.fromEntries(
      Object.entries({ ...rest, area: area || "", services: escort.services || [] })
        .filter(([_, v]) => v !== undefined)
    );
    cleanData.createdAt = serverTimestamp();
    await addDoc(collection(db, "nai-raha"), cleanData);
    console.log(`Saved ${escort.name}`);
  }
    
    console.log(`Progress: ${Math.min(i + batchSize, toScrape.length)}/${toScrape.length}`);
  }

  console.log("Done!");
}

scrapeAll().catch((e) => {
  console.error("Scrape failed:", e);
  process.exit(1);
});
