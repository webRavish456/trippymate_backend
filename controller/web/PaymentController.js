import Razorpay from "razorpay";
import crypto from "crypto";
import Booking from "../../models/BookingModel.js";
import Packages from "../../models/PackageModel.js";
import Coupon from "../../models/CouponModel.js";
import PromoCode from "../../models/PromoCodeModel.js";
import User from "../../models/UserModel.js";
import Slot from "../../models/SlotModel.js";
import Captain from "../../models/CaptainModel.js";
import moment from "moment-timezone";

// Initialize Razorpay only if credentials are available
let razorpay = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  } else {
    console.warn("Razorpay credentials not found. Payment functionality will be disabled.");
  }
} catch (error) {
  console.error("Error initializing Razorpay:", error.message);
  razorpay = null;
}

// Calculate booking amount based on guest details and package prices
const calculateBookingAmount = (guestDetails, packageData) => {
  let totalAmount = 0;
  const adultPrice = packageData?.price?.adult || packageData?.price || 0;
  const childPrice = packageData?.price?.child || 0;

  guestDetails?.forEach((guest) => {
    if (guest.guestAge > 18) {
      totalAmount += adultPrice;
    } else if (guest.guestAge >= 5) {
      totalAmount += childPrice;
    }
    // Age < 5: Free (no infant pricing)
  });

  return totalAmount;
};

// Calculate discount from coupon or promo code
const calculateDiscount = async (baseAmount, couponCode, promoCode, userId) => {
  let discountAmount = 0;
  let couponId = null;
  let promoId = null;

  // Apply coupon code if provided
  if (couponCode) {
    const coupon = await Coupon.findOne({ 
      code: couponCode.toUpperCase().trim(),
      status: 'active'
    });

    if (coupon) {
      const now = new Date();
      if (now >= new Date(coupon.validFrom) && now <= new Date(coupon.validUntil)) {
        if (baseAmount >= coupon.minBookingAmount) {
          // Check if user has already used this coupon
          const userBookings = await Booking.find({ 
            userId,
            couponCode: coupon._id,
            paymentStatus: 'completed'
          });

          if (userBookings.length < coupon.userLimit) {
            if (coupon.discountType === 'percentage') {
              discountAmount = (baseAmount * coupon.discountValue) / 100;
              if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
                discountAmount = coupon.maxDiscountAmount;
              }
            } else {
              discountAmount = coupon.discountValue;
              if (discountAmount > baseAmount) {
                discountAmount = baseAmount;
              }
            }
            couponId = coupon._id;
          }
        }
      }
    }
  }

  // Apply promo code if provided (only if coupon not applied)
  if (!couponId && promoCode) {
    const promo = await PromoCode.findOne({ 
      code: promoCode.toUpperCase().trim(),
      status: 'active'
    });

    if (promo) {
      const now = new Date();
      if (now >= new Date(promo.validFrom) && now <= new Date(promo.validUntil)) {
        if (baseAmount >= promo.minBookingAmount) {
          // Check if user has already used this promo code
          const userBookings = await Booking.find({ 
            userId,
            promoCode: promo._id,
            paymentStatus: 'completed'
          });

          if (userBookings.length < promo.userLimit) {
            if (promo.discountType === 'percentage') {
              const promoDiscount = (baseAmount * promo.discountValue) / 100;
              if (promo.maxDiscountAmount && promoDiscount > promo.maxDiscountAmount) {
                discountAmount = promo.maxDiscountAmount;
              } else {
                discountAmount = promoDiscount;
              }
            } else {
              discountAmount = promo.discountValue;
              if (discountAmount > baseAmount) {
                discountAmount = baseAmount;
              }
            }
            promoId = promo._id;
          }
        }
      }
    }
  }

  return { discountAmount, couponId, promoId };
};

