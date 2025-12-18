import Packages from "../../models/PackageModel.js"
import Booking from "../../models/BookingModel.js"
const addBooking = async (req, res) => {
  try {
    const { packageId } = req.body;
    const { userId } = req.body;
    const {guestDetails} =req.body;
    const {status}=req.body;
    const {tripdate}=req.body;
    console.log(guestDetails);

    const bookingDetail = await Booking.create({ packageId, userId,guestDetails,status,tripdate});

    return res
      .status(201)
      .json({ status: true, message: "Booking successful", bookingDetail });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};



export { addBooking }
