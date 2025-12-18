import Slot from "../../models/SlotModel.js";
import Booking from "../../models/BookingModel.js";
import Packages from "../../models/PackageModel.js";
import Notification from "../../models/NotificationModel.js";
import SlotJoinRequest from "../../models/SlotJoinRequestModel.js";
import User from "../../models/UserModel.js";
import moment from "moment-timezone";

// Create Slot by Traveler with All Guest Details
export const createSlotByTraveler = async (req, res) => {
  try {
    const {
      packageId,
      destinationId,
      destinationName,
      tripDate,
      userId,
      guestDetails, // Array of all guest details (10-12 people)
      maxSlots,
      couponCode,
      promoCode,
    } = req.body;

    // Validation
    if (!packageId || !destinationId || !destinationName || !tripDate || !userId || !guestDetails) {
      return res.status(400).json({
        status: false,
        message: "Package ID, Destination ID, Destination Name, Trip Date, User ID, and Guest Details are required",
      });
    }

    if (!Array.isArray(guestDetails) || guestDetails.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Guest details must be an array with at least one guest",
      });
    }

    // Validate maxSlots matches guest count
    const guestCount = guestDetails.length;
    const slotCapacity = maxSlots || guestCount;
    
    if (guestCount > slotCapacity) {
      return res.status(400).json({
        status: false,
        message: `Guest count (${guestCount}) cannot exceed slot capacity (${slotCapacity})`,
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

    // Calculate booking amount
    const adultPrice = packageData?.price?.adult || packageData?.price || 0;
    const childPrice = packageData?.price?.child || 0;
    const infantPrice = packageData?.price?.infant || 0;

    let baseAmount = 0;
    guestDetails.forEach((guest) => {
      if (guest.guestAge > 18) {
        baseAmount += adultPrice;
      } else if (guest.guestAge >= 5) {
        baseAmount += childPrice;
      } else {
        baseAmount += infantPrice;
      }
    });

    // Calculate discount (if coupon/promo code provided)
    let discountAmount = 0;
    let couponId = null;
    let promoId = null;

    // Note: Discount calculation should be done in payment flow
    // This is just for slot creation

    const finalAmount = Math.max(0, baseAmount - discountAmount);

    // Format trip date
    const formattedTripDate = moment(tripDate).startOf("day").toDate();

    // Check if slot already exists for this package, destination, and date
    const existingSlot = await Slot.findOne({
      packageId,
      destinationId,
      tripDate: {
        $gte: moment(formattedTripDate).startOf("day").toDate(),
        $lte: moment(formattedTripDate).endOf("day").toDate(),
      },
      status: "available",
    });

    if (existingSlot) {
      return res.status(400).json({
        status: false,
        message: "A slot already exists for this package, destination, and date. You can join the existing slot instead.",
        existingSlotId: existingSlot._id,
      });
    }

    // Create slot number
    const slotNumber = await Slot.countDocuments({
      packageId,
      destinationId,
      tripDate: {
        $gte: moment(formattedTripDate).startOf("day").toDate(),
        $lte: moment(formattedTripDate).endOf("day").toDate(),
      },
    }) + 1;

    // Create initial booking for slot creator
    // Note: This booking should be created after payment verification
    // For now, we'll create a placeholder booking
    const initialBooking = await Booking.create({
      packageId,
      userId,
      guestDetails: guestDetails.map((guest) => ({
        ...guest,
        tripDate: formattedTripDate,
      })),
      tripdate: formattedTripDate,
      status: "Active",
      baseAmount,
      discountAmount,
      finalAmount,
      paymentStatus: "pending", // Will be updated after payment
      destinationId,
    });

    // Create slot
    const newSlot = await Slot.create({
      packageId,
      destinationId,
      destinationName,
      tripDate: formattedTripDate,
      maxSlots: slotCapacity,
      currentBookings: 1, // Creator's booking
      bookings: [initialBooking._id],
      status: guestCount >= slotCapacity ? "full" : "available",
      slotName: `Slot ${slotNumber} - ${destinationName}`,
      createdBy: userId,
      creatorBookingId: initialBooking._id,
      initialGuestDetails: guestDetails,
    });

    // Update booking with slotId
    initialBooking.slotId = newSlot._id;
    await initialBooking.save();

    // Send notifications to solo travelers who might be interested
    await notifySoloTravelersAboutNewSlot(newSlot, packageData);

    return res.status(201).json({
      status: true,
      message: "Slot created successfully. Complete payment to confirm your booking.",
      data: {
        slotId: newSlot._id,
        slotName: newSlot.slotName,
        bookingId: initialBooking._id,
        packageId: packageData._id,
        packageName: packageData.title,
        destinationName: newSlot.destinationName,
        tripDate: moment(newSlot.tripDate).tz("Asia/Kolkata").format("YYYY-MM-DD"),
        maxSlots: newSlot.maxSlots,
        currentBookings: newSlot.currentBookings,
        availableSlots: newSlot.maxSlots - newSlot.currentBookings,
        guestCount,
        baseAmount,
        finalAmount,
        status: newSlot.status,
        paymentRequired: true,
      },
    });
  } catch (error) {
    console.error("Create slot by traveler error:", error);
    return res.status(500).json({
      status: false,
      message: "Error creating slot",
      error: error.message,
    });
  }
};

// Notify Solo Travelers About New Slot
const notifySoloTravelersAboutNewSlot = async (slot, packageData) => {
  try {
    // Find users who:
    // 1. Have searched for similar packages/destinations
    // 2. Are solo travelers (have bookings with 1 guest)
    // 3. Have shown interest in this package or destination

    // Get all solo traveler bookings (1 guest) for similar packages
    const soloBookings = await Booking.find({
      guestDetails: { $size: 1 }, // Only 1 guest
      packageId: { $ne: slot.packageId }, // Different package but might be interested
      status: "Active",
      paymentStatus: "completed",
      slotId: null, // Not yet in a slot
    })
      .populate("userId")
      .limit(50); // Limit to avoid too many notifications

    // Also find users interested in same destination
    const destinationBookings = await Booking.find({
      destinationId: slot.destinationId,
      status: "Active",
      paymentStatus: "completed",
      slotId: null,
      _id: { $nin: soloBookings.map((b) => b._id) }, // Exclude already found
    })
      .populate("userId")
      .limit(50);

    // Combine and get unique users
    const allBookings = [...soloBookings, ...destinationBookings];
    const uniqueUserIds = [...new Set(allBookings.map((b) => b.userId?._id?.toString()).filter(Boolean))];

    // Create notifications
    const notifications = uniqueUserIds.map((userId) => ({
      userId,
      type: "slot_created",
      title: "New Slot Available!",
      message: `A new slot has been created for ${packageData.title} to ${slot.destinationName} on ${moment(slot.tripDate).tz("Asia/Kolkata").format("DD MMM YYYY")}. ${slot.maxSlots - slot.currentBookings} spots available. Join now!`,
      slotId: slot._id,
      packageId: slot.packageId,
      isRead: false,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`Sent ${notifications.length} notifications about new slot ${slot._id}`);
    }
  } catch (error) {
    console.error("Error notifying solo travelers:", error);
    // Don't fail slot creation if notification fails
  }
};

// Request to Join Slot (Requires Approval)
export const requestToJoinSlot = async (req, res) => {
  try {
    const { slotId, userId, guestDetails, bookingId, message } = req.body;

    if (!slotId || !userId || !guestDetails || !bookingId) {
      return res.status(400).json({
        status: false,
        message: "Slot ID, User ID, Guest Details, and Booking ID are required",
      });
    }

    const slot = await Slot.findById(slotId).populate("packageId").populate("createdBy");
    if (!slot) {
      return res.status(404).json({
        status: false,
        message: "Slot not found",
      });
    }

    if (!slot.isAvailable()) {
      return res.status(400).json({
        status: false,
        message: "Slot is full or closed",
      });
    }

    // Check booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        status: false,
        message: "Booking not found",
      });
    }

    // Check if user already in this slot
    const userAlreadyInSlot = slot.bookings.some(
      (bid) => bid.toString() === bookingId
    );
    if (userAlreadyInSlot) {
      return res.status(400).json({
        status: false,
        message: "You are already in this slot",
      });
    }

    // Check if there's already a pending request
    const existingRequest = await SlotJoinRequest.findOne({
      slotId,
      bookingId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        status: false,
        message: "You already have a pending request for this slot",
        requestId: existingRequest._id,
      });
    }

    // Check available slots
    const guestCount = Array.isArray(guestDetails) ? guestDetails.length : 1;
    const availableSlots = slot.maxSlots - slot.currentBookings;

    if (guestCount > availableSlots) {
      return res.status(400).json({
        status: false,
        message: `Only ${availableSlots} slot(s) available, but you're trying to add ${guestCount} guest(s)`,
      });
    }

    // Create join request
    const joinRequest = await SlotJoinRequest.create({
      slotId,
      requestedBy: userId,
      bookingId,
      guestDetails: Array.isArray(guestDetails) ? guestDetails : [guestDetails],
      guestCount,
      status: "pending",
      slotCreatorId: slot.createdBy._id || slot.createdBy,
      message: message || "",
    });

    // Get requester details
    const requester = await User.findById(userId);

    // Create notification for slot creator
    await Notification.create({
      userId: slot.createdBy._id || slot.createdBy,
      type: "slot_joined",
      title: "New Slot Join Request",
      message: `${requester?.name || "A traveler"} wants to join your slot "${slot.slotName}" with ${guestCount} guest(s). Please approve or decline.`,
      slotId: slot._id,
      bookingId: bookingId,
      isRead: false,
    });

    // TODO: Send email to slot creator
    // await sendSlotJoinRequestEmail(slot.createdBy, requester, slot, joinRequest);

    return res.status(201).json({
      status: true,
      message: "Join request sent successfully. Waiting for slot creator's approval.",
      data: {
        requestId: joinRequest._id,
        slotId: slot._id,
        slotName: slot.slotName,
        status: "pending",
        guestCount,
        availableSlots,
      },
    });
  } catch (error) {
    console.error("Request to join slot error:", error);
    return res.status(500).json({
      status: false,
      message: "Error creating join request",
      error: error.message,
    });
  }
};

