import Coupon from "../../../models/CouponModel.js";
import Booking from "../../../models/BookingModel.js";

// Add Coupon
export const AddCoupon = async (req, res) => {
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

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        status: false,
        message: "Coupon code already exists"
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

    const newCoupon = new Coupon({
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

    await newCoupon.save();

    return res.status(201).json({
      status: true,
      message: "Coupon created successfully",
      data: newCoupon
    });
  } catch (error) {
    console.error("AddCoupon error:", error);
    return res.status(500).json({
      status: false,
      message: "Error creating coupon",
      error: error.message
    });
  }
};

// Get All Coupons
export const GetAllCoupons = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const coupons = await Coupon.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Coupon.countDocuments(query);

    return res.status(200).json({
      status: true,
      message: "Coupons fetched successfully",
      data: {
        coupons,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error("GetAllCoupons error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching coupons",
      error: error.message
    });
  }
};

// Get Coupon By ID
export const GetCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id)
      .populate('createdBy', 'name email');

    if (!coupon) {
      return res.status(404).json({
        status: false,
        message: "Coupon not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Coupon fetched successfully",
      data: coupon
    });
  } catch (error) {
    console.error("GetCouponById error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching coupon",
      error: error.message
    });
  }
};

// Get Coupon Usage Details
export const GetCouponUsageDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        status: false,
        message: "Coupon not found"
      });
    }

    // Get all bookings that used this coupon
    const bookings = await Booking.find({ couponCode: id })
      .populate('userId', 'name email phone')
      .populate('packageId', 'title destination')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalUsage = bookings.length;
    const totalDiscountGiven = bookings.reduce((sum, booking) => sum + (booking.discountAmount || 0), 0);
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.finalAmount || 0), 0);

    // Group by user
    const userUsage = {};
    bookings.forEach(booking => {
      const userId = booking.userId?._id?.toString() || 'unknown';
      if (!userUsage[userId]) {
        userUsage[userId] = {
          user: booking.userId,
          count: 0,
          totalDiscount: 0,
          bookings: []
        };
      }
      userUsage[userId].count++;
      userUsage[userId].totalDiscount += booking.discountAmount || 0;
      userUsage[userId].bookings.push(booking);
    });

    // Group by package
    const packageUsage = {};
    bookings.forEach(booking => {
      const packageId = booking.packageId?._id?.toString() || 'unknown';
      if (!packageUsage[packageId]) {
        packageUsage[packageId] = {
          package: booking.packageId,
          count: 0,
          totalDiscount: 0,
          bookings: []
        };
      }
      packageUsage[packageId].count++;
      packageUsage[packageId].totalDiscount += booking.discountAmount || 0;
      packageUsage[packageId].bookings.push(booking);
    });

    return res.status(200).json({
      status: true,
      message: "Coupon usage details fetched successfully",
      data: {
        coupon,
        statistics: {
          totalUsage,
          totalDiscountGiven,
          totalRevenue
        },
        bookings,
        userUsage: Object.values(userUsage),
        packageUsage: Object.values(packageUsage)
      }
    });
  } catch (error) {
    console.error("GetCouponUsageDetails error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching coupon usage details",
      error: error.message
    });
  }
};

