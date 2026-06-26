// Email template generator
// <title>Test Passed</title>
export const getTestPassedTemplate = (booking: any): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0; padding:0; background:#f4f6f8; font-family:Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0; padding:0; width:100%;">
    <tr>
      <td align="center" style="padding:40px 15px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" 
               style="max-width:600px; background:#ffffff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); overflow:hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:40px 20px; background:linear-gradient(#28a745, #1e7e34);">
              <h2 style="margin:0; font-size:24px; font-weight:600; color:#ffffff;">Congratulations! Test Passed</h2>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding:30px 40px 20px 40px; text-align:left; color:#5a6c7d; font-size:15px; line-height:1.6;">
              <p style="margin:0 0 15px 0;">Dear <strong style="color:#2c3e50;">Md. Afsar Hossain</strong>,</p>
              <!-- <p style="margin:0 0 20px 0;">We are pleased to inform you that you have <strong style="color:#28a745;">successfully passed</strong> your ''.</p> -->
            </td>
          </tr>

          <!-- Test Details -->
          <tr>
            <td align="center" style="padding:0 40px 20px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" 
                     style="background:#f8f9fa; border-radius:8px; padding:20px;">
                <tr>
                  <td style="padding:8px 0; border-bottom:1px solid #e9ecef;">
                    <strong style="color:#6c757d;">Booking ID:</strong> 
                    <span style="color:#2c3e50; float:right;">${booking.bookingId}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0; border-bottom:1px solid #e9ecef;">
                    <strong style="color:#6c757d;">Test Date:</strong> 
                    <span style="color:#2c3e50; float:right;">${booking.appointmentDate}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <strong style="color:#6c757d;">Result:</strong> 
                    <span style="color:#28a745; float:right; font-weight:600;">PASSED ✅</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment Section -->
          <tr>
            <td style="padding:20px 40px; background:#d4edda; border-left:4px solid #28a745;">
              <p style="margin:0 0 10px 0; font-size:16px; color:#155724; font-weight:600;">💰 Payment Processed</p>
              <p style="margin:0; font-size:14px; color:#155724;">
                Your payment has been automatically processed. You will receive a separate payment confirmation shortly.
              </p>
            </td>
          </tr>

          <!-- Next Steps -->
          <tr>
            <td style="padding:20px 40px 10px 40px;">
              <p style="margin:0 0 15px 0; font-size:16px; color:#2c3e50; font-weight:600;">Next Steps:</p>
              <ul style="margin:0; padding-left:20px; color:#5a6c7d; font-size:14px; line-height:1.6;">
                <li>You will receive your official certificate within 3-5 business days</li>
                <li>Keep this confirmation email for your records</li>
                <li>Contact us if you need duplicate documents</li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:30px 20px; background:#f9f9f9; border-top:1px solid #eee;">
              <p style="margin:0; font-size:14px; color:#2c3e50;">Congratulations on your success! 🎊</p>
              <p style="margin:5px 0 0 0; font-size:13px; color:#7f8c8d;">Best regards, Team Kamodoc</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};




// <title>Test Results</title>
// Email template generator
export const getTestFailedTemplate = (booking: any): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0; padding:0; background:#f4f6f8; font-family:Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0; padding:0; width:100%;">
    <tr>
      <td align="center" style="padding:40px 15px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" 
               style="max-width:600px; background:#ffffff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); overflow:hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:40px 20px; background:linear-gradient(#dc3545, #c82333);">
              <h2 style="margin:0; font-size:24px; font-weight:600; color:#ffffff;">Test Results</h2>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding:30px 40px 20px 40px; text-align:left; color:#5a6c7d; font-size:15px; line-height:1.6;">
              <p style="margin:0 0 15px 0;">Dear <strong style="color:#2c3e50;">${booking.customerName}</strong>,</p>
              <p style="margin:0 0 20px 0;">We have completed the evaluation of your ${booking.serviceType}.</p>
            </td>
          </tr>

          <!-- Test Details -->
          <tr>
            <td align="center" style="padding:0 40px 20px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" 
                     style="background:#f8f9fa; border-radius:8px; padding:20px;">
                <tr>
                  <td style="padding:8px 0; border-bottom:1px solid #e9ecef;">
                    <strong style="color:#6c757d;">Booking ID:</strong> 
                    <span style="color:#2c3e50; float:right;">${booking.bookingId}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0; border-bottom:1px solid #e9ecef;">
                    <strong style="color:#6c757d;">Test Date:</strong> 
                    <span style="color:#2c3e50; float:right;">${booking.appointmentDate}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <strong style="color:#6c757d;">Result:</strong> 
                    <span style="color:#dc3545; float:right; font-weight:600;">NOT PASSED ❌</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Suggestions Section -->
          <tr>
            <td style="padding:20px 40px; background:#f8d7da; border-left:4px solid #dc3545;">
              <p style="margin:0 0 10px 0; font-size:16px; color:#721c24; font-weight:600;">💡 Suggestions for Improvement</p>
              <p style="margin:0 0 10px 0; font-size:14px; color:#721c24;">
                Don't worry! Many people need multiple attempts. Here are some suggestions:
              </p>
              <ul style="margin:0; padding-left:20px; color:#721c24; font-size:14px; line-height:1.5;">
                <li>Practice with online vision tests</li>
                <li>Get adequate rest before your next test</li>
                <li>Avoid screen time 1 hour before testing</li>
                <li>Consider consulting with an optometrist</li>
              </ul>
            </td>
          </tr>

          <!-- Retest Information -->
          <tr>
            <td style="padding:20px 40px 10px 40px;">
              <p style="margin:0 0 15px 0; font-size:16px; color:#2c3e50; font-weight:600;">Ready to Try Again?</p>
              <p style="margin:0 0 15px 0; color:#5a6c7d; font-size:14px;">
                You can schedule a new test after 7 days. We offer discounted retest fees for returning customers.
              </p>
              <a href="https://kamodoc.com/book-retest" 
                 style="display:inline-block; background:#dc3545; color:#ffffff; padding:10px 25px; 
                        text-decoration:none; border-radius:6px; font-weight:600; font-size:14px;">
                Book Retest
              </a>
            </td>
          </tr>

          <!-- Payment Note -->
          <tr>
            <td style="padding:15px 40px; background:#e2e3e5; border-radius:6px; margin:20px 40px;">
              <p style="margin:0; font-size:13px; color:#383d41; text-align:center;">
                💳 No payment required for this test. Payment will be processed only after you pass.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:30px 20px; background:#f9f9f9; border-top:1px solid #eee;">
              <p style="margin:0; font-size:14px; color:#2c3e50;">We're here to help you succeed! 💪</p>
              <p style="margin:5px 0 0 0; font-size:13px; color:#7f8c8d;">Best regards, Team Kamodoc</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
