import { Router } from "express";
import auth from "../../middlewares/auth";
import { Role } from "@prisma/client";
import { FeatureController } from "./feature.controller";

const route = Router();

route.post("", auth(Role.SUPERADMIN), FeatureController.createFeature);
route.get(
  "",
  auth(Role.ADMIN, Role.SUPERADMIN),
  FeatureController.getLastFeature,
);
route.patch(
  "/:id",
  auth(Role.ADMIN, Role.SUPERADMIN),
  FeatureController.updateFeature,
);

export const FeatureRoute = route;
