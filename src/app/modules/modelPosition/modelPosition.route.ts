import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { ModelPositionController } from "./modelPosition.controller";

const router = Router();

router.post(
  "/",
  auth("ADMIN", "SUPERADMIN"),
  ModelPositionController.createModelPosition,
);

router.get("/", ModelPositionController.getModelPosition);

router.patch(
  "/:id",
  auth("ADMIN", "SUPERADMIN"),
  ModelPositionController.updateModelPosition,
);

router.delete(
  "/:id",
  auth("ADMIN", "SUPERADMIN"),
  ModelPositionController.deleteModelPosition,
);

export const ModelPositionRoutes = router;
