// scripts/getGoogleToken.ts
import { google } from "googleapis";
import * as readline from "readline";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  // "",
  // "",
  "http://localhost:5555/api/v1/auth/google/callback",
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/drive"],
  prompt: "consent", // ✅ forces refresh_token to be returned
});

console.log("Visit this URL:", authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
rl.question("Paste the code from the URL here: ", async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  console.log("✅ Your tokens:", tokens);
  // Copy refresh_token to your .env
  rl.close();
});
