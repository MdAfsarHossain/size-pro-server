// // Email template generator
// export const bookingConfirmationTemplate  = (booking: any): string => {
//   return `
//     <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Appointment Schedule Booking Confirmation</title>
//     <style>
//         /* Base styles */
//                 body {
//             font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//             line-height: 1.6;
//             color: #333333;
//             background-color: #f7f9fc;
//             margin: 0;
//             padding: 0;
//         }

//         .container {
//             max-width: 600px;
//             margin: 20px auto;
//             background-color: #ffffff;
//             border-radius: 12px;
//             overflow: hidden;
//             box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
//         }

//         /* Header section */
//         .header {
//             background: linear-gradient(135deg, #4f46e5, #7c3aed);
//             color: white;
//             padding: 30px 20px;
//             text-align: center;
//         }

//         .header h1 {
//             margin: 0;
//             font-size: 28px;
//             font-weight: 600;
//             color: white;
//         }

//         /* Content section */
//         .content {
//             padding: 30px;
//         }

//         .greeting {
//             color: #4f46e5;
//             margin-top: 0;
//             font-size: 24px;
//         }

//         .divider {
//             height: 1px;
//             background: linear-gradient(to right, transparent, #e2e8f0, transparent);
//             margin: 25px 0;
//         }

//         /* Booking details */
//         .details-card {
//             background-color: #f8fafc;
//             border-radius: 8px;
//             padding: 20px;
//             margin-bottom: 25px;
//             border-left: 4px solid #4f46e5;
//         }

//         .detail-item {
//             margin-bottom: 12px;
//             display: flex;
//         }

//         .detail-label {
//             font-weight: 600;
//             min-width: 120px;
//             color: #4f46e5;
//         }

//         /* Button styling */
//         .button-container {
//             text-align: center;
//             margin: 25px 0;
//         }

//         .button {
//             display: inline-block;
//             padding: 14px 32px;
//             background: linear-gradient(135deg, #4f46e5, #7c3aed);
//             color: white;
//             text-decoration: none;
//             border-radius: 6px;
//             font-weight: 600;
//             box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
//             transition: all 0.3s ease;
//         }

//         .button:hover {
//             transform: translateY(-2px);
//             box-shadow: 0 6px 12px rgba(79, 70, 229, 0.3);
//         }

//         /* Footer */
//         .footer {
//             text-align: center;
//             padding: 20px;
//             color: #64748b;
//             font-size: 14px;
//         }

//         /* Responsive adjustments */
//         @media (max-width: 650px) {
//             .container {
//                 margin: 0;
//                 border-radius: 0;
//             }

//             .content {
//                 padding: 20px;
//             }

//             .detail-item {
//                 flex-direction: column;
//             }

//             .detail-label {
//                 margin-bottom: 4px;
//             }
//         }
//     </style>
// </head>
// <body>
//     <div class="container">
//         <div class="header">
//             <h1>Appointment Schedule Confirmed!</h1>
//         </div>

//         <div class="content">
//             <h2 class="greeting">Hello ${booking.customerName}!</h2>
//             <p>Your appointment schedule booking has been confirmed successfully. We're looking forward to seeing you!</p>

//             <div class="divider"></div>

//             <h3>Appointment Schedule Details:</h3>
//             <div class="details-card">
//                 <div class="detail-item">
//                     <span class="detail-label">Date:</span>
//                     <span>${booking.date}</span>
//                 </div>
//                 <div class="detail-item">
//                     <span class="detail-label">Time:</span>
//                     <span>${booking.timeSlot}</span>
//                 </div>
//                 <div class="detail-item">
//                     <span class="detail-label">Meeting ID:</span>
//                     <span>${booking.meetingId}</span>
//                 </div>
//             </div>

//             <h3>Video Meeting:</h3>
//             <p>Join your meeting using the link below at the scheduled time:</p>

//             <div class="button-container">
//                 <a href="${booking.meetingUrl}" class="button">Join Video Meeting</a>
//             </div>

//             <p style="text-align: center; word-break: break-all;">
//                 Or copy this link:<br>
//                 <span style="color: #4f46e5;">${booking.meetingUrl}</span>
//             </p>

//             <div class="detail-item" style="justify-content: center;">
//                 <span class="detail-label">Meeting Time:</span>
//                 <span>${booking.meetingStartTime}</span>
//             </div>

//             <div class="divider"></div>

//             <p>A calendar invite has been sent to your email. Please add it to your calendar to ensure you don't miss your appointment.</p>

//             <p>If you have any questions or need to make changes to your booking, please contact our support team.</p>

//             <p><br><br>Best regards,<br><strong>The Appointment Schedule Booking Team</strong></p>
//         </div>

//         <div class="footer">
//             <p>© 2025 Appointment Schedule Booking System. All rights reserved.</p>
//         </div>
//     </div>
// </body>
// </html>
//   `;
// };


