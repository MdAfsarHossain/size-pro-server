import config from "../../../config";
import prisma from "../../lib/prisma";
import sentEmailUtility from "../../utils/sentEmailUtility";
// import sentEmailUtility from "../../utils/sentEmailUtility";

export const OTPFn = async (
  email: string,
  userId: string,
  emailSubject: string,
  emailTemplate: any,
) => {
  // ======================================
  // OTP CONFIGURATION
  // ======================================
  const OTP_EXPIRY_TIME = Number(config.otp_expiry_time) * 60 * 1000;
  const expiry = new Date(Date.now() + OTP_EXPIRY_TIME);

  // Generate 4-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000);
  const emailText = `Your OTP is: ${otpCode}`;
  const emailHTML = emailTemplate(otpCode);

  // ======================================
  // SEND OTP EMAIL
  // ======================================
  await sentEmailUtility(email, emailSubject, emailHTML);

  // ======================================
  // STORE OTP IN DATABASE
  // ======================================
  const existingOtp = await prisma.oTP.findFirst({
    where: { userId },
  });

  if (existingOtp) {
    // Update existing OTP
    await prisma.oTP.update({
      where: { id: existingOtp.id },
      data: {
        otpCode: otpCode.toString(),
        userId,
        expiry,
      },
    });
  } else {
    // Create new OTP record
    await prisma.oTP.create({
      data: {
        otpCode: otpCode.toString(),
        userId,
        expiry,
      },
    });
  }

  return;
};
