import { Router } from "express";
import { CsvController } from "./csv.controller";
import { fileUploader } from "../../middlewares/multerFileUpload";

const router = Router();

router.post(
  "/upload",
  fileUploader.testFile,
  CsvController.uploadCsv
);

export const CsvRoutes = router;
