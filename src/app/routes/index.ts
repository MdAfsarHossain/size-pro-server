import express from "express";
import { AuthRouters } from "../modules/auth/auth.routes";
import { AdminRouters } from "../modules/admin/admin.route";
import { UsersRoutes } from "../modules/users/users.route";
import { DocumentRouters } from "../modules/document/document.route";
import { FileSaveRouters } from "../modules/fileSave/fileSave.route";
import { FeatureRoute } from "../modules/feature/feature.route";
import { CsvRoutes } from "../modules/csv/csv.route";
import { TimeZoneRoutes } from "../modules/timeZone/timeZone.route";
import { ModelPositionRoutes } from "../modules/modelPosition/modelPosition.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRouters,
  },
  {
    path: "/admin",
    route: AdminRouters,
  },
  {
    path: "/users",
    route: UsersRoutes,
  },
  {
    path: "/documents",
    route: DocumentRouters,
  },
  {
    path: "/file-save",
    route: FileSaveRouters,
  },
  {
    path: "/feature",
    route: FeatureRoute,
  },
  {
    path: "/csv",
    route: CsvRoutes
  },
  {
    path: '/time-zone',
    route: TimeZoneRoutes
  },
  {
    path: '/model-position',
    route: ModelPositionRoutes
  }
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