// Approve Slot Join Request
export const approveSlotJoinRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { responseMessage } = req.body;
    const { userId } = req.body; // Slot creator's user ID

    const joinRequest = await SlotJoinRequest.findById(requestId)
      .populate("slotId")
      .populate("requestedBy")
      .populate("bookingId");

    if (!joinRequest) {
      return res.status(404).json({
        status: false,
        message: "Join request not found",
      });
    }

    // Verify that the user is the slot creator
    const slot = await Slot.findById(joinRequest.slotId);
    if (!slot) {
      return res.status(404).json({
        status: false,
        message: "Slot not found",
      });
    }

    if (slot.createdBy.toString() !== userId) {
      return res.status(403).json({
        status: false,
        message: "Only the slot creator can approve join requests",
      });
    }

    if (joinRequest.status !== "pending") {
      return res.status(400).json({
        status: false,
        message: `Request is already ${joinRequest.status}`,
      });
    }

    // Check if slot is still available
    if (!slot.isAvailable()) {
      joinRequest.status = "declined";
      joinRequest.responseMessage = "Slot is full";
      await joinRequest.save();

      return res.status(400).json({
        status: false,
        message: "Slot is full. Cannot approve request.",
      });
    }

    // Check available slots
    const availableSlots = slot.maxSlots - slot.currentBookings;
    if (joinRequest.guestCount > availableSlots) {
      joinRequest.status = "declined";
      joinRequest.responseMessage = "Not enough available slots";
      await joinRequest.save();

      return res.status(400).json({
        status: false,
        message: `Only ${availableSlots} slot(s) available, but request is for ${joinRequest.guestCount} guest(s)`,
      });
    }

    // Approve request - Add booking to slot
    slot.addBooking(joinRequest.bookingId);
    await slot.save();

    // Update booking
    const booking = await Booking.findById(joinRequest.bookingId);
    if (booking) {
      booking.slotId = slot._id;
      booking.destinationId = slot.destinationId;
      await booking.save();
    }

    // Update request status
    joinRequest.status = "approved";
    joinRequest.respondedAt = new Date();
    joinRequest.responseMessage = responseMessage || "Request approved. Welcome to the slot!";
    await joinRequest.save();

    // Notify requester
    await Notification.create({
      userId: joinRequest.requestedBy._id || joinRequest.requestedBy,
      type: "slot_joined",
      title: "Slot Join Request Approved!",
      message: `Your request to join "${slot.slotName}" has been approved. ${responseMessage || "Welcome to the slot!"}`,
      slotId: slot._id,
      bookingId: joinRequest.bookingId,
      isRead: false,
    });

    // TODO: Send email to requester
    // await sendSlotJoinApprovalEmail(joinRequest.requestedBy, slot, joinRequest);

    // If slot is now full, notify all members
    if (slot.status === "full") {
      const slotBookings = await Booking.find({ _id: { $in: slot.bookings } });
      const userIds = slotBookings.map((b) => b.userId).filter(Boolean);

      const fullNotifications = userIds.map((uid) => ({
        userId: uid,
        type: "slot_full",
        title: "Slot is Full!",
        message: `Your slot "${slot.slotName}" is now full. Get ready for your trip!`,
        slotId: slot._id,
        isRead: false,
      }));

      await Notification.insertMany(fullNotifications);
    }

    return res.status(200).json({
      status: true,
      message: "Join request approved successfully",
      data: {
        requestId: joinRequest._id,
        slotId: slot._id,
        slotName: slot.slotName,
        currentBookings: slot.currentBookings,
        maxSlots: slot.maxSlots,
        availableSlots: slot.maxSlots - slot.currentBookings,
        status: slot.status,
      },
    });
  } catch (error) {
    console.error("Approve slot join request error:", error);
    return res.status(500).json({
      status: false,
      message: "Error approving join request",
      error: error.message,
    });
  }
};