// Create Razorpay Order
export const createPaymentOrder = async (req, res) => {
  try {
    // Check if Razorpay is configured
    if (!razorpay) {
      return res.status(500).json({
        status: false,
        message: "Payment gateway not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.",
      });
    }

    const { packageId, userId, guestDetails, tripdate, couponCode, promoCode, captainId } = req.body;

    // Validate required fields
    if (!packageId || !userId || !guestDetails || guestDetails.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Package ID, User ID, and Guest Details are required"
      });
    }

    // Get package details
    const packageData = await Packages.findById(packageId);
    if (!packageData) {
      return res.status(404).json({
        status: false,
        message: "Package not found"
      });
    }

    // Check package availability before creating order
    if (packageData.status !== "active") {
      return res.status(400).json({
        status: false,
        message: "Package is not available for booking"
      });
    }

    // Check package slot availability
    if (tripdate) {
      const formattedTripDate = moment(tripdate).startOf("day").toDate();
      const guestCount = guestDetails?.length || 0;

      const availableSlots = await Slot.find({
        packageId,
        tripDate: {
          $gte: moment(formattedTripDate).startOf("day").toDate(),
          $lte: moment(formattedTripDate).endOf("day").toDate(),
        },
        status: { $in: ["available", "full"] },
      })
        .populate("bookings")
        .lean();

      let totalAvailableSlots = 0;
      availableSlots.forEach((slot) => {
        const activeBookings = slot.bookings.filter(
          (b) => b.paymentStatus === "completed" && b.status === "Active"
        );
        let slotParticipants = 0;
        activeBookings.forEach((booking) => {
          slotParticipants += booking.guestDetails?.length || 0;
        });
        const availableInSlot = slot.maxSlots - slotParticipants;
        totalAvailableSlots += availableInSlot;
      });

      if (totalAvailableSlots < guestCount) {
        return res.status(400).json({
          status: false,
          message: `Not enough slots available. Only ${totalAvailableSlots} slots available, but ${guestCount} guests requested.`,
        });
      }
    }

    // Check captain availability if captainId is provided
    if (captainId) {
      const captain = await Captain.findById(captainId);
      if (!captain) {
        return res.status(404).json({
          status: false,
          message: "Captain not found"
        });
      }

      if (captain.status !== "active") {
        return res.status(400).json({
          status: false,
          message: "Selected captain is not available"
        });
      }

      // Check if captain has existing bookings for this date range
      if (tripdate) {
        const startDate = moment(tripdate).startOf("day").toDate();
        const days = packageData.duration ? parseInt(packageData.duration.split(" ")[0]) || 1 : 1;
        const endDate = moment(tripdate).add(days - 1, "days").endOf("day").toDate();

        const existingBookings = await Booking.find({
          captainId,
          status: "Active",
          paymentStatus: "completed",
          tripdate: {
            $gte: startDate,
            $lte: endDate,
          },
        });

        if (existingBookings.length > 0) {
          return res.status(400).json({
            status: false,
            message: "Selected captain is already booked for this period"
          });
        }
      }
    }

    // Calculate base amount
    const baseAmount = calculateBookingAmount(guestDetails, packageData);

    if (baseAmount <= 0) {
      return res.status(400).json({
        status: false,
        message: "Invalid booking amount"
      });
    }

    // Calculate discount
    const { discountAmount, couponId, promoId } = await calculateDiscount(
      baseAmount,
      couponCode,
      promoCode,
      userId
    );

    // Calculate final amount (in paise for Razorpay)
    const finalAmount = Math.max(0, baseAmount - discountAmount);
    const amountInPaise = Math.round(finalAmount * 100);

    // Create Razorpay order
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `booking_${Date.now()}`,
      notes: {
        packageId: packageId.toString(),
        userId: userId.toString(),
        baseAmount: baseAmount.toString(),
        discountAmount: discountAmount.toString(),
        finalAmount: finalAmount.toString(),
        couponCode: couponCode || "",
        promoCode: promoCode || "",
      },
    };

    const order = await razorpay.orders.create(options);

    // Return order details
    return res.status(200).json({
      status: true,
      message: "Payment order created successfully",
      data: {
        orderId: order.id,
        amount: amountInPaise,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
        baseAmount,
        discountAmount,
        finalAmount,
        couponId,
        promoId,
      },
    });
  } catch (error) {
    console.error("Create payment order error:", error);
    return res.status(500).json({
      status: false,
      message: "Error creating payment order",
      error: error.message,
    });
  }
};

