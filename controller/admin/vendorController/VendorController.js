import Vendor from "../../../models/VendorModel.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

const saltRounds = 10;

// Configure email transporter - matching your OTP configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // Changed from EMAIL_PASSWORD to EMAIL_PASS
  }
});

// Email template function
const sendCredentialsEmail = async (vendorEmail, vendorName, username, password) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: vendorEmail,
    subject: 'Your Vendor Account Credentials - Trippymate',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
          .credentials { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #007bff; border-radius: 3px; }
          .credential-row { margin: 10px 0; }
          .label { color: #666; font-size: 14px; }
          .value { color: #333; font-size: 16px; font-weight: bold; margin-top: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .warning { color: #d32f2f; font-weight: bold; background: #ffebee; padding: 10px; border-radius: 3px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">Trippymate Vendor Portal</h2>
            <p style="margin: 5px 0 0 0;">Account Credentials</p>
          </div>
          <div class="content">
            <p>Hello <strong>${vendorName}</strong>,</p>
            <p>Your vendor account has been created successfully! Below are your login credentials to access the Trippymate Vendor Dashboard:</p>
            
            <div class="credentials">
              <div class="credential-row">
                <div class="label">Username</div>
                <div class="value">${username}</div>
              </div>
              <div class="credential-row">
                <div class="label">Password</div>
                <div class="value">${password}</div>
              </div>
            </div>
            
            
            
            <p>You can now log in to your vendor dashboard and start managing your services.</p>
            <p style="color:rgb(255,0,0)">This password is for one time login change it to after logging in according to your choice</p>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">If you didn't request this account or have any questions, please contact our support team immediately.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from Trippymate. Please do not reply to this message.</p>
            <p style="margin-top: 5px;">© ${new Date().getFullYear()} Trippymate. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Credentials email sent successfully to: ${vendorEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

const AddUser = async (req, res) => {
  const { id, username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      status: false,
      message: "Both username and password are required"
    });
  }

  if (!id) {
    return res.status(400).json({
      status: false,
      message: "Vendor ID is required"
    });
  }

  try {
    // Find vendor first
    const vendor = await Vendor.findById(id);
    //console.log(vendor);
    
    if (!vendor) {
      return res.status(404).json({
        status: false,
        message: "Vendor not found"
      });
    }

    // Check if vendor has email
    if (!vendor.email) {
      return res.status(400).json({
        status: false,
        message: "Vendor email not found. Cannot send credentials."
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

  const existUsername=await Vendor.findOne({username:username});
  if(existUsername){
 return res.status(401).json({status:"false",message:"Username is already alloted to another user try with different username"});
  }
    const updateResult=await vendor.updateOne({ username, password: hashedPassword,status:"Active" });
    console.log(updateResult);

    // Send email with plain password (before hashing)
    const emailResult = await sendCredentialsEmail(
      vendor.email,
      vendor.name || vendor.businessName || 'Vendor',
      username,
      password
    );

    if (!emailResult.success) {
      // Credentials updated but email failed
      console.error('Email notification failed:', emailResult.error);
      return res.status(200).json({
        status: true,
        message: "User credentials created successfully, but email notification failed",
        emailError: emailResult.error
      });
    }

    return res.status(200).json({
      status: true,
      message: "User credentials created successfully and email sent to vendor"
    });
    
  } catch (err) {
    console.error("Error in AddUser:", err);
    return res.status(500).json({
      status: false,
      message: "User creation failed, try again later",
      error: err.message
    });
  }
};

const deleteVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const result = await Vendor.findByIdAndDelete(vendorId);
    
    if (!result) {
      return res.status(404).json({
        status: false,
        message: "Vendor not found"
      });
    }
    
    return res.status(200).json({
      status: true,
      message: `Vendor deleted successfully id:${vendorId}`
    });
    
  } catch (error) {
    console.error("Error in deleteVendor:", error);
    return res.status(500).json({
      status: false,
      message: "Vendor deletion failed",
      error: error.message
    });
  }
};

const updateVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const data = req.body;
    let plainPassword = null;

    // If password is being updated, save plain version for email and hash it
    if (data.password) {
      plainPassword = data.password;
      data.password = await bcrypt.hash(data.password, saltRounds);
    }

    // Parse JSON strings if they exist
    const jsonFields = ['bankDetails', 'hotelDetails', 'transportDetails', 'activityDetails', 'foodDetails', 'eventDetails']
    jsonFields.forEach(field => {
      if (data[field] && typeof data[field] === 'string') {
        try {
          data[field] = JSON.parse(data[field])
        } catch (e) {
          // Keep as is if parsing fails
        }
      }
    })

    // Handle file uploads from middleware
    if (req.imageUrls) {
      if (req.imageUrls.companyLogo) {
        data.companyLogo = {
          path: req.imageUrls.companyLogo,
        };
      }
      if (req.imageUrls.businessProof) {
        data.businessProof = {
          path: req.imageUrls.businessProof,
        };
      }
      if (req.imageUrls.vendorGovernmentId) {
        data.vendorGovernmentId = {
          path: req.imageUrls.vendorGovernmentId,
        };
      }
      if (req.imageUrls.aadhaarCard) {
        data.aadhaarCard = {
          path: req.imageUrls.aadhaarCard,
        };
      }
      if (req.imageUrls.panCard) {
        data.panCard = {
          path: req.imageUrls.panCard,
        };
      }
      if (req.imageUrls.license) {
        data.license = {
          path: req.imageUrls.license,
        };
      }
      if (req.imageUrls.gstCertificate) {
        data.gstCertificate = {
          path: req.imageUrls.gstCertificate,
        };
      }
      if (req.imageUrls.certificate) {
        data.certificate = {
          path: req.imageUrls.certificate,
        };
      }
      if (req.imageUrls.otherDocument) {
        data.otherDocument = {
          path: req.imageUrls.otherDocument,
        };
      }
      if (req.imageUrls.image) {
        data.image = req.imageUrls.image;
      }
    }

    const result = await Vendor.findByIdAndUpdate(vendorId, data, { new: true });
    
    if (!result) {
      return res.status(404).json({
        status: false,
        message: "Vendor not found"
      });
    }

    // If username or password was updated, send email
    if ((data.username || plainPassword) && result.email) {
      const emailResult = await sendCredentialsEmail(
        result.email,
        result.name || result.businessName || 'Vendor',
        result.username,
        plainPassword || 'Your existing password (unchanged)'
      );

      if (!emailResult.success) {
        console.error('Email notification failed:', emailResult.error);
      }
    }

    // Remove password from response for security
    const responseData = result.toObject();
    delete responseData.password;

    return res.status(200).json({
      status: true,
      message: `Vendor updated successfully id:${vendorId}`,
      data: responseData
    });
    
  } catch (error) {
    console.error("Error in updateVendor:", error);
    return res.status(500).json({
      status: false,
      message: "Vendor update failed",
      error: error.message
    });
  }
};

const showVendors = async (req, res) => {
  try {
    // Get page and limit from query parameters, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination info
    const totalVendors = await Vendor.countDocuments();
    
    // Fetch vendors with pagination
    const vendors = await Vendor.find({})
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    if (vendors.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No vendors found"
      });
    }

    const totalPages = Math.ceil(totalVendors / limit);

    return res.status(200).json({
      status: true,
      message: "Vendors retrieved successfully",
      data: vendors,
      pagination: {
        currentPage: page,
        totalPages,
        totalVendors,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });
    
  } catch (error) {
    console.error("Error in showVendors:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to retrieve vendors",
      error: error.message
    });
  }
};

