// src/services/googleDrive.service.ts
import { google } from "googleapis";
import fs from "fs";

class GoogleDriveService {
  private drive: any;

  constructor() {
    this.initializeDrive();
  }

  private initializeDrive() {
    try {
      let privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
      if (privateKey) {
        privateKey = privateKey.replace(/^"|"$/g, "").replace(/\\n/g, "\n");
      }

      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
          private_key: privateKey,
        },
        scopes: ["https://www.googleapis.com/auth/drive"],
      });

      this.drive = google.drive({ version: "v3", auth });
    } catch (error) {
      console.error("Error initializing Google Drive:", error);
      throw new Error("Failed to initialize Google Drive service");
    }
  }

  // Upload file to Google Drive
  async uploadFile(file: any, folderId?: string): Promise<any> {
    try {
      const parentFolderId = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

      const fileMetadata: any = {
        name: file.originalname,
        parents: parentFolderId ? [parentFolderId] : ["root"], // 'root' is the root folder
      };

      const media = {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.path),
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: "id, name, webViewLink, webContentLink, size, mimeType",
        supportsAllDrives: true,
      });

      // Make the file publicly accessible (optional)
      await this.drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
        supportsAllDrives: true,
      });

      // Clean up temporary file
      fs.unlinkSync(file.path);

      return {
        fileId: response.data.id,
        fileName: response.data.name,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink,
        size: response.data.size,
        mimeType: response.data.mimeType,
      };
    } catch (error) {
      console.error("Error uploading to Google Drive:", error);
      throw new Error("Failed to upload file to Google Drive");
    }
  }

  // Create folder in Google Drive
  async createFolder(
    folderName: string,
    parentFolderId?: string,
  ): Promise<any> {
    try {
      const fileMetadata: any = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: parentFolderId ? [parentFolderId] : ["root"],
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: "id, name",
        supportsAllDrives: true,
      });

      return {
        folderId: response.data.id,
        folderName: response.data.name,
      };
    } catch (error) {
      console.error("Error creating folder in Google Drive:", error);
      throw new Error("Failed to create folder in Google Drive");
    }
  }

  // Get file by ID
  async getFile(fileId: string): Promise<any> {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: "id, name, webViewLink, webContentLink, size, mimeType",
        supportsAllDrives: true,
      });

      return response.data;
    } catch (error) {
      console.error("Error getting file from Google Drive:", error);
      throw new Error("Failed to get file from Google Drive");
    }
  }

  // Delete file from Google Drive
  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({
        fileId: fileId,
        supportsAllDrives: true,
      });
    } catch (error) {
      console.error("Error deleting file from Google Drive:", error);
      throw new Error("Failed to delete file from Google Drive");
    }
  }

  // List files in a folder
  async listFiles(folderId?: string): Promise<any[]> {
    try {
      const query = folderId ? `'${folderId}' in parents` : "'root' in parents";
      const response = await this.drive.files.list({
        q: query,
        fields: "files(id, name, webViewLink, mimeType, size, createdTime)",
        orderBy: "createdTime desc",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      return response.data.files;
    } catch (error) {
      console.error("Error listing files from Google Drive:", error);
      throw new Error("Failed to list files from Google Drive");
    }
  }
}

export const googleDriveService = new GoogleDriveService();
