import CaptainAssignment from "../../../models/CaptainAssignmentModel.js";
import Captain from "../../../models/CaptainModel.js";
import Packages from "../../../models/PackageModel.js";
import Notification from "../../../models/NotificationModel.js";
import { getIO } from "../../../socket/socketHandler.js";

// Assign Captain to Package (called from Booking module)
export const AssignCaptainToPackage = async (req, res) => {
  try {
    const { captainId, packageId, bookingId, startDate, endDate, notes, status } = req.body;

    if (!captainId || !packageId || !bookingId || !startDate || !endDate) {
      return res.status(400).json({
        status: false,
        message: "Captain ID, Package ID, Booking ID, Start Date, and End Date are required"
      });
    }

    // Check if captain exists
    const captain = await Captain.findById(captainId);
    if (!captain) {
      return res.status(404).json({
        status: false,
        message: "Captain not found"
      });
    }

    // Check if package exists
    const packageExists = await Packages.findById(packageId);
    if (!packageExists) {
      return res.status(404).json({
        status: false,
        message: "Package not found"
      });
    }

    // Check if booking exists
    const Booking = (await import("../../../models/BookingModel.js")).default;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        status: false,
        message: "Booking not found"
      });
    }

    // Check for overlapping assignments
    const overlapping = await CaptainAssignment.findOne({
      captainId,
      packageId,
      status: { $in: ['assigned', 'in-progress'] },
      $or: [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({
        status: false,
        message: "Captain already has an assignment for this package during the specified dates"
      });
    }

    const newAssignment = new CaptainAssignment({
      captainId,
      packageId,
      bookingId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      notes: notes || "",
      status: status || 'assigned',
      assignedBy: req.user?.id || req.user?._id || null
    });

    await newAssignment.save();

    // Update booking's captainId so booking shows assigned captain
    await Booking.findByIdAndUpdate(bookingId, { $set: { captainId } }, { new: true });

    // Notify captain: assigned to booking
    const bookingPopulated = await Booking.findById(bookingId)
      .populate("packageId", "title")
      .populate("userId", "name email")
      .lean();
    const packageTitle = bookingPopulated?.packageId?.title || "Booking";
    const userName = bookingPopulated?.userId?.name || bookingPopulated?.userId?.email || "Customer";
    const notif = await Notification.create({
      captainId,
      type: "captain_assigned",
      title: "You have been assigned to a booking",
      message: `You are assigned to "${packageTitle}" for ${userName}. Booking ID: ${bookingPopulated?.bookingId || bookingId}`,
      packageId,
      bookingId: booking._id,
      userId: bookingPopulated?.userId?._id || booking.userId,
      isRead: false,
    });
    const io = getIO();
    if (io) {
      io.to(`captain:${captainId.toString()}`).emit("captain-notification", {
        type: "captain_assigned",
        title: notif.title,
        message: notif.message,
        bookingId: booking._id,
        _id: notif._id,
        createdAt: notif.createdAt,
      });
    }

    const assignment = await CaptainAssignment.findById(newAssignment._id)
      .populate('captainId', 'name email phone')
      .populate('packageId', 'title destination duration price')
      .populate('bookingId', 'finalAmount status tripdate')
      .populate({
        path: 'bookingId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .populate('assignedBy', 'name email');

    return res.status(201).json({
      status: true,
      message: "Captain assigned to package successfully",
      data: assignment
    });
  } catch (error) {
    console.error("AssignCaptainToPackage error:", error);
    return res.status(500).json({
      status: false,
      message: "Error assigning captain to package",
      error: error.message
    });
  }
};

// Get All Assignments
export const GetAllAssignments = async (req, res) => {
  try {
    const { captainId, packageId, bookingId, status, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (captainId) query.captainId = captainId;
    if (packageId) query.packageId = packageId;
    if (bookingId) query.bookingId = bookingId;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const assignments = await CaptainAssignment.find(query)
      .populate('captainId', 'name email phone')
      .populate('packageId', 'title destination duration price')
      .populate('bookingId', 'finalAmount status tripdate')
      .populate({
        path: 'bookingId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .populate('assignedBy', 'name email')
      .sort({ assignedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CaptainAssignment.countDocuments(query);

    return res.status(200).json({
      status: true,
      message: "Assignments fetched successfully",
      data: {
        assignments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error("GetAllAssignments error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching assignments",
      error: error.message
    });
  }
};

// Get Assignment By ID
export const GetAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await CaptainAssignment.findById(id)
      .populate('captainId', 'name email phone')
      .populate('packageId', 'title destination duration price')
      .populate('bookingId', 'finalAmount status tripdate')
      .populate({
        path: 'bookingId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .populate('assignedBy', 'name email');

    if (!assignment) {
      return res.status(404).json({
        status: false,
        message: "Assignment not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Assignment fetched successfully",
      data: assignment
    });
  } catch (error) {
    console.error("GetAssignmentById error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching assignment",
      error: error.message
    });
  }
};

// Get Assignments by Captain
export const GetAssignmentsByCaptain = async (req, res) => {
  try {
    const { captainId } = req.params;

    const assignments = await CaptainAssignment.find({ captainId })
      .populate('packageId', 'title destination duration price')
      .populate('bookingId', 'finalAmount status tripdate')
      .populate({
        path: 'bookingId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .populate('assignedBy', 'name email')
      .sort({ startDate: -1 });

    return res.status(200).json({
      status: true,
      message: "Captain assignments fetched successfully",
      data: assignments
    });
  } catch (error) {
    console.error("GetAssignmentsByCaptain error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching captain assignments",
      error: error.message
    });
  }
};

// Get Assignments by Package
export const GetAssignmentsByPackage = async (req, res) => {
  try {
    const { packageId } = req.params;

    const assignments = await CaptainAssignment.find({ packageId })
      .populate('captainId', 'name email phone')
      .populate('bookingId', 'finalAmount status tripdate')
      .populate({
        path: 'bookingId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .populate('assignedBy', 'name email')
      .sort({ startDate: -1 });

    return res.status(200).json({
      status: true,
      message: "Package assignments fetched successfully",
      data: assignments
    });
  } catch (error) {
    console.error("GetAssignmentsByPackage error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching package assignments",
      error: error.message
    });
  }
};

// Update Assignment
export const UpdateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    const assignment = await CaptainAssignment.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('captainId', 'name email phone')
      .populate('packageId', 'title destination duration price')
      .populate('bookingId', 'finalAmount status tripdate')
      .populate({
        path: 'bookingId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .populate('assignedBy', 'name email');

    if (!assignment) {
      return res.status(404).json({
        status: false,
        message: "Assignment not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Assignment updated successfully",
      data: assignment
    });
  } catch (error) {
    console.error("UpdateAssignment error:", error);
    return res.status(500).json({
      status: false,
      message: "Error updating assignment",
      error: error.message
    });
  }
};

// Delete Assignment
export const DeleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await CaptainAssignment.findByIdAndDelete(id);

    if (!assignment) {
      return res.status(404).json({
        status: false,
        message: "Assignment not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Assignment deleted successfully"
    });
  } catch (error) {
    console.error("DeleteAssignment error:", error);
    return res.status(500).json({
      status: false,
      message: "Error deleting assignment",
      error: error.message
    });
  }
};

