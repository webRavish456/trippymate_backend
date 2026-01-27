
import OTP from "../../models/optModel.js";
import twilio from "twilio";
import sgMail from "@sendgrid/mail";


const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);


sgMail.setApiKey(process.env.SENDGRID_API_KEY);


const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};


const isValidPhone = (phone) => {
  const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

const sentOtp = async (req, res) => {
  try {
    const { contact, contactType } = req.body;

    if (!contact) {
      return res.status(400).json({
        status: false,
        message: "Email or mobile number is required and cannot be left blank",
      });
    }

    // Determine if contact is email or phone
    const isEmail = contactType === 'email' || isValidEmail(contact);
    const isPhone = contactType === 'phone' || isValidPhone(contact);

    if (!isEmail && !isPhone) {
      return res.status(400).json({
        status: false,
        message: "Please provide a valid email address or mobile number",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    try {
      if (isEmail) {
        // Send OTP via Email using SendGrid
        const msg = {
          to: contact,
          from: process.env.SENDGRID_FROM_EMAIL, // Use verified sender email
          subject: 'Your OTP for Trippymate Registration',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h2 style="color: white; margin: 0;">Trippymate OTP Verification</h2>
              </div>
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">Hello,</p>
                <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">Your 6-digit OTP for registration is:</p>
                <div style="background: white; padding: 25px; text-align: center; font-size: 32px; font-weight: bold; color: #1D4ED8; margin: 20px 0; border-radius: 8px; border: 2px solid #e5e7eb; letter-spacing: 5px;">
                  ${otp}
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">This OTP will expire in 5 minutes.</p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">If you didn't request this OTP, please ignore this email.</p>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">Best regards,<br>The Trippymate Team</p>
                </div>
              </div>
            </div>
          `
        };

        await sgMail.send(msg);
        console.log(`OTP sent to email: ${contact}`);

      } else if (isPhone) {
        // Send OTP via SMS using Twilio
        await client.messages.create({
          body: `Your 6-digit OTP for registration in Trippymate: ${otp}. This OTP will expire in 5 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: contact,
        });
        console.log(`OTP sent to phone: ${contact}`);
      }

    } catch (sendError) {
      console.error("Error sending OTP:", sendError);
      return res.status(500).json({
        status: false,
        message: `Failed to send OTP via ${isEmail ? 'email' : 'SMS'}`,
        error: sendError.message,
      });
    }

    // Save or Update OTP in DB
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
    await OTP.findOneAndUpdate(
      { contact: contact },
      { 
        otp, 
        contactType: isEmail ? 'email' : 'phone',
        createdAt: new Date(), 
        expiresAt 
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      status: true,
      message: `OTP sent successfully to your ${isEmail ? 'email' : 'mobile number'}`,
      contactType: isEmail ? 'email' : 'phone'
    });

  } catch (err) {
    console.error("Error in sentOtp:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to send OTP",
      error: err.message,
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { contact, otp } = req.body;

    if (!contact || !otp) {
      return res.status(400).json({
        status: false,
        message: "Both OTP and contact (email/phone) are required"
      });
    }

    // Find OTP record
    const result = await OTP.findOne({ contact: contact });

    if (!result) {
      return res.status(404).json({
        status: false,
        message: "Contact not found in our records. Please request a new OTP"
      });
    }

    // Check if OTP has expired
    if (new Date() > result.expiresAt) {
      return res.status(400).json({
        status: false,
        message: "OTP has expired. Please request a new OTP"
      });
    }

    // Verify OTP
    if (result.otp != otp) {
      return res.status(400).json({
        status: false,
        message: "Invalid OTP. Please enter the correct OTP"
      });
    }

    // Optional: Delete the OTP after successful verification
    await OTP.deleteOne({ contact: contact });

    return res.status(200).json({
      status: true,
      message: "OTP verified successfully!",
      contactType: result.contactType
    });

  } catch (err) {
    console.error("Error in verifyOtp:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to verify OTP",
      error: err.message
    });
  }
};

export { sentOtp, verifyOtp };