const changeDefaultPassword = async (req, res) => {
  try {
    const { username } = req.params;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(401).json({ status: false, message: "Confirmed password does not match" });
    }

    const vendor = await Vendor.findOne({ username }).select('password');
    if (!vendor) {
      return res.status(401).json({ status: false, message: "Username not registered" });
    }

    const isOldPasswordCorrect = await bcrypt.compare(oldPassword, vendor.password);
    if (!isOldPasswordCorrect) {
      return res.status(401).json({ status: false, message: "Old password incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    vendor.password = hashedPassword;
    await vendor.save();

    return res.status(201).json({ status: true, message: "Password changed successfully" });
    
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};
const updateVendorStatus = async (req, res) => {
  const { id, status } = req.body;

  try {
    const vendorStatus = await Vendor.findByIdAndUpdate(id, { status: status }, { new: true });

    if (vendorStatus) {
      return res.status(201).json({ status: "true", message: "User Status Changed Successfully", Data: vendorStatus });
    }
  } catch (error) {
    return res.status(400).json({ status: "false", message: "Failed To change user status", Error: error.message });
  }
};

// Create Vendor (for business registration with file uploads)
const setVendor = async (req, res) => {
  try {
    const {
      name,
      address,
      email,
      phone,
      typeOfId,
      idNumber,
      businessName,
      businessType,
      businessRegistrationNo,
      gstNo,
      description,
      operatingHours,
      vendorType,
      hotelDetails,
      transportDetails,
      activityDetails,
      foodDetails,
      eventDetails,
      bankDetails
    } = req.body;

    // Validate required fields
    if (!name || !email || !businessName) {
      return res.status(400).json({
        status: false,
        message: "Name, email, and business name are required"
      });
    }

    // Create vendor data object
    const vendorData = {
      name,
      address,
      email,
      phone: phone || "",
      typeOfId,
      idNumber,
      businessName,
      businessType,
      vendorType: vendorType || 'other',
      hotelDetails: hotelDetails || {},
      transportDetails: transportDetails || {},
      activityDetails: activityDetails || {},
      foodDetails: foodDetails || {},
      eventDetails: eventDetails || {},
      businessRegistrationNo,
      gstNo,
      description,
      operatingHours,
      bankDetails: bankDetails || {}
    };

    // Handle file uploads from middleware
    if (req.imageUrls) {
      if (req.imageUrls.companyLogo) {
        vendorData.companyLogo = {
          path: req.imageUrls.companyLogo,
        };
      }
      if (req.imageUrls.businessProof) {
        vendorData.businessProof = {
          path: req.imageUrls.businessProof,
        };
      }
      if (req.imageUrls.vendorGovernmentId) {
        vendorData.vendorGovernmentId = {
          path: req.imageUrls.vendorGovernmentId,
        };
      }
      if (req.imageUrls.aadhaarCard) {
        vendorData.aadhaarCard = {
          path: req.imageUrls.aadhaarCard,
        };
      }
      if (req.imageUrls.panCard) {
        vendorData.panCard = {
          path: req.imageUrls.panCard,
        };
      }
      if (req.imageUrls.license) {
        vendorData.license = {
          path: req.imageUrls.license,
        };
      }
      if (req.imageUrls.gstCertificate) {
        vendorData.gstCertificate = {
          path: req.imageUrls.gstCertificate,
        };
      }
      if (req.imageUrls.certificate) {
        vendorData.certificate = {
          path: req.imageUrls.certificate,
        };
      }
      if (req.imageUrls.otherDocument) {
        vendorData.otherDocument = {
          path: req.imageUrls.otherDocument,
        };
      }
      if (req.imageUrls.image) {
        vendorData.image = req.imageUrls.image;
      }
    }

    // Save vendor in database
    const newVendor = await Vendor.create(vendorData);

    // Clean response (remove sensitive data)
    const vendorResponse = newVendor.toObject();
    delete vendorResponse.password;

    return res.status(201).json({
      status: true,
      message: "Vendor created successfully",
      data: vendorResponse
    });

  } catch (error) {
    console.error("Error creating vendor:", error);
    return res.status(500).json({
      status: false,
      message: "Error creating vendor",
      error: error.message,
    });
  }
};

export { AddUser, deleteVendor, updateVendor, showVendors, changeDefaultPassword, updateVendorStatus, setVendor };