// Decline Slot Join Request
export const declineSlotJoinRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { responseMessage, userId } = req.body; // Slot creator's user ID

    const joinRequest = await SlotJoinRequest.findById(requestId)
      .populate("slotId")
      .populate("requestedBy");

    if (!joinRequest) {
      return res.status(404).json({
        status: false,
        message: "Join request not found",
      });
    }

    // Verify that the user is the slot creator
    const slot = await Slot.findById(joinRequest.slotId);
    if (!slot) {
      return res.status(404).json({
        status: false,
        message: "Slot not found",
      });
    }

    if (slot.createdBy.toString() !== userId) {
      return res.status(403).json({
        status: false,
        message: "Only the slot creator can decline join requests",
      });
    }

    if (joinRequest.status !== "pending") {
      return res.status(400).json({
        status: false,
        message: `Request is already ${joinRequest.status}`,
      });
    }

    // Decline request
    joinRequest.status = "declined";
    joinRequest.respondedAt = new Date();
    joinRequest.responseMessage = responseMessage || "Request declined by slot creator";
    await joinRequest.save();

    // Notify requester
    await Notification.create({
      userId: joinRequest.requestedBy._id || joinRequest.requestedBy,
      type: "slot_joined",
      title: "Slot Join Request Declined",
      message: `Your request to join "${slot.slotName}" has been declined. ${responseMessage || ""}`,
      slotId: slot._id,
      isRead: false,
    });

    // TODO: Send email to requester
    // await sendSlotJoinDeclineEmail(joinRequest.requestedBy, slot, joinRequest);

    return res.status(200).json({
      status: true,
      message: "Join request declined",
      data: {
        requestId: joinRequest._id,
        status: "declined",
      },
    });
  } catch (error) {
    console.error("Decline slot join request error:", error);
    return res.status(500).json({
      status: false,
      message: "Error declining join request",
      error: error.message,
    });
  }
};