// Verify Payment and Create Booking
export const verifyPayment = async (req, res) => {
  try {
    // Check if Razorpay is configured
    if (!razorpay) {
      return res.status(500).json({
        status: false,
        message: "Payment gateway not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.",
      });
    }

    const {
      orderId,
      paymentId,
      signature,
      packageId,
      userId,
      guestDetails,
      tripdate,
      couponCode,
      promoCode,
      destinationId,
      destinationName,
      maxSlots,
      captainId,
    } = req.body;

    // Validate required fields
    if (!orderId || !paymentId || !signature || !packageId || !userId || !guestDetails) {
      return res.status(400).json({
        status: false,
        message: "All payment and booking details are required",
      });
    }

    // Verify payment signature
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({
        status: false,
        message: "Invalid payment signature",
      });
    }

    // Get package details
    const packageData = await Packages.findById(packageId);
    if (!packageData) {
      return res.status(404).json({
        status: false,
        message: "Package not found",
      });
    }

    // Check package availability
    if (packageData.status !== "active") {
      return res.status(400).json({
        status: false,
        message: "Package is not available for booking",
      });
    }

    // Check package slot availability
    const formattedTripDate = tripdate ? moment(tripdate).startOf("day").toDate() : moment().startOf("day").toDate();
    const guestCount = guestDetails?.length || 0;

    const availableSlots = await Slot.find({
      packageId,
      tripDate: {
        $gte: moment(formattedTripDate).startOf("day").toDate(),
        $lte: moment(formattedTripDate).endOf("day").toDate(),
      },
      status: { $in: ["available", "full"] },
    })
      .populate("bookings")
      .lean();

    let totalAvailableSlots = 0;
    availableSlots.forEach((slot) => {
      const activeBookings = slot.bookings.filter(
        (b) => b.paymentStatus === "completed" && b.status === "Active"
      );
      let slotParticipants = 0;
      activeBookings.forEach((booking) => {
        slotParticipants += booking.guestDetails?.length || 0;
      });
      const availableInSlot = slot.maxSlots - slotParticipants;
      totalAvailableSlots += availableInSlot;
    });

    if (totalAvailableSlots < guestCount) {
      return res.status(400).json({
        status: false,
        message: `Not enough slots available. Only ${totalAvailableSlots} slots available, but ${guestCount} guests requested.`,
      });
    }

    // Check captain availability if captainId is provided
    if (captainId) {
      const captain = await Captain.findById(captainId);
      if (!captain) {
        return res.status(404).json({
          status: false,
          message: "Captain not found",
        });
      }

      if (captain.status !== "active") {
        return res.status(400).json({
          status: false,
          message: "Selected captain is not available",
        });
      }

      // Check if captain has existing bookings for this date range
      const startDate = moment(formattedTripDate).startOf("day").toDate();
      const days = packageData.duration ? parseInt(packageData.duration.split(" ")[0]) || 1 : 1;
      const endDate = moment(formattedTripDate).add(days - 1, "days").endOf("day").toDate();

      const existingBookings = await Booking.find({
        captainId,
        status: "Active",
        paymentStatus: "completed",
        tripdate: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      if (existingBookings.length > 0) {
        return res.status(400).json({
          status: false,
          message: "Selected captain is already booked for this period",
        });
      }
    }

    // Calculate amounts
    const baseAmount = calculateBookingAmount(guestDetails, packageData);
    const { discountAmount, couponId, promoId } = await calculateDiscount(
      baseAmount,
      couponCode,
      promoCode,
      userId
    );
    const finalAmount = Math.max(0, baseAmount - discountAmount);

    // Verify payment with Razorpay
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      
      if (payment.status !== "captured" && payment.status !== "authorized") {
        return res.status(400).json({
          status: false,
          message: "Payment not successful",
        });
      }
    } catch (error) {
      return res.status(400).json({
        status: false,
        message: "Payment verification failed",
        error: error.message,
      });
    }

    // Get contact details from request
    const contactName = req.body.contactName || '';
    const contactPhone = req.body.contactPhone || '';
    const contactAddress = req.body.contactAddress || '';

    // Generate booking ID
    const bookingId = `BK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create booking
    const booking = await Booking.create({
      packageId,
      userId,
      guestDetails,
      tripdate: tripdate ? new Date(tripdate) : new Date(),
      status: "Active",
      couponCode: couponId,
      promoCode: promoId,
      discountAmount,
      baseAmount,
      finalAmount,
      totalAmount: finalAmount,
      paymentStatus: "completed",
      paymentId,
      orderId,
      paymentMethod: "razorpay",
      destinationId: destinationId || null,
      captainId: captainId || null,
      contactName,
      contactPhone,
      contactAddress,
      bookingId
    });

    // Update coupon/promo code usage count
    if (couponId) {
      await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
    }
    if (promoId) {
      await PromoCode.findByIdAndUpdate(promoId, { $inc: { usedCount: 1 } });
    }

    // Auto-join slot if slotId is provided (for joining existing slots)
    // Or create slot if destinationId is provided (for new slot creation)
    let slotInfo = null;
    const { slotId } = req.body; // If joining existing slot
    
    if (slotId) {
      // Join existing slot
      try {
        const slot = await Slot.findById(slotId);
        if (slot && slot.isAvailable()) {
          slot.addBooking(booking._id);
          await slot.save();
          booking.slotId = slot._id;
          booking.destinationId = slot.destinationId;
          await booking.save();
          
          slotInfo = {
            slotId: slot._id,
            slotName: slot.slotName,
            currentBookings: slot.currentBookings,
            maxSlots: slot.maxSlots,
            availableSlots: slot.maxSlots - slot.currentBookings,
            status: slot.status,
            message: "Joined existing slot",
          };
        }
      } catch (slotError) {
        console.error("Error joining slot:", slotError);
      }
    } else if (destinationId && destinationName && tripdate) {
      // Auto-create or join slot if destinationId is provided (legacy support)
      try {
        const formattedTripDate = moment(tripdate).startOf("day").toDate();

        // Find existing available slot
        let slot = await Slot.findOne({
          packageId,
          destinationId,
          tripDate: {
            $gte: moment(formattedTripDate).startOf("day").toDate(),
            $lte: moment(formattedTripDate).endOf("day").toDate(),
          },
          status: "available",
        });

        if (slot && slot.isAvailable()) {
          // Join existing slot
          slot.addBooking(booking._id);
          await slot.save();
          booking.slotId = slot._id;
          await booking.save();
          slotInfo = {
            slotId: slot._id,
            slotName: slot.slotName,
            currentBookings: slot.currentBookings,
            maxSlots: slot.maxSlots,
            availableSlots: slot.maxSlots - slot.currentBookings,
            status: slot.status,
            message: "Joined existing slot",
          };
        }
      } catch (slotError) {
        console.error("Error creating/joining slot:", slotError);
        // Don't fail the booking if slot creation fails
      }
    }

    return res.status(201).json({
      status: true,
      message: "Booking created successfully",
      data: {
        ...booking.toObject(),
        slotInfo,
      },
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({
      status: false,
      message: "Error verifying payment and creating booking",
      error: error.message,
    });
  }
};