// <title>Appointment Confirmed ✨</title>
// Enhanced Email Template Generator - Ocean Teal Theme
export const bookingConfirmationTemplate = (booking: any): string => {
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        /* Reset & Base */
        * { box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.7;
            color: #2d3748;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px 0;
        }
        
        .container {
            max-width: 620px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        /* Hero Header */
        .hero {
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .hero::before {
            content: '✨';
            position: absolute;
            top: 20px;
            right: 20px;
            font-size: 24px;
        }
        
        .hero h1 {
            margin: 0 0 10px 0;
            font-size: 32px;
            font-weight: 800;
            letter-spacing: -0.5px;
        }
        
        .hero .subtitle {
            margin: 0;
            font-size: 16px;
            opacity: 0.95;
            font-weight: 400;
        }
        
        /* Content */
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            color: #0ea5e9;
            margin: 0 0 20px 0;
            font-size: 26px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .greeting::before {
            content: '👋';
        }
        
        .intro-text {
            color: #64748b;
            font-size: 16px;
            margin-bottom: 30px;
        }
        
        /* Decorative Divider */
        .divider {
            height: 3px;
            background: linear-gradient(90deg, transparent, #0ea5e9, transparent);
            margin: 35px 0;
            border-radius: 2px;
        }
        
        /* Enhanced Details Card */
        .details-card {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-radius: 16px;
            padding: 25px;
            margin-bottom: 30px;
            border: 1px solid #bae6fd;
            position: relative;
        }
        
        .details-card::before {
            content: '📅';
            position: absolute;
            top: 15px;
            left: 15px;
            font-size: 20px;
        }
        
        .details-card h3 {
            margin: 0 0 20px 40px;
            color: #0369a1;
            font-size: 20px;
            font-weight: 700;
        }

        .hero h1 {
            color: #ffffff;
        }
        
        .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-left: 40px;
        }
        
        .detail-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 0;
        }
        
        .detail-icon {
            width: 20px;
            text-align: center;
            color: #0ea5e9;
            font-weight: bold;
        }
        
        .detail-label {
            font-weight: 600;
            color: #475569;
            min-width: 80px;
        }
        
        .detail-value {
            color: #1e293b;
            font-weight: 500;
        }
        
        /* Premium Button */
        .button-container {
            text-align: center;
            margin: 35px 0;
        }
        
        .premium-button {
            display: inline-block;
            padding: 16px 40px;
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 8px 25px rgba(14, 165, 233, 0.3);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        
        .premium-button::before {
            content: '🎥';
            margin-right: 8px;
        }
        
        .premium-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 35px rgba(14, 165, 233, 0.4);
        }
        
        /* Link Display */
        .link-display {
            background: white;
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
            border: 2px dashed #bae6fd;
            text-align: center;
        }
        
        .link-text {
            color: #0ea5e9;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            word-break: break-all;
            margin: 0;
        }
        
        /* Meeting Time */
        .meeting-time {
            background: #eff6ff;
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            margin: 20px 0;
            border-left: 4px solid #0ea5e9;
        }
        
        .meeting-time strong {
            color: #0ea5e9;
        }
        
        /* Footer Content */
        .footer-content {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
        }
        
        .support-text {
            color: #64748b;
            margin-bottom: 10px;
        }
        
        .signature {
            color: #0ea5e9;
            font-weight: 700;
            margin: 0;
        }
        
        /* Email Footer */
        .email-footer {
            background: #1e293b;
            color: #cbd5e1;
            padding: 20px;
            text-align: center;
            font-size: 13px;
        }

              /* Info boxes */
        .info-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .info-box.success {
            background: #d1fae5;
            border-left-color: #10b981;
        }
        
        .info-box p {
            margin: 0;
            color: #78350f;
            font-size: 14px;
        }
        
        .info-box.success p {
            color: #065f46;
        }
        
        /* Responsive */
        @media (max-width: 650px) {
            .container { margin: 0; border-radius: 0; }
            .content, .hero { padding: 25px 20px; }
            .detail-grid { grid-template-columns: 1fr; }
            .hero h1 { font-size: 26px; }
            .greeting { font-size: 22px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Hero Header -->
        <div class="hero">
            <h1 >Appointment Confirmed!</h1>
            <p class="subtitle">Your schedule is locked in</p>
        </div>
        
        <!-- Main Content -->
        <div class="content">
            <h2 class="greeting">Hello ${booking.customerName}!</h2>
            <p class="intro-text">We're thrilled to confirm your appointment. Everything is set for an amazing experience!</p>
            
            <div class="divider"></div>
            
            <!-- Appointment Details -->
            <div class="details-card">
                <h3>📋 Appointment Details</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-icon">📅</span>
                        <span class="detail-label">Date:</span>
                        <span class="detail-value">${booking.date}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">🕒</span>
                        <span class="detail-label">Time:</span>
                        <span class="detail-value">${booking.timeSlot}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">🔢</span>
                        <span class="detail-label">Meeting ID:</span>
                        <span class="detail-value">${booking.meetingId}</span>
                    </div>
                </div>
            </div>
            
            <!-- Video Meeting Section -->
            <h3 style="color: #0369a1; margin-bottom: 15px;">💻 Join Your Video Meeting</h3>
            
            <div class="button-container">
                <a href="${booking.meetingUrl}" class="premium-button">Join Meeting Now</a>
            </div>
            
            <div class="link-display">
                <p class="link-text">${booking.meetingUrl}</p>
            </div>
            
            <div class="meeting-time">
                <strong>🕐 Meeting starts at:</strong><br>
                ${booking.meetingStartTime}
            </div>
            
            <div class="divider"></div>

            <div class="info-box">
                <p><strong>Pro Tip:</strong> Join the meeting 5 minutes early to test your audio and video settings.</p>
            </div>
            
            <div class="footer-content">
                <p class="support-text">📧 A calendar invite has been sent to your email</p>
                <p class="support-text">Need help? Reply to this email or contact support@appointmentsystem.com</p>
                <p class="signature">The Appointment Team ✨</p>
            </div>
        </div>
        
        <!-- Email Footer -->
        <div class="email-footer">
            <p>© 2025 Appointment Schedule System | All rights reserved</p>
        </div>
    </div>
</body>
</html>
  `;
};