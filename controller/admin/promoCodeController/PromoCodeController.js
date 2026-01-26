import PromoCode from "../../../models/PromoCodeModel.js";
import Booking from "../../../models/BookingModel.js";

// Add Promo Code
export const AddPromoCode = async (req, res) => {
  try {
    const {
      code,
      title,
      description,
      discountType,
      discountValue,
      minBookingAmount,
      maxDiscountAmount,
      validFrom,
      validUntil,
      userLimit,
      oneTimeUser,
      status
    } = req.body;

    // Validation
    if (!code || !title || !discountType || !discountValue || !validFrom || !validUntil) {
      return res.status(400).json({
        status: false,
        message: "Please provide all required fields"
      });
    }

    // Check if promo code already exists
    const existingPromo = await PromoCode.findOne({ code: code.toUpperCase() });
    if (existingPromo) {
      return res.status(400).json({
        status: false,
        message: "Promo code already exists"
      });
    }

    // Handle oneTimeUser boolean or userLimit number
    let finalUserLimit = 1;
    if (oneTimeUser !== undefined) {
      // true = 1 (one time only), false = null (unlimited)
      finalUserLimit = oneTimeUser === true ? 1 : null;
    } else if (userLimit !== undefined) {
      finalUserLimit = userLimit;
    }

    const newPromoCode = new PromoCode({
      code: code.toUpperCase(),
      title,
      description: description || "",
      discountType,
      discountValue,
      minBookingAmount: minBookingAmount || 0,
      maxDiscountAmount: maxDiscountAmount || null,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      userLimit: finalUserLimit,
      status: status || 'active',
      createdBy: req.user?.id || req.user?._id || null
    });

    await newPromoCode.save();

    return res.status(201).json({
      status: true,
      message: "Promo code created successfully",
      data: newPromoCode
    });
  } catch (error) {
    console.error("AddPromoCode error:", error);
    return res.status(500).json({
      status: false,
      message: "Error creating promo code",
      error: error.message
    });
  }
};

// Get All Promo Codes
export const GetAllPromoCodes = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const promoCodes = await PromoCode.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PromoCode.countDocuments(query);

    return res.status(200).json({
      status: true,
      message: "Promo codes fetched successfully",
      data: {
        promoCodes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error("GetAllPromoCodes error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching promo codes",
      error: error.message
    });
  }
};

// Get Promo Code By ID
export const GetPromoCodeById = async (req, res) => {
  try {
    const { id } = req.params;

    const promoCode = await PromoCode.findById(id)
      .populate('createdBy', 'name email');

    if (!promoCode) {
      return res.status(404).json({
        status: false,
        message: "Promo code not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Promo code fetched successfully",
      data: promoCode
    });
  } catch (error) {
    console.error("GetPromoCodeById error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching promo code",
      error: error.message
    });
  }
};

// Update Promo Code
export const UpdatePromoCode = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If code is being updated, check for duplicates
    if (updateData.code) {
      const existingPromo = await PromoCode.findOne({ 
        code: updateData.code.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingPromo) {
        return res.status(400).json({
          status: false,
          message: "Promo code already exists"
        });
      }
      updateData.code = updateData.code.toUpperCase();
    }

    // Handle oneTimeUser boolean conversion
    if (updateData.oneTimeUser !== undefined) {
      // true = 1 (one time only), false = null (unlimited)
      updateData.userLimit = updateData.oneTimeUser === true ? 1 : null;
      delete updateData.oneTimeUser;
    }

    // Convert date strings to Date objects
    if (updateData.validFrom) {
      updateData.validFrom = new Date(updateData.validFrom);
    }
    if (updateData.validUntil) {
      updateData.validUntil = new Date(updateData.validUntil);
    }

    const promoCode = await PromoCode.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email');

    if (!promoCode) {
      return res.status(404).json({
        status: false,
        message: "Promo code not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Promo code updated successfully",
      data: promoCode
    });
  } catch (error) {
    console.error("UpdatePromoCode error:", error);
    return res.status(500).json({
      status: false,
      message: "Error updating promo code",
      error: error.message
    });
  }
};

