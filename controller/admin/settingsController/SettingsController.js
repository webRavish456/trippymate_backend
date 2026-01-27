import Settings from "../../../models/SettingsModel.js";

// Get Email Settings
export const getEmailSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    return res.status(200).json({
      status: true,
      message: "Email settings fetched successfully",
      data: settings.emailSettings || {
        smtpHost: "",
        smtpPort: "",
        smtpUser: "",
        smtpPassword: "",
        fromEmail: "",
        enabled: false
      }
    });
  } catch (error) {
    console.error("GetEmailSettings error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching email settings",
      error: error.message
    });
  }
};

// Save Email Settings
export const saveEmailSettings = async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPassword, fromEmail, enabled } = req.body;

    const settings = await Settings.getSettings();
    
    settings.emailSettings = {
      smtpHost: smtpHost || "",
      smtpPort: smtpPort || "",
      smtpUser: smtpUser || "",
      smtpPassword: smtpPassword || "",
      fromEmail: fromEmail || "",
      enabled: enabled !== undefined ? enabled : false
    };

    await settings.save();

    return res.status(200).json({
      status: true,
      message: "Email settings saved successfully",
      data: settings.emailSettings
    });
  } catch (error) {
    console.error("SaveEmailSettings error:", error);
    return res.status(500).json({
      status: false,
      message: "Error saving email settings",
      error: error.message
    });
  }
};

// Get Razorpay Settings
export const getRazorpaySettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    return res.status(200).json({
      status: true,
      message: "Razorpay settings fetched successfully",
      data: settings.razorpaySettings || {
        keyId: "",
        keySecret: "",
        enabled: false
      }
    });
  } catch (error) {
    console.error("GetRazorpaySettings error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching Razorpay settings",
      error: error.message
    });
  }
};

// Save Razorpay Settings
export const saveRazorpaySettings = async (req, res) => {
  try {
    const { keyId, keySecret, enabled } = req.body;

    const settings = await Settings.getSettings();
    
    settings.razorpaySettings = {
      keyId: keyId || "",
      keySecret: keySecret || "",
      enabled: enabled !== undefined ? enabled : false
    };

    await settings.save();

    return res.status(200).json({
      status: true,
      message: "Razorpay settings saved successfully",
      data: settings.razorpaySettings
    });
  } catch (error) {
    console.error("SaveRazorpaySettings error:", error);
    return res.status(500).json({
      status: false,
      message: "Error saving Razorpay settings",
      error: error.message
    });
  }
};

// Get All Settings (for admin)
export const getAllSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    return res.status(200).json({
      status: true,
      message: "Settings fetched successfully",
      data: {
        emailSettings: settings.emailSettings || {
          smtpHost: "",
          smtpPort: "",
          smtpUser: "",
          smtpPassword: "",
          fromEmail: "",
          enabled: false
        },
        razorpaySettings: settings.razorpaySettings || {
          keyId: "",
          keySecret: "",
          enabled: false
        }
      }
    });
  } catch (error) {
    console.error("GetAllSettings error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching settings",
      error: error.message
    });
  }
};
