import { Router } from "express";
import { fileUploader } from "../../middlewares/multerFileUpload";
import { FileSaveControllers } from "./fileSave.controller";
import auth from "../../middlewares/auth";
import parseBodyData from "../../middlewares/parseBodyData";

const route = Router();

route.post(
  "/save-to-drive",
  fileUploader.driveImage,
  auth(),
  FileSaveControllers.saveToDrive,
);

route.post(
  "/convert-and-upload-csv/:id",
  FileSaveControllers.convertAndUploadCSV,
);

route.post(
  "/save-csv-to-s3",
  fileUploader.csvFile,
  parseBodyData,
  auth(),
  FileSaveControllers.saveCSVToS3,
);

route.get("/my-saved-files", auth(), FileSaveControllers.getAllSavedFiles);

export const FileSaveRouters = route;