// Delete Promo Code
export const DeletePromoCode = async (req, res) => {
  try {
    const { id } = req.params;

    const promoCode = await PromoCode.findByIdAndDelete(id);

    if (!promoCode) {
      return res.status(404).json({
        status: false,
        message: "Promo code not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Promo code deleted successfully"
    });
  } catch (error) {
    console.error("DeletePromoCode error:", error);
    return res.status(500).json({
      status: false,
      message: "Error deleting promo code",
      error: error.message
    });
  }
};

// Verify Promo Code (for frontend use)
export const VerifyPromoCode = async (req, res) => {
  try {
    const { code, amount, userId } = req.body;

    if (!code || !amount) {
      return res.status(400).json({
        status: false,
        message: "Promo code and amount are required"
      });
    }

    const promoCode = await PromoCode.findOne({ 
      code: code.toUpperCase(),
      status: 'active'
    });

    if (!promoCode) {
      return res.status(404).json({
        status: false,
        message: "Invalid promo code"
      });
    }

    // Check validity dates
    const now = new Date();
    if (now < promoCode.validFrom || now > promoCode.validUntil) {
      return res.status(400).json({
        status: false,
        message: "Promo code has expired or is not yet valid"
      });
    }

    // Check minimum booking amount
    if (amount < promoCode.minBookingAmount) {
      return res.status(400).json({
        status: false,
        message: `Minimum booking amount of ₹${promoCode.minBookingAmount} required`
      });
    }

    // Check user limit (skip if userLimit is null = unlimited)
    if (userId && promoCode.userLimit !== null && promoCode.userLimit > 0) {
      const Booking = (await import("../../../models/BookingModel.js")).default;
      const userBookings = await Booking.countDocuments({
        promoCode: promoCode._id,
        userId: userId
      });
      
      if (userBookings >= promoCode.userLimit) {
        return res.status(400).json({
          status: false,
          message: `You have already used this promo code. Maximum ${promoCode.userLimit} use${promoCode.userLimit > 1 ? 's' : ''} allowed per user.`
        });
      }
    }

    // Calculate discount
    let discount = 0;
    if (promoCode.discountType === 'percentage') {
      discount = (amount * promoCode.discountValue) / 100;
      if (promoCode.maxDiscountAmount) {
        discount = Math.min(discount, promoCode.maxDiscountAmount);
      }
    } else {
      discount = promoCode.discountValue;
    }

    return res.status(200).json({
      status: true,
      message: "Promo code is valid",
      data: {
        promoCode: {
          code: promoCode.code,
          title: promoCode.title,
          discountType: promoCode.discountType,
          discountValue: promoCode.discountValue
        },
        discount,
        finalAmount: amount - discount
      }
    });
  } catch (error) {
    console.error("VerifyPromoCode error:", error);
    return res.status(500).json({
      status: false,
      message: "Error verifying promo code",
      error: error.message
    });
  }
};

// Get Customer-Promo Usage Analytics
export const GetCustomerPromoUsage = async (req, res) => {
  try {
    const bookings = await Booking.find({ promoCode: { $exists: true, $ne: null } })
      .populate('userId', 'name email phone')
      .populate('promoCode', 'code title')
      .populate('packageId', 'name title')
      .sort({ createdAt: -1 });

    // Group by customer and promo
    const customerPromoMap = new Map();
    
    bookings.forEach(booking => {
      if (booking.userId && booking.promoCode) {
        const key = `${booking.userId._id}-${booking.promoCode._id}`;
        if (!customerPromoMap.has(key)) {
          customerPromoMap.set(key, {
            customerId: booking.userId._id,
            customerName: booking.userId.name || booking.userId.email || 'Unknown',
            customerEmail: booking.userId.email || 'N/A',
            promoCode: booking.promoCode.code,
            promoTitle: booking.promoCode.title || 'N/A',
            usageCount: 0
          });
        }
        customerPromoMap.get(key).usageCount++;
      }
    });

    const data = Array.from(customerPromoMap.values());

    return res.status(200).json({
      status: true,
      message: "Customer-Promo usage data fetched successfully",
      data: data
    });
  } catch (error) {
    console.error("GetCustomerPromoUsage error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching customer-promo usage data",
      error: error.message
    });
  }
};

// Get Promo-Package Usage Analytics
export const GetPromoPackageUsage = async (req, res) => {
  try {
    const bookings = await Booking.find({ promoCode: { $exists: true, $ne: null } })
      .populate('promoCode', 'code title')
      .populate('packageId', 'name title')
      .sort({ createdAt: -1 });

    // Group by promo and package
    const promoPackageMap = new Map();
    
    bookings.forEach(booking => {
      if (booking.promoCode && booking.packageId) {
        const key = `${booking.promoCode._id}-${booking.packageId._id}`;
        if (!promoPackageMap.has(key)) {
          promoPackageMap.set(key, {
            promoCode: booking.promoCode.code,
            promoTitle: booking.promoCode.title || 'N/A',
            packageId: booking.packageId._id,
            packageName: booking.packageId.name || booking.packageId.title || 'N/A',
            usageCount: 0
          });
        }
        promoPackageMap.get(key).usageCount++;
      }
    });

    const data = Array.from(promoPackageMap.values());

    return res.status(200).json({
      status: true,
      message: "Promo-Package usage data fetched successfully",
      data: data
    });
  } catch (error) {
    console.error("GetPromoPackageUsage error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching promo-package usage data",
      error: error.message
    });
  }
};

// Get Package-Promo Usage Analytics
export const GetPackagePromoUsage = async (req, res) => {
  try {
    const bookings = await Booking.find({ promoCode: { $exists: true, $ne: null } })
      .populate('packageId', 'name title')
      .populate('promoCode', 'code title')
      .sort({ createdAt: -1 });

    // Group by package and promo
    const packagePromoMap = new Map();
    
    bookings.forEach(booking => {
      if (booking.packageId && booking.promoCode) {
        const key = `${booking.packageId._id}-${booking.promoCode._id}`;
        if (!packagePromoMap.has(key)) {
          packagePromoMap.set(key, {
            packageId: booking.packageId._id,
            packageName: booking.packageId.name || booking.packageId.title || 'N/A',
            promoCode: booking.promoCode.code,
            promoTitle: booking.promoCode.title || 'N/A',
            usageCount: 0
          });
        }
        packagePromoMap.get(key).usageCount++;
      }
    });

    const data = Array.from(packagePromoMap.values());

    return res.status(200).json({
      status: true,
      message: "Package-Promo usage data fetched successfully",
      data: data
    });
  } catch (error) {
    console.error("GetPackagePromoUsage error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching package-promo usage data",
      error: error.message
    });
  }
};

