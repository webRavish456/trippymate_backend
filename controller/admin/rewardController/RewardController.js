import Reward from "../../../models/RewardModel.js";
import UserReward from "../../../models/UserRewardModel.js";

export const AddReward = async (req, res) => {
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

    if (!code || !title || !discountType || !discountValue || !validFrom || !validUntil) {
      return res.status(400).json({
        status: false,
        message: "Please provide all required fields"
      });
    }

    const existingReward = await Reward.findOne({ code: code.toUpperCase() });
    if (existingReward) {
      return res.status(400).json({
        status: false,
        message: "Reward code already exists"
      });
    }

    let finalUserLimit = 1;
    if (oneTimeUser !== undefined) {
      finalUserLimit = oneTimeUser === true ? 1 : null;
    } else if (userLimit !== undefined) {
      finalUserLimit = userLimit;
    }

    const newReward = new Reward({
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

    await newReward.save();

    return res.status(201).json({
      status: true,
      message: "Reward created successfully",
      data: newReward
    });
  } catch (error) {
    console.error("AddReward error:", error);
    return res.status(500).json({
      status: false,
      message: "Error creating reward",
      error: error.message
    });
  }
};

export const GetAllRewards = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const rewards = await Reward.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Reward.countDocuments(query);

    return res.status(200).json({
      status: true,
      message: "Rewards fetched successfully",
      data: {
        rewards,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error("GetAllRewards error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching rewards",
      error: error.message
    });
  }
};

export const GetRewardById = async (req, res) => {
  try {
    const { id } = req.params;
    const reward = await Reward.findById(id).populate('createdBy', 'name email');
    if (!reward) {
      return res.status(404).json({
        status: false,
        message: "Reward not found"
      });
    }
    return res.status(200).json({
      status: true,
      message: "Reward fetched successfully",
      data: reward
    });
  } catch (error) {
    console.error("GetRewardById error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching reward",
      error: error.message
    });
  }
};

export const UpdateReward = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.code) {
      const existing = await Reward.findOne({
        code: updateData.code.toUpperCase(),
        _id: { $ne: id }
      });
      if (existing) {
        return res.status(400).json({
          status: false,
          message: "Reward code already exists"
        });
      }
      updateData.code = updateData.code.toUpperCase();
    }
    if (updateData.oneTimeUser !== undefined) {
      updateData.userLimit = updateData.oneTimeUser === true ? 1 : null;
      delete updateData.oneTimeUser;
    }
    if (updateData.validFrom) updateData.validFrom = new Date(updateData.validFrom);
    if (updateData.validUntil) updateData.validUntil = new Date(updateData.validUntil);

    const reward = await Reward.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!reward) {
      return res.status(404).json({
        status: false,
        message: "Reward not found"
      });
    }
    return res.status(200).json({
      status: true,
      message: "Reward updated successfully",
      data: reward
    });
  } catch (error) {
    console.error("UpdateReward error:", error);
    return res.status(500).json({
      status: false,
      message: "Error updating reward",
      error: error.message
    });
  }
};

export const DeleteReward = async (req, res) => {
  try {
    const { id } = req.params;
    const reward = await Reward.findByIdAndDelete(id);
    if (!reward) {
      return res.status(404).json({
        status: false,
        message: "Reward not found"
      });
    }
    return res.status(200).json({
      status: true,
      message: "Reward deleted successfully"
    });
  } catch (error) {
    console.error("DeleteReward error:", error);
    return res.status(500).json({
      status: false,
      message: "Error deleting reward",
      error: error.message
    });
  }
};

/**
 * Get all reward transactions (rewards given when trip completed) - for Admin Reward Management
 */
export const GetRewardTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await UserReward.find({})
      .populate("userId", "name email phone")
      .populate({
        path: "bookingId",
        select: "bookingId status tripdate finalAmount",
        populate: { path: "packageId", select: "title" }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UserReward.countDocuments();

    return res.status(200).json({
      status: true,
      message: "Reward transactions fetched successfully",
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error("GetRewardTransactions error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching reward transactions",
      error: error.message
    });
  }
};

// Get active rewards for user (frontend My Rewards page)
export const GetActiveRewards = async (req, res) => {
  try {
    const now = new Date();
    const rewards = await Reward.find({
      status: 'active',
      validFrom: { $lte: now },
      validUntil: { $gte: now }
    })
      .select('code title description discountType discountValue minBookingAmount maxDiscountAmount validFrom validUntil')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: true,
      message: "Rewards fetched successfully",
      data: rewards
    });
  } catch (error) {
    console.error("GetActiveRewards error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching rewards",
      error: error.message
    });
  }
};