// Update Coupon
export const UpdateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If code is being updated, check for duplicates
    if (updateData.code) {
      const existingCoupon = await Coupon.findOne({ 
        code: updateData.code.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingCoupon) {
        return res.status(400).json({
          status: false,
          message: "Coupon code already exists"
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

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email');

    if (!coupon) {
      return res.status(404).json({
        status: false,
        message: "Coupon not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Coupon updated successfully",
      data: coupon
    });
  } catch (error) {
    console.error("UpdateCoupon error:", error);
    return res.status(500).json({
      status: false,
      message: "Error updating coupon",
      error: error.message
    });
  }
};

// Delete Coupon
export const DeleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({
        status: false,
        message: "Coupon not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Coupon deleted successfully"
    });
  } catch (error) {
    console.error("DeleteCoupon error:", error);
    return res.status(500).json({
      status: false,
      message: "Error deleting coupon",
      error: error.message
    });
  }
};

// Get Customer-Coupon Usage Analytics
export const GetCustomerCouponUsage = async (req, res) => {
  try {
    const bookings = await Booking.find({ couponCode: { $exists: true, $ne: null } })
      .populate('userId', 'name email phone')
      .populate('couponCode', 'code title')
      .populate('packageId', 'name title')
      .sort({ createdAt: -1 });

    // Group by customer and coupon
    const customerCouponMap = new Map();
    
    bookings.forEach(booking => {
      if (booking.userId && booking.couponCode) {
        const key = `${booking.userId._id}-${booking.couponCode._id}`;
        if (!customerCouponMap.has(key)) {
          customerCouponMap.set(key, {
            customerId: booking.userId._id,
            customerName: booking.userId.name || booking.userId.email || 'Unknown',
            customerEmail: booking.userId.email || 'N/A',
            couponCode: booking.couponCode.code,
            couponTitle: booking.couponCode.title || 'N/A',
            usageCount: 0
          });
        }
        customerCouponMap.get(key).usageCount++;
      }
    });

    const data = Array.from(customerCouponMap.values());

    return res.status(200).json({
      status: true,
      message: "Customer-Coupon usage data fetched successfully",
      data: data
    });
  } catch (error) {
    console.error("GetCustomerCouponUsage error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching customer-coupon usage data",
      error: error.message
    });
  }
};

// Get Coupon-Package Usage Analytics
export const GetCouponPackageUsage = async (req, res) => {
  try {
    const bookings = await Booking.find({ couponCode: { $exists: true, $ne: null } })
      .populate('couponCode', 'code title')
      .populate('packageId', 'name title')
      .sort({ createdAt: -1 });

    // Group by coupon and package
    const couponPackageMap = new Map();
    
    bookings.forEach(booking => {
      if (booking.couponCode && booking.packageId) {
        const key = `${booking.couponCode._id}-${booking.packageId._id}`;
        if (!couponPackageMap.has(key)) {
          couponPackageMap.set(key, {
            couponCode: booking.couponCode.code,
            couponTitle: booking.couponCode.title || 'N/A',
            packageId: booking.packageId._id,
            packageName: booking.packageId.name || booking.packageId.title || 'N/A',
            usageCount: 0
          });
        }
        couponPackageMap.get(key).usageCount++;
      }
    });

    const data = Array.from(couponPackageMap.values());

    return res.status(200).json({
      status: true,
      message: "Coupon-Package usage data fetched successfully",
      data: data
    });
  } catch (error) {
    console.error("GetCouponPackageUsage error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching coupon-package usage data",
      error: error.message
    });
  }
};

// Get Package-Coupon Usage Analytics
export const GetPackageCouponUsage = async (req, res) => {
  try {
    const bookings = await Booking.find({ couponCode: { $exists: true, $ne: null } })
      .populate('packageId', 'name title')
      .populate('couponCode', 'code title')
      .sort({ createdAt: -1 });

    // Group by package and coupon
    const packageCouponMap = new Map();
    
    bookings.forEach(booking => {
      if (booking.packageId && booking.couponCode) {
        const key = `${booking.packageId._id}-${booking.couponCode._id}`;
        if (!packageCouponMap.has(key)) {
          packageCouponMap.set(key, {
            packageId: booking.packageId._id,
            packageName: booking.packageId.name || booking.packageId.title || 'N/A',
            couponCode: booking.couponCode.code,
            couponTitle: booking.couponCode.title || 'N/A',
            usageCount: 0
          });
        }
        packageCouponMap.get(key).usageCount++;
      }
    });

    const data = Array.from(packageCouponMap.values());

    return res.status(200).json({
      status: true,
      message: "Package-Coupon usage data fetched successfully",
      data: data
    });
  } catch (error) {
    console.error("GetPackageCouponUsage error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching package-coupon usage data",
      error: error.message
    });
  }
};

// Verify Coupon (for frontend use)
export const VerifyCoupon = async (req, res) => {
  try {
    const { code, amount, userId } = req.body;

    if (!code || !amount) {
      return res.status(400).json({
        status: false,
        message: "Coupon code and amount are required"
      });
    }

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      status: 'active'
    });

    if (!coupon) {
      return res.status(404).json({
        status: false,
        message: "Invalid coupon code"
      });
    }

    // Check validity dates
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return res.status(400).json({
        status: false,
        message: "Coupon has expired or is not yet valid"
      });
    }

    // Check minimum booking amount
    if (amount < coupon.minBookingAmount) {
      return res.status(400).json({
        status: false,
        message: `Minimum booking amount of ₹${coupon.minBookingAmount} required`
      });
    }

    // Check user limit (one time use per user)
    if (userId && coupon.userLimit !== null && coupon.userLimit > 0) {
      const userBookings = await Booking.countDocuments({
        couponCode: coupon._id,
        userId: userId
      });
      
      if (userBookings >= coupon.userLimit) {
        return res.status(400).json({
          status: false,
          message: `You have already used this coupon. Maximum ${coupon.userLimit} use${coupon.userLimit > 1 ? 's' : ''} allowed per user.`
        });
      }
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (amount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    } else {
      discount = coupon.discountValue;
    }

    return res.status(200).json({
      status: true,
      message: "Coupon is valid",
      data: {
        coupon: {
          code: coupon.code,
          title: coupon.title,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue
        },
        discount,
        finalAmount: amount - discount
      }
    });
  } catch (error) {
    console.error("VerifyCoupon error:", error);
    return res.status(500).json({
      status: false,
      message: "Error verifying coupon",
      error: error.message
    });
  }
};
