import Customer from "../../../models/CustomerModel.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

// SendGrid setup for Email
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// Signup/Register (called after OTP verification)
export const signup = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validation - must have either email or phone
    if ((!email && !phone) || !password) {
      return res.status(400).json({
        status: false,
        message: "Please provide email or phone number, and password",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Validate email format if provided
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        status: false,
        message: "Please provide a valid email address",
      });
    }

    // Check if user already exists by email or phone
    const existingUser = email 
      ? await Customer.findOne({ email })
      : await Customer.findOne({ phone });
    
    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: email 
          ? "User with this email already exists"
          : "User with this phone number already exists",
      });
    }

    // Create new user
    const userData = {
      name: name || "",
      password,
      isGoogleUser: false,
    };

    if (email) userData.email = email.toLowerCase().trim();
    if (phone) userData.phone = phone;

    const user = await Customer.create(userData);

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      username: user.username,
      status: user.status,
    };

    return res.status(201).json({
      status: true,
      message: "User registered successfully",
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      status: false,
      message: "Error during registration",
      error: error.message,
    });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // Validation - must have either email or phone
    if ((!email && !phone) || !password) {
      return res.status(400).json({
        status: false,
        message: "Please provide email or phone number, and password",
      });
    }

    // Find user by email or phone and include password
    const query = email 
      ? { email: email.toLowerCase().trim() }
      : { phone };
    
    const user = await Customer.findOne(query).select("+password");

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is Google user (no password)
    if (user.isGoogleUser && !user.password) {
      return res.status(401).json({
        status: false,
        message: "Please login with Google",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is active
    if (user.status !== "Active") {
      return res.status(403).json({
        status: false,
        message: "Your account is not active. Please contact support.",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      username: user.username,
      status: user.status,
      profilePicture: user.profilePicture,
    };

    return res.status(200).json({
      status: true,
      message: "Login successful",
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      status: false,
      message: "Error during login",
      error: error.message,
    });
  }
};

// Forgot Password - Send reset email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: false,
        message: "Please provide your email address",
      });
    }

    const user = await Customer.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        status: true,
        message: "If the email exists, a password reset link has been sent",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set token and expiry (1 hour)
    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;

    // Send email using SendGrid
    const msg = {
      to: user.email,
      from: process.env.SENDGRID_FROM_EMAIL || process.env.SENDGRID_VERIFIED_SENDER,
      subject: "Password Reset Request - Trippymate",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h2 style="color: white; margin: 0; font-size: 24px;">Password Reset Request</h2>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">Hello ${user.name || 'User'},</p>
            <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">You requested to reset your password. Click the button below to reset it:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #1D4ED8; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Or copy and paste this link in your browser:</p>
            <p style="color: #1D4ED8; word-break: break-all; font-size: 13px; background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">${resetUrl}</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">This link will expire in 1 hour.</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">If you didn't request this, please ignore this email.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">Best regards,<br><strong style="color: #1D4ED8;">Trippymate Team</strong></p>
            </div>
          </div>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      return res.status(200).json({
        status: true,
        message: "Password reset email sent successfully",
      });
    } catch (emailError) {
      console.error("SendGrid error:", emailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        status: false,
        message: "Error sending email. Please try again later.",
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      status: false,
      message: "Error processing request",
      error: error.message,
    });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "Please provide token, password, and confirm password",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "Passwords do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Hash the token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: false,
        message: "Invalid or expired reset token",
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      status: false,
      message: "Error resetting password",
      error: error.message,
    });
  }
};

// Set Password (after OTP verification)
export const setPassword = async (req, res) => {
  try {
    const { contact, contactType, password, name } = req.body;

    if (!contact || !password) {
      return res.status(400).json({
        status: false,
        message: "Contact and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Find or create user by email or phone
    const userQuery = contactType === 'email' 
      ? { email: contact.toLowerCase().trim() }
      : { phone: contact };

    let user = await Customer.findOne(userQuery);

    if (!user) {
      // Create new user if doesn't exist
      const userData = {
        name: name || "",
        password,
        isGoogleUser: false,
      };

      if (contactType === 'email') {
        userData.email = contact.toLowerCase().trim();
      } else {
        userData.phone = contact;
      }

      user = await Customer.create(userData);
    } else {
      // Check if user already has a password set
      if (user.password) {
        return res.status(400).json({
          status: false,
          message: "Password already set. Please login or use forgot password.",
        });
      }

      // Update name if provided
      if (name) {
        user.name = name;
      }

      // Set password
      user.password = password;
      await user.save();
    }

    return res.status(200).json({
      status: true,
      message: "Password set successfully. Please login.",
    });
  } catch (error) {
    console.error("Set password error:", error);
    return res.status(500).json({
      status: false,
      message: "Error setting password",
      error: error.message,
    });
  }
};

// Google OAuth Login/Signup
export const googleAuth = async (req, res) => {
  try {
    const { googleId, email, name, profilePicture } = req.body;

    if (!googleId || !email || !name) {
      return res.status(400).json({
        status: false,
        message: "Please provide Google authentication details",
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.isGoogleUser = true;
      }
      // Always update name and profilePicture from Google (in case user changed them on Google)
      if (name) user.name = name;
      if (profilePicture) user.profilePicture = profilePicture;
      user.emailVerified = true; // Google emails are verified
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        name,
        email: email.toLowerCase().trim(),
        googleId,
        isGoogleUser: true,
        profilePicture: profilePicture || "",
        emailVerified: true, // Google emails are verified
      });
    }

    // Generate token
    const token = generateToken(user._id);

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      username: user.username,
      status: user.status,
      profilePicture: user.profilePicture,
      isGoogleUser: user.isGoogleUser,
    };

    return res.status(200).json({
      status: true,
      message: "Google authentication successful",
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({
      status: false,
      message: "Error during Google authentication",
      error: error.message,
    });
  }
};

// Get Current User
export const getCurrentUser = async (req, res) => {
  try {
    const user = await Customer.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      username: user.username,
      status: user.status,
      profilePicture: user.profilePicture,
      isGoogleUser: user.isGoogleUser,
    };

    return res.status(200).json({
      status: true,
      data: userResponse,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

