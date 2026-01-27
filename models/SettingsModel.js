import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema({
  // Email Settings
  emailSettings: {
    smtpHost: {
      type: String,
      default: ""
    },
    smtpPort: {
      type: String,
      default: ""
    },
    smtpUser: {
      type: String,
      default: ""
    },
    smtpPassword: {
      type: String,
      default: ""
    },
    fromEmail: {
      type: String,
      default: ""
    },
    enabled: {
      type: Boolean,
      default: false
    }
  },
  // Razorpay Settings
  razorpaySettings: {
    keyId: {
      type: String,
      default: ""
    },
    keySecret: {
      type: String,
      default: ""
    },
    enabled: {
      type: Boolean,
      default: false
    }
  }
}, { timestamps: true });

// Ensure only one settings document exists
SettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Settings = mongoose.model("Settings", SettingsSchema);

export default Settings;
