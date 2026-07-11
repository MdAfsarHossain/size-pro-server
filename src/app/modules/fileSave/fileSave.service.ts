import { google } from "googleapis";
import fs from "fs";
import { googleDriveService } from "./googleDrive.service";
// const { google } = require("googleapis");
// const stream = require("stream");
import stream from "stream";
import { CsvService } from "./csv.service";
import prisma from "../../lib/prisma";
import { getAuthClientForOauth } from "../../utils/googleAuth";
import { S3Uploader } from "../../lib/S3Uploader";
import { formatDateAndTime } from "../../utils/formatDate";

// Save to google drive
// const saveToDrive = async (userId: string, file: any) => {
//   if (!file) {
//     throw new Error("File not found");
//   }

//   try {
//     let privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
//     if (privateKey) {
//       privateKey = privateKey.replace(/^"|"$/g, "").replace(/\\n/g, "\n");
//     }

//     const auth = new google.auth.GoogleAuth({
//       credentials: {
//         client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
//         private_key: privateKey,
//       },
//       scopes: ["https://www.googleapis.com/auth/drive"],
//     });

//     const drive = google.drive({ version: "v3", auth });

//     const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

//     const uploadRes = await drive.files.create({
//       requestBody: {
//         name: file.originalname,
//         parents: parentFolderId ? [parentFolderId] : undefined,
//       },
//       media: {
//         mimeType: file.mimetype,
//         body: fs.createReadStream(file.path),
//       },
//       fields: "id, webViewLink",
//     });

//     // Make the uploaded file publicly readable
//     await drive.permissions.create({
//       fileId: uploadRes.data.id!,
//       requestBody: {
//         role: "reader",
//         type: "anyone",
//       },
//     });

//     // Clean up local saved file by multer if needed
//     if (file.path && fs.existsSync(file.path)) {
//       fs.unlinkSync(file.path);
//     }

//     return {
//       message: "File saved to Google Drive successfully",
//       driveFileId: uploadRes.data.id!,
//       driveFileLink: uploadRes.data.webViewLink!,
//     };
//   } catch (error: any) {
//     console.error("Error in saveToDrive:", error);

//     // Clean up local file even on error
//     if (file.path && fs.existsSync(file.path)) {
//       fs.unlinkSync(file.path);
//     }

//     throw new Error(`Failed to save to Drive: ${error.message}`);
//   }
// };

// Deepseek

// Save to google drive
const saveToDrive = async (userId: string, file: any, folderName?: string) => {
  try {
    // console.log("Received file:", file);

    if (!file) {
      throw new Error("No file provided");
    }

    // Optional: Create a user-specific folder
    let userFolderId;
    if (folderName) {
      const folder = await googleDriveService.createFolder(folderName);
      userFolderId = folder.folderId;
    }

    // Upload file to Google Drive
    const driveFile = await googleDriveService.uploadFile(file, userFolderId);

    // Save file metadata to database (optional)
    // const savedFile = await prisma.fileRecord.create({
    //   data: {
    //     userId: userId,
    //     fileId: driveFile.fileId,
    //     fileName: driveFile.fileName,
    //     fileSize: driveFile.size,
    //     mimeType: driveFile.mimeType,
    //     webViewLink: driveFile.webViewLink,
    //     webContentLink: driveFile.webContentLink,
    //     uploadedAt: new Date(),
    //   },
    // });

    return {
      ...driveFile,
      //   databaseRecord: savedFile,
    };
  } catch (error) {
    console.error("Error in saveToDrive service:", error);
    throw error;
  }
};

