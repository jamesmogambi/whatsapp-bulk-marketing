const https = require("https");
const { HttpProxyAgent } = require("http-proxy-agent");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env.development");
const envContent = fs.readFileSync(envPath, "utf-8");
envContent.split("\n").forEach((line) => {
  const [key, value] = line.split("=");
  if (key && value) process.env[key.trim()] = value.trim();
});

const username = process.env.BRIGHT_DATA_USERNAME;
const password = process.env.BRIGHT_DATA_PASSWORD;

const proxyUrl = `http://${username}:${password}@brd.superproxy.io:33335`;
const agent = new HttpProxyAgent(proxyUrl);

https
  .get("https://httpbin.org/get", { agent }, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      console.log("Status:", res.statusCode);
      console.log("Body:", data.substring(0, 500));
    });
  })
  .on("error", (e) => console.error("Error:", e.message));
