import { Router } from "express";
import { TimeZoneController } from "./timeZone.controller";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";

const router = Router();

router.get(
  "/time-zone-lists",
//   auth("ADMIN", ''),
  TimeZoneController.getTimeZoneList
);

router.get("/", TimeZoneController.getSettings);
router.patch("/", TimeZoneController.updateSettings);

export const TimeZoneRoutes = router;
