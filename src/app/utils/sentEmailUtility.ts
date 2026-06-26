import config from "../../config";
const nodemailer = require("nodemailer");
const smtpTransporter = require("nodemailer-smtp-transport");

// IT'S WORK
// ALEX Client Credentials
// ##########################################
let sentEmailUtility = async (
  emailTo: string,
  EmailSubject: string,
  EmailHTML?: string, // HTML content as a parameter
  EmailText?: string,
) => {
  let transporter = nodemailer.createTransport(
    smtpTransporter({
      host: "smtp.hostinger.com",
      secure: true,
      port: 465,
      auth: {
        user: config.emailSender.email,
        pass: config.emailSender.app_pass,
      },
      tls: {
        rejectUnauthorized: false, // OPTIONAL: Bypass SSL issues (only if necessary)
      },
    }),
  );

  let mailOption = {
    from: "AcuityPass <" + config.emailSender.email + ">",
    to: emailTo,
    subject: EmailSubject,
    text: EmailText,
    html: EmailHTML,
  };

  return await transporter.sendMail(mailOption);
};

export default sentEmailUtility;
