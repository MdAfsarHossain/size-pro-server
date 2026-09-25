import { Role } from "@prisma/client";
import { Router } from "express";
import auth from "../../middlewares/auth";
import { DocumentControllers } from "./document.controller";
import parseBodyData from "../../middlewares/parseBodyData";
import { fileUploader } from "../../middlewares/multerFileUpload";

const route = Router();

// Create Document
route.post(
  "/",
  // auth(Role.ADMIN, Role.SUPERADMIN),
  auth(),
  fileUploader.documentImages,
  parseBodyData,
  DocumentControllers.createDocument,
);

// Upload Product To AI
route.post(
  "/upload-product-to-ai",
  // auth(Role.ADMIN, Role.SUPERADMIN),
  auth(),
  fileUploader.documentImages,
  parseBodyData,
  DocumentControllers.uploadProductToAI,
);

// Delete Product
route.delete(
  "/product/:id",
  auth(Role.ADMIN, Role.SUPERADMIN),
  DocumentControllers.deleteProduct,
);

// My All Documents
route.get(
  "/",
  auth(Role.ADMIN, Role.SUPERADMIN),
  DocumentControllers.myAllDocuments,
);

// Update Document
route.patch(
  "/:id",
  // auth(Role.ADMIN, Role.SUPERADMIN),
  auth(),
  DocumentControllers.updateDocument,
);

// Get Document
route.get(
  "/:id",
  auth(Role.ADMIN, Role.SUPERADMIN),
  DocumentControllers.getDocument,
);

// Delete Document
route.delete(
  "/:id",
  auth(Role.ADMIN, Role.SUPERADMIN),
  DocumentControllers.deleteDocument,
);

// Save to drive
route.post(
  "/save-to-drive/:id",
  fileUploader.driveImage,
  auth(Role.ADMIN, Role.SUPERADMIN),
  DocumentControllers.saveToDrive,
);

// Generate CSV
route.get(
  "/generate-csv/:id",
  // auth(Role.ADMIN, Role.SUPERADMIN),
  DocumentControllers.generateCSV,
);

// Get Product
route.get(
  "/product/:id",
  auth(Role.ADMIN, Role.SUPERADMIN),
  DocumentControllers.getProduct,
);

export const DocumentRouters = route;
