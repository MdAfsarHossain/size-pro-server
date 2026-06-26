import { Role } from "@prisma/client";
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
    role: z.enum([Role.ADMIN], {
      errorMap: () => {
        return {
          message: `Role should be either ${Role.ADMIN}`,
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