// Get Pending Join Requests for Slot Creator
export const getPendingJoinRequests = async (req, res) => {
  try {
    const { userId } = req.params; // Slot creator's user ID

    const pendingRequests = await SlotJoinRequest.find({
      slotCreatorId: userId,
      status: "pending",
    })
      .populate("slotId", "slotName destinationName tripDate maxSlots currentBookings")
      .populate("requestedBy", "name email phone")
      .populate("bookingId", "guestDetails tripdate")
      .sort({ createdAt: -1 });

    const formattedRequests = pendingRequests.map((request) => ({
      _id: request._id,
      slotId: request.slotId?._id,
      slotName: request.slotId?.slotName,
      destinationName: request.slotId?.destinationName,
      tripDate: request.slotId?.tripDate ? moment(request.slotId.tripDate).tz("Asia/Kolkata").format("YYYY-MM-DD") : null,
      availableSlots: request.slotId ? request.slotId.maxSlots - request.slotId.currentBookings : 0,
      requester: {
        _id: request.requestedBy?._id,
        name: request.requestedBy?.name || "N/A",
        email: request.requestedBy?.email || "N/A",
        phone: request.requestedBy?.phone || "N/A",
      },
      guestCount: request.guestCount,
      guestDetails: request.guestDetails,
      message: request.message,
      status: request.status,
      createdAt: moment(request.createdAt).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
    }));

    return res.status(200).json({
      status: true,
      message: "Pending join requests fetched successfully",
      data: formattedRequests,
      count: formattedRequests.length,
    });
  } catch (error) {
    console.error("Get pending join requests error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching pending join requests",
      error: error.message,
    });
  }
};

// Get User Notifications
export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, unreadOnly = false } = req.query;

    const query = { userId };
    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate("slotId", "slotName destinationName tripDate")
      .populate("packageId", "title")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    return res.status(200).json({
      status: true,
      message: "Notifications fetched successfully",
      data: notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching notifications",
      error: error.message,
    });
  }
};

// Mark Notification as Read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        status: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    return res.status(500).json({
      status: false,
      message: "Error marking notification as read",
      error: error.message,
    });
  }
};

// Mark All Notifications as Read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Notification.updateMany(
      { userId, isRead: false },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    return res.status(200).json({
      status: true,
      message: "All notifications marked as read",
      data: {
        updatedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    return res.status(500).json({
      status: false,
      message: "Error marking all notifications as read",
      error: error.message,
    });
  }
};

