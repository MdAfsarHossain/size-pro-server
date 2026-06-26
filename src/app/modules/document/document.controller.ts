import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import httpStatus from "http-status";
import { DocumentServices } from "./document.service";
import sendResponse from "../../helpers/sendResponse";
import { S3Uploader } from "../../lib/S3Uploader";
import { FileSaveServices } from "../fileSave/fileSave.service";

// Create Document
const createDocument = catchAsync(async (req: Request, res: Response) => {
  //   const { id } = req.params;
  const { id: userId } = req.user;
  const files = req.files;
  const payload = req.body;

  const result = await DocumentServices.createDocument(userId, payload, files);

  // if (result?.status === 422) {
  //   sendResponse(res, {
  //     success: false,
  //     statusCode: httpStatus.BAD_REQUEST,
  //     message: result?.message,
  //     data: result,
  //   });
  // } else {
  //   sendResponse(res, {
  //     success: true,
  //     statusCode: httpStatus.OK,
  //     message: "Document created successfully",
  //     data: result,
  //   });
  // }

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Document created successfully",
    data: result,
  });
});

// My All Documents
const myAllDocuments = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user;
  const { page, limit, sortBy, sortOrder, search } = req.query;

  const result = await DocumentServices.myAllDocuments(userId, {
    page,
    limit,
    sortBy,
    sortOrder,
    search,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Documents retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

// Get Document
const getDocument = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await DocumentServices.getDocument(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Document retrieved successfully",
    data: result,
  });
});

// Update Document
const updateDocument = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user;
  const { id } = req.params;
  const payload = req.body;

  const result = await DocumentServices.updateDocument(id, payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Document updated successfully",
    data: result,
  });
});

// Delete Document
const deleteDocument = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user;
  const { id } = req.params;

  const result = await DocumentServices.deleteDocument(userId, id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Document deleted successfully",
    data: result,
  });
});

// Save to drive
const saveToDrive = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user;
  const { id } = req.params;
  const file = req.file;
  // const result = await DocumentServices.saveToDrive(userId, id);
  // const result = await DocumentServices.saveToDrive(userId, id, file);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Document saved successfully",
    data: "result",
  });
});

// Generate CSV
const generateCSV = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const csvString = await DocumentServices.generateCSV(id);

  res.setHeader("Content-Type", "text/csv");
  res.attachment(`document_${id}.csv`);

  // It's works properly
  const csvBuffer = Buffer.from(csvString as string);
  // const upload = await S3Uploader.uploadBufferToS3(
  //   csvBuffer,
  //   `document_${id}.csv`,
  //   "text/csv",
  //   "csv",
  // );

  const uploadToDrive = await FileSaveServices.uploadFileToDrive({
    fileName: "asd",
    mimeType: "text/csv",
    fileBuffer: csvBuffer,
    userId: "csv",
  });

  // return res.status(200).send(csvBuffer);
});

export const DocumentControllers = {
  createDocument,
  myAllDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  saveToDrive,
  generateCSV,
};
