// utils/googleAuth.ts
import { google } from "googleapis";

export const getAuthClientForOauth = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:5555/api/v1/auth/google/callback",
  );

  // ✅ Use stored refresh token — auto-refreshes access token
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return oauth2Client;
};
