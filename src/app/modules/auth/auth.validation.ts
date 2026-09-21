import { Gender, Role, UserAccessType } from "@prisma/client";
import z from "zod";

// ======================================
// REGEX PATTERNS
// ======================================
const phoneRegex =
  /^[+]*[0-9]{1,4}[ -]?[0-9]{1,4}[ -]?[0-9]{1,4}[ -]?[0-9]{1,4}$/;

// ======================================
// VALIDATION SCHEMAS
// ======================================

// Registration Schema
const registerUser = z.object({
  body: z.object({
    firstName: z.string({
      required_error: "First Name is required!",
    }),
    lastName: z.string({
      required_error: "Last Name is required!",
    }),
    email: z
      .string({
        required_error: "Email is required!",
      })
      .email({
        message: "Invalid email format!",
      }),
    password: z
      .string({
        required_error: "Password is required!",
      })
      .min(8, "Password should be at least 8 characters"),
    gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER], {
      errorMap: () => {
        return {
          message: `Gender should be either ${Gender.MALE} or ${Gender.FEMALE} or ${Gender.OTHER}`,
        };
      },
    }),
    is_dimensions: z.boolean().optional(),
    is_ai_virtual: z.boolean().optional(),
    is_mannequin: z.boolean().optional(),
    is_background_removal: z.boolean().optional(),
    is_model: z.boolean().optional(),
    is_image_diagram: z.boolean().optional(),
    type: z
      .enum(
        [
          UserAccessType.TOP,
          UserAccessType.BOTTOM,
          UserAccessType.FULL_BODY,
          UserAccessType.HEAD,
          UserAccessType.SHOES,
        ],
        {
          errorMap: () => {
            return {
              message: `Type should be either ${UserAccessType.TOP} or ${UserAccessType.BOTTOM} or ${UserAccessType.FULL_BODY} or ${UserAccessType.HEAD} or ${UserAccessType.SHOES}`,
            };
          },
        },
      )
      .optional(),
    is_full_access: z.boolean().optional(),
    role: z.enum([Role.ADMIN, Role.USER], {
      errorMap: () => {
        return {
          message: `Role should be either ${Role.ADMIN} or ${Role.USER}`,
        };
      },
    }),
    fcmToken: z.string().optional(),
  }),
});

// OTP Verification Schema
const verifyOtp = z.object({
  body: z.object({
    userId: z.string({
      required_error: "userId is required!",
    }),
    otpCode: z
      .string({
        required_error: "otpCode is required!",
      })
      .length(6, "otpCode must be 6 digit"),
  }),
});

// Login Schema
const loginUser = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required!",
      })
      .email({
        message: "Invalid email format!",
      }),
    password: z.string({
      required_error: "Password is required!",
    }),
    fcmToken: z.string().optional(),
  }),
});

// Forgot Password Schema
const forgotPassword = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required!",
      })
      .email({
        message: "Invalid email format!",
      }),
  }),
});

// Reset Password Schema
const resetPassword = z.object({
  body: z.object({
    newPassword: z
      .string({
        required_error: "Password is required!",
      })
      .min(8, "password should be minimum 8 characters "),
  }),
});

// Change Password Schema
const changePassword = z.object({
  body: z.object({
    oldPassword: z.string({
      required_error: "old Password is required!",
    }),
    newPassword: z
      .string({
        required_error: "new password is required!",
      })
      .min(8, "Password should be minimum 8 characters "),
  }),
});

// ======================================
// EXPORT
// ======================================
export const authValidation = {
  registerUser,
  loginUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,
};
