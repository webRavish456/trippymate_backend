import PromoCode from "../../../models/PromoCodeModel.js";

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
      userLimit: userLimit || 1,
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

    // Check user limit
    if (userId && promoCode.userLimit) {
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

