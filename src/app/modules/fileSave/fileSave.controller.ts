import { Request, Response } from "express";
import { FileSaveServices } from "./fileSave.service";
import sendResponse from "../../helpers/sendResponse";
// import sendResponse from "../../../shared/sendResponse";

// Save to google drive
const saveToDrive = async (req: Request, res: Response) => {
  // const { userId } = req.params;
  const userId = req.user.id;
  // const file = req.file;

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // ✅ Guard: catch missing buffer (happens with diskStorage)
  if (!req.file.buffer || req.file.buffer.length === 0) {
    return res.status(400).json({
      message: "File buffer is empty. Ensure multer memoryStorage is used.",
    });
  }

  const { originalname, mimetype, buffer } = req.file!;
  const folderId =
    req.body.folderId || process.env.GOOGLE_DRIVE_FOLDER_ID || null;

  // const result = await FileSaveServices.saveToDrive(userId, file);
  // console.log(req.file);

  const result = await FileSaveServices.uploadFileToDrive({
    fileName: originalname,
    mimeType: mimetype,
    fileBuffer: buffer,
    // folderId,
    userId,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "File saved to drive successfully",
    data: result,
  });
};

const convertAndUploadCSV = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, fileName, folderId } = req.body;

  const result = await FileSaveServices.convertAndUploadCSV(
    data,
    fileName,
    folderId,
    id,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "CSV created and uploaded to drive successfully",
    data: result,
  });
};

// Save CSV to S3
const saveCSVToS3 = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const file = req.file;
  const { title } = req.body;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const result = await FileSaveServices.saveCSVToS3(userId, title, file);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "CSV saved to S3 successfully",
    data: result,
  });
};

// My All Saved Files
const getAllSavedFiles = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { page, limit } = req.query;

  const pagination = {
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
  };

  const result = await FileSaveServices.getAllSavedFiles(userId, pagination);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All saved files fetched successfully",
    data: result.data,
    meta: result.meta,
  });
};

export const FileSaveControllers = {
  saveToDrive,
  convertAndUploadCSV,
  saveCSVToS3,
  getAllSavedFiles,
};
