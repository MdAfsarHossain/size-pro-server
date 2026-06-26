import express from "express";
import { AuthRouters } from "../modules/auth/auth.routes";
import { AdminRouters } from "../modules/admin/admin.route";
import { UsersRoutes } from "../modules/users/users.route";
import { DocumentRouters } from "../modules/document/document.route";
import { FileSaveRouters } from "../modules/fileSave/fileSave.route";

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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
