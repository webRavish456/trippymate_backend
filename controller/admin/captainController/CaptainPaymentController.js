import CaptainPayment from "../../../models/CaptainPaymentModel.js";

// Add Payment
export const AddPayment = async (req, res) => {
  try {
    const { captainId, bookingId, assignmentId, amount, paymentMethod, transactionId, notes, status } = req.body;

    if (!captainId || !bookingId || !assignmentId || !amount) {
      return res.status(400).json({
        status: false,
        message: "Captain ID, Booking ID, Assignment ID, and Amount are required"
      });
    }

    const newPayment = new CaptainPayment({
      captainId,
      bookingId,
      assignmentId,
      amount: parseFloat(amount),
      paymentMethod: paymentMethod || 'bank_transfer',
      transactionId: transactionId || "",
      notes: notes || "",
      status: status || 'pending',
      paidBy: req.user?.id || req.user?._id || null
    });

    await newPayment.save();

    const payment = await CaptainPayment.findById(newPayment._id)
      .populate('captainId', 'name email')
      .populate('bookingId', 'finalAmount')
      .populate('paidBy', 'name email');

    return res.status(201).json({
      status: true,
      message: "Payment added successfully",
      data: payment
    });
  } catch (error) {
    console.error("AddPayment error:", error);
    return res.status(500).json({
      status: false,
      message: "Error adding payment",
      error: error.message
    });
  }
};

// Get All Payments
export const GetAllPayments = async (req, res) => {
  try {
    const { captainId, bookingId, status, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (captainId) query.captainId = captainId;
    if (bookingId) query.bookingId = bookingId;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const payments = await CaptainPayment.find(query)
      .populate('captainId', 'name email')
      .populate('bookingId', 'finalAmount')
      .populate('paidBy', 'name email')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CaptainPayment.countDocuments(query);

    return res.status(200).json({
      status: true,
      message: "Payments fetched successfully",
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error("GetAllPayments error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching payments",
      error: error.message
    });
  }
};

// Get Payment By ID
export const GetPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await CaptainPayment.findById(id)
      .populate('captainId', 'name email')
      .populate('bookingId', 'finalAmount')
      .populate('paidBy', 'name email');

    if (!payment) {
      return res.status(404).json({
        status: false,
        message: "Payment not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Payment fetched successfully",
      data: payment
    });
  } catch (error) {
    console.error("GetPaymentById error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching payment",
      error: error.message
    });
  }
};

// Update Payment
export const UpdatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.amount) {
      updateData.amount = parseFloat(updateData.amount);
    }

    const payment = await CaptainPayment.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('captainId', 'name email')
      .populate('bookingId', 'finalAmount')
      .populate('paidBy', 'name email');

    if (!payment) {
      return res.status(404).json({
        status: false,
        message: "Payment not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Payment updated successfully",
      data: payment
    });
  } catch (error) {
    console.error("UpdatePayment error:", error);
    return res.status(500).json({
      status: false,
      message: "Error updating payment",
      error: error.message
    });
  }
};

// Delete Payment
export const DeletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await CaptainPayment.findByIdAndDelete(id);

    if (!payment) {
      return res.status(404).json({
        status: false,
        message: "Payment not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Payment deleted successfully"
    });
  } catch (error) {
    console.error("DeletePayment error:", error);
    return res.status(500).json({
      status: false,
      message: "Error deleting payment",
      error: error.message
    });
  }
};

