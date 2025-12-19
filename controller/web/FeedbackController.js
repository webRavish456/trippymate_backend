import Feedback from "../../models/FeedbackModel.js";
import Booking from "../../models/BookingModel.js";
import Packages from "../../models/PackageModel.js";
import mongoose from "mongoose";

// Submit Feedback
export const submitFeedback = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.id || req.user?._id || req.user?.userId;
    
    // Parse form data (can be string from FormData or number from JSON)
    const captainRating = req.body.captainRating ? parseInt(req.body.captainRating) : 0;
    const servicesRating = req.body.servicesRating ? parseInt(req.body.servicesRating) : 0;
    const accommodationRating = req.body.accommodationRating ? parseInt(req.body.accommodationRating) : 0;
    const overallExperience = req.body.overallExperience ? parseInt(req.body.overallExperience) : 0;
    const comment = req.body.comment || '';

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "User ID is required"
      });
    }

    if (!overallExperience || overallExperience < 1 || overallExperience > 5) {
      return res.status(400).json({
        status: false,
        message: "Overall experience rating is required (1-5)"
      });
    }

    // Check if booking exists and belongs to user
    const booking = await Booking.findById(bookingId)
      .populate('packageId');

    if (!booking) {
      return res.status(404).json({
        status: false,
        message: "Booking not found"
      });
    }

    const bookingUserId = booking.userId?.toString() || booking.userId;
    if (bookingUserId !== userId.toString()) {
      return res.status(403).json({
        status: false,
        message: "Unauthorized access to this booking"
      });
    }

    // Check if booking is completed
    const tripDate = booking.tripdate || booking.tripDate || new Date();
    const isCompleted = new Date(tripDate) < new Date();
    
    if (!isCompleted && booking.status !== 'Completed') {
      return res.status(400).json({
        status: false,
        message: "Feedback can only be submitted for completed trips"
      });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({ bookingId: bookingId });
    
    if (existingFeedback) {
      // Update existing feedback
      existingFeedback.captainRating = captainRating || 0;
      existingFeedback.servicesRating = servicesRating || 0;
      existingFeedback.accommodationRating = accommodationRating || 0;
      existingFeedback.overallExperience = overallExperience;
      existingFeedback.comment = comment || '';
      
      // Handle photos if provided
      if (req.imageUrls?.photos && Array.isArray(req.imageUrls.photos)) {
        existingFeedback.photos = req.imageUrls.photos;
      }

      await existingFeedback.save();

      // Update booking with feedback reference
      booking.feedback = existingFeedback._id;
      await booking.save();

      return res.status(200).json({
        status: true,
        message: "Feedback updated successfully",
        data: existingFeedback
      });
    } else {
      // Create new feedback
      const feedbackData = {
        bookingId: bookingId,
        userId: userId,
        packageId: booking.packageId?._id || booking.packageId,
        captainRating: captainRating || 0,
        servicesRating: servicesRating || 0,
        accommodationRating: accommodationRating || 0,
        overallExperience: overallExperience,
        comment: comment || '',
        photos: req.imageUrls?.photos || []
      };

      const feedback = await Feedback.create(feedbackData);

      // Update booking with feedback reference
      booking.feedback = feedback._id;
      await booking.save();

      return res.status(201).json({
        status: true,
        message: "Feedback submitted successfully",
        data: feedback
      });
    }
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return res.status(500).json({
      status: false,
      message: "Error submitting feedback",
      error: error.message
    });
  }
};

// Get Feedback by Booking ID
export const getFeedbackByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "User ID is required"
      });
    }

    // Verify booking belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        status: false,
        message: "Booking not found"
      });
    }

    const bookingUserId = booking.userId?.toString() || booking.userId;
    if (bookingUserId !== userId.toString()) {
      return res.status(403).json({
        status: false,
        message: "Unauthorized access"
      });
    }

    const feedback = await Feedback.findOne({ bookingId: bookingId });

    return res.status(200).json({
      status: true,
      message: "Feedback retrieved successfully",
      data: feedback || null
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching feedback",
      error: error.message
    });
  }
};

