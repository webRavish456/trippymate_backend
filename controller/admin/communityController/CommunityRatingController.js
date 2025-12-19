import CommunityRating from '../../../models/CommunityRatingModel.js';
import CommunityTrip from '../../../models/CommunityTripModel.js';
import mongoose from 'mongoose';

// Submit or Update Rating
export const submitRating = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { rating, feedback } = req.body;
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "User ID is required"
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: false,
        message: "Rating must be between 1 and 5"
      });
    }

    // Check if trip exists
    const trip = await CommunityTrip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        status: false,
        message: "Community trip not found"
      });
    }

    // Check if user is a member
    const isMember = trip.members.some(m => 
      (m.userId?.toString() === userId.toString() || m.userId?.toString() === userId) &&
      m.status === 'approved'
    );

    if (!isMember) {
      return res.status(403).json({
        status: false,
        message: "You must be an approved member to rate this trip"
      });
    }

    // Find existing rating or create new one
    let ratingDoc = await CommunityRating.findOne({ tripId, userId });
    
    if (ratingDoc) {
      // Update existing rating
      ratingDoc.rating = rating;
      if (feedback) {
        ratingDoc.feedback = feedback;
      }
      await ratingDoc.save();
    } else {
      // Create new rating
      ratingDoc = await CommunityRating.create({
        tripId,
        userId,
        rating,
        feedback: feedback || {}
      });
    }

    // Calculate and update average rating for the trip
    const allRatings = await CommunityRating.find({ tripId });
    const totalRatings = allRatings.length;
    const sumRatings = allRatings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

    await CommunityTrip.findByIdAndUpdate(tripId, {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalRatings: totalRatings
    });

    return res.status(200).json({
      status: true,
      message: "Rating submitted successfully",
      data: {
        rating: ratingDoc,
        averageRating: averageRating,
        totalRatings: totalRatings
      }
    });
  } catch (error) {
    console.error("Error submitting rating:", error);
    return res.status(500).json({
      status: false,
      message: "Error submitting rating",
      error: error.message
    });
  }
};

// Get User's Rating for a Trip
export const getUserRating = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "User ID is required"
      });
    }

    const rating = await CommunityRating.findOne({ tripId, userId });

    return res.status(200).json({
      status: true,
      message: "Rating retrieved successfully",
      data: rating || null
    });
  } catch (error) {
    console.error("Error fetching user rating:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching rating",
      error: error.message
    });
  }
};

// Get All Ratings for a Trip (Admin only)
export const getTripRatings = async (req, res) => {
  try {
    const { tripId } = req.params;

    const ratings = await CommunityRating.find({ tripId })
      .populate('userId', 'name email profileImage')
      .sort({ createdAt: -1 });

    const trip = await CommunityTrip.findById(tripId);

    return res.status(200).json({
      status: true,
      message: "Ratings retrieved successfully",
      data: {
        ratings: ratings,
        averageRating: trip?.averageRating || 0,
        totalRatings: trip?.totalRatings || 0
      }
    });
  } catch (error) {
    console.error("Error fetching trip ratings:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching ratings",
      error: error.message
    });
  }
};

