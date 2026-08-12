import { Router } from "express";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../middlewares/multerFileUpload";
import { ShopifyController } from "./shopify.controller";
import parseBodyData from "../../middlewares/parseBodyData";

const router = Router();

// Field name is "file" (memory storage) — same multer config the csv module
// uses, since we need the raw buffer to parse the CSV text in-process.
router.post(
  "/upload-csv",
  // auth(),
  fileUploader.testFile,
  parseBodyData,
  ShopifyController.uploadProductsCsv,
);

router.post(
  "/upload-multiple-csv",
  // auth(),
  fileUploader.testMultipleFiles,
  parseBodyData,
  ShopifyController.uploadMultipleProductsCsv,
);

// router.post('/success', ShopifyController.successfullyShopifyUpload) — superseded:
// isShopifyUploaded is now set automatically by createProductsFromCsv itself.

router.get("/upload-history", ShopifyController.getShopifyUploadHistory);
router.get("/upload-history/:id", ShopifyController.getShopifyUploadHistoryById);
router.get("/upload-history/document/:documentId", ShopifyController.getShopifyUploadHistoryByDocumentId);

export const ShopifyRoutes = router;
