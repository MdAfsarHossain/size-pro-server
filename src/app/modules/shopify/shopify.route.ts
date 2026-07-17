import { Router } from "express";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../middlewares/multerFileUpload";
import { ShopifyController } from "./shopify.controller";

const router = Router();

// Field name is "file" (memory storage) — same multer config the csv module
// uses, since we need the raw buffer to parse the CSV text in-process.
router.post(
  "/upload-csv",
  auth(),
  fileUploader.testFile,
  ShopifyController.uploadProductsCsv,
);

export const ShopifyRoutes = router;