// ─── Build authenticated Google Drive client ────────────────────────────────
const getAuthClient = () => {
  const credentials = {
    type: "service_account",
    project_id: process.env.GOOGLE_DRIVE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_DRIVE_PRIVATE_KEY_ID,
    // The private key in .env uses literal \n — replace with real newlines
    private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_DRIVE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return auth;
};

// IT'S WORKS - V1
// // ─── Upload a file (Buffer) to Google Drive ─────────────────────────────────
// const uploadFileToDrive = async ({
//   fileName,
//   mimeType,
//   fileBuffer,
//   // folderId,
//   userId,
// }: {
//   fileName: string;
//   mimeType: string;
//   fileBuffer: Buffer;
//   // folderId?: string;
//   userId: string;
// }) => {
//   const auth = getAuthClient();
//   const drive = google.drive({ version: "v3", auth });

//   // Convert Buffer → readable stream
//   const bufferStream = new stream.PassThrough();
//   bufferStream.end(fileBuffer);

//   const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

//   // const fileMetadata = {
//   //   name: fileName,
//   //   ...(parentFolderId && { parents: [parentFolderId] }),
//   // };

//   // fileName = `documents_${userId}`;

//   // const media = {
//   //   mimeType,
//   //   body: bufferStream,
//   // };

//   // It's Works
//   // const response = await drive.files.create({
//   //   requestBody: fileMetadata,
//   //   media,
//   //   fields: "id, name, mimeType, webViewLink, createdTime, size",
//   // });

//   const response = await drive.files.create({
//     // requestBody: fileMetadata,
//     requestBody: {
//       name: fileName,
//       mimeType,
//       parents: parentFolderId ? [parentFolderId] : undefined,
//     },
//     media: {
//       mimeType,
//       body: bufferStream,
//     },
//     fields: "id, name, mimeType, webViewLink, createdTime, size",
//   });

//   return response.data;
// };

// IT'S WORKS FINE Create folder for each document - V2
// ─── Upload a file (Buffer) to Google Drive ─────────────────────────────────
// const uploadFileToDrive = async ({
//   fileName,
//   mimeType,
//   fileBuffer,
//   userId,
// }: {
//   fileName: string;
//   mimeType: string;
//   fileBuffer: Buffer;
//   userId: string;
// }) => {
//   const auth = getAuthClient();
//   const drive = google.drive({ version: "v3", auth });

//   // Convert Buffer → readable stream
//   const bufferStream = new stream.PassThrough();
//   bufferStream.end(fileBuffer);

//   const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

//   // --- 3. Create a folder for this document in Drive ---
//   const folderName = `Document_${userId}`;

//   const folderRes = await drive.files.create({
//     requestBody: {
//       name: folderName,
//       mimeType: "application/vnd.google-apps.folder",
//       parents: parentFolderId ? [parentFolderId] : undefined,
//     },
//     fields: "id, webViewLink",
//   });

//   const folderId = folderRes.data.id!;
//   const folderLink = folderRes.data.webViewLink!;

//   console.log(folderLink);

//   // Make the folder publicly readable
//   await drive.permissions.create({
//     fileId: folderId,
//     requestBody: {
//       role: "reader",
//       type: "anyone",
//     },
//   });

//   const response = await drive.files.create({
//     requestBody: {
//       name: fileName,
//       mimeType,
//       parents: [folderId],
//     },
//     media: {
//       mimeType,
//       body: bufferStream,
//     },
//     fields: "id, name, mimeType, webViewLink, createdTime, size",
//   });

//   // Make the uploaded CSV file publicly readable
//   await drive.permissions.create({
//     fileId: response.data.id!,
//     requestBody: {
//       role: "reader",
//       type: "anyone",
//     },
//   });

//   return response.data;
// };

// V3
// ─── Upload a file (Buffer) to Google Drive ─────────────────────────────────
const uploadFileToDrive = async ({
  fileName,
  mimeType,
  fileBuffer,
  userId,
}: {
  fileName: string;
  mimeType: string;
  fileBuffer: Buffer;
  userId: string;
}) => {
  // const auth = getAuthClient();
  // It's comes for oauth
  const auth = getAuthClientForOauth();

  const drive = google.drive({ version: "v3", auth });

  // Convert Buffer → readable stream
  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileBuffer);

  const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  // --- 3. Create a folder for this document in Drive ---
  const folderName = `Document_${userId}`;

  const folderRes = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentFolderId ? [parentFolderId] : undefined,
    },
    fields: "id, webViewLink",
  });

  const folderId = folderRes.data.id!;
  const folderLink = folderRes.data.webViewLink!;

  // console.log(folderLink);

  // Make the folder publicly readable
  await drive.permissions.create({
    fileId: folderId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: bufferStream,
    },
    fields: "id, name, mimeType, webViewLink, createdTime, size",
  });

  // Make the uploaded CSV file publicly readable
  await drive.permissions.create({
    fileId: response.data.id!,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return response.data;
};

// ─── Convert JSON → CSV and upload to Google Drive ─────────────────────────
// const convertAndUploadCSV = async (req, res) => {
//   try {
//     const { data, fileName, folderId } = req.body;

//     if (!data || !Array.isArray(data) || data.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Request body must contain a non-empty "data" array.',
//       });
//     }

//     // 1. Convert JSON array → CSV buffer
//     const csvBuffer = await csvService.convertToCSV(data);

//     // 2. Upload the CSV buffer to Google Drive
//     const csvFileName = fileName || `export_${Date.now()}.csv`;
//     const targetFolderId =
//       folderId || process.env.GOOGLE_DRIVE_FOLDER_ID || null;

//     const result = await driveService.uploadFileToDrive({
//       fileName: csvFileName,
//       mimeType: "text/csv",
//       fileBuffer: csvBuffer,
//       folderId: targetFolderId,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "CSV created and uploaded to Google Drive successfully.",
//       data: result,
//     });
//   } catch (error) {
//     console.error("[convertAndUploadCSV] Error:", error.message);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// ─── Convert JSON → CSV and upload to Google Drive ─────────────────────────
const convertAndUploadCSV = async (
  data: any,
  fileName: string,
  folderId: string,
  documentId: string,
) => {
  try {
    // if (!data || !Array.isArray(data) || data.length === 0) {
    //   throw new Error('Request body must contain a non-empty "data" array.');
    // }

    const isDocumentExist = await prisma.generatedImage.findUnique({
      where: {
        id: documentId,
      },
    });

    if (!isDocumentExist) {
      throw new Error("Document not found");
    }

    // console.log(isDocumentExist);

    // Prepare data for CSV by wrapping the document object in an array
    // Stringify the nested `imageDetails` (and other objects if any) to avoid "[object Object]" in the CSV
    const csvData = [
      {
        ...isDocumentExist,
        imageDetails:
          typeof isDocumentExist.imageDetails === "object" &&
          isDocumentExist.imageDetails !== null
            ? JSON.stringify(isDocumentExist.imageDetails)
            : isDocumentExist.imageDetails,
      },
    ];

    // 1. Convert JSON array → CSV buffer
    const csvBuffer = await CsvService.convertToCSV(csvData);

    // 2. Upload the CSV buffer to Google Drive
    const csvFileName = fileName || `export_${Date.now()}.csv`;
    const targetFolderId =
      folderId || process.env.GOOGLE_DRIVE_FOLDER_ID || null;

    // const result = await uploadFileToDrive({
    //   fileName: csvFileName,
    //   mimeType: "text/csv",
    //   fileBuffer: csvBuffer,
    //   // folderId: targetFolderId,
    //   userId: isDocumentExist.userId,
    // });

    const formatedCsv = csvBuffer.toString("utf-8");
    // console.log(formatedCsv);

    const csvFile = Buffer.from(formatedCsv, "utf-8");
    // console.log(csvFile);

    return {
      success: true,
      message: "CSV created and uploaded to Google Drive successfully.",
      // data: result,
      data: { formatedCsv, csvFile },
    };
  } catch (error: any) {
    console.error("[convertAndUploadCSV] Error:", error.message);
    throw error;
  }
};

// CSV Save to the S3 Bucket
const saveCSVToS3 = async (userId: string, title: string, file: any) => {
  let fileUrl = "";

  try {
    const upload = await S3Uploader.uploadToS3(file, userId);
    fileUrl = upload.Location;
  } catch (error: any) {
    console.error("[saveCSVToS3] Error:", error.message);
    throw error;
  }

  const result = await prisma.savedFile.create({
    data: {
      userId,
      title,
      fileUrl,
    },
  });

  return result;
};

// My All Saved Files
const getAllSavedFiles = async (
  userId: string,
  pagination: { page: number; limit: number },
) => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const whereCondition = {
    userId,
  };

  const result = await prisma.savedFile.findMany({
    where: whereCondition,
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: limit,
  });

  const total = await prisma.savedFile.count({
    where: whereCondition,
  });

  // Fetch app-level timezone set by admin
  const appSetting = await prisma.appSetting.findFirst();
  const appTimezone = appSetting?.timezone ?? "UTC";

  const finalResult = result.map((item) => {
    return {
      ...item,
      // fileUrl: S3Uploader.getPresignedUrl(item.fileUrl),
      savedAt: formatDateAndTime(item.createdAt, appTimezone),
    };
  });

  return {
    data: finalResult,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
      hasNextPage: total > page * limit,
      hasPrevPage: page > 1,
    },
  };
};

export const FileSaveServices = {
  saveToDrive,
  uploadFileToDrive,
  convertAndUploadCSV,
  saveCSVToS3,
  getAllSavedFiles,
};
