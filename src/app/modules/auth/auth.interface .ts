import { Role } from "@prisma/client";

// ======================================
// REGEX PATTERNS
// ======================================
const phoneRegex =
  /^[+]*[0-9]{1,4}[ -]?[0-9]{1,4}[ -]?[0-9]{1,4}[ -]?[0-9]{1,4}$/;

// ======================================
// USER INTERFACES
// ======================================
export interface IRegisterUser {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: Role;
  fcmToken?: string;
}

export interface IOtp {
  userId: string;
  otpCode: string;
}

export interface IUserLogin {
  email: string;
  password: string;
  fcmToken?: string;
}

export interface IChangePassword {
  newPassword: string;
  oldPassword: string;
  // confirmPassword: string;
}

// ======================================
// PARTNER INTERFACES
// ======================================
export interface IPartnerRegistration {
  dateTimeFormat: string;
  timezone: string;
  firstName: string;
  lastName: string;
  companyName: string;
  address: string;
  city: string;
  zipCode: string;
  email: string;
  phoneNumber: string;
  password: string;
  country: string;
}
