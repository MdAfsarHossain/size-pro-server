// import httpStatus from "http-status";
// import { NextFunction, Request, Response } from "express";
// import prisma from "../lib/prisma";
// import { PlanType, Role } from "@prisma/client";
// // import prisma from "../config/prisma";
// // import { ProfilePlanType, UserRole } from "@prisma/client";

// export const checkThreeDaysFreeTrial = async (
//   req: Request & { user?: any },
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = req.user?.userId;

//     if (!userId) {
//       return res.status(httpStatus.UNAUTHORIZED).json({
//         success: false,
//         message: "User not authenticated",
//       });
//     }

//     // Get user from database
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: {
//         id: true,
//         name: true,
//         planType: true,
//         freeTrialStart: true,
//         role: true,
//       },
//     });

//     // console.log(user);

//     if (!user) {
//       return res.status(httpStatus.NOT_FOUND).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // Skip check for admin users
//     const isAdmin =
//       user.role === Role.ADMIN ||
//       user.role === Role.SUPERADMIN ||
//       user.role === Role.PARENTS ||
//       user.role === Role.JOURNALIST ||
//       user.role === Role.COACH ||
//       user.role === Role.SCOUT ||
//       user.role === Role.GENERAL_USER ||
//       user.role === Role.PLAYER;
//     if (isAdmin) {
//       return next();
//     }

//     const now = new Date();
//     const trialStart = new Date(user.freeTrialStart);
//     const trialEnd = new Date(trialStart);
//     trialEnd.setDate(trialStart.getDate() + 3);

//     if (user.planType === PlanType.FREE && now > trialEnd) {
//       return res.status(httpStatus.PERMANENT_REDIRECT).json({
//         success: false,
//         message: "Please update your subscriptions plan",
//         data: {
//           type: "profileSubscriptionPage",
//         },
//       });
//     }

//     next();
//   } catch (error) {
//     next(error);
//   }
// };
