import express from "express";
export const router = express.Router();

// ============================================
// MIDDLEWARE IMPORTS
// ============================================
import verifyToken from '../middleware/auth.js';
import uploadDestination from '../middleware/upload/destination/destination-upload.js';
import uploadBanner from '../middleware/upload/banner/banner.js';
import uploadCoupon from '../middleware/upload/coupon/coupon.js';
import uploadReview from '../middleware/upload/review/review.js';
import uploadUser from '../middleware/upload/user/user.js';
import uploadVendor from '../middleware/upload/vendor/vendor.js'
import uploadCommunity from '../middleware/upload/community/community.js'
import { createMessage, getTripMessages, updateMessage, deleteMessage } from '../controller/admin/communityController/CommunityMessageController.js';

import uploadPackage from '../middleware/upload/package/package.js';
import uploadBlog from '../middleware/upload/blog/blog.js';
import uploadTestimonial from '../middleware/upload/testimonial/testimonial.js';
import uploadTrip from '../middleware/upload/trip/trip.js';

// ============================================
// CONTROLLER IMPORTS - ADMIN
// ============================================
import { adminRegistration, adminLogin } from '../controller/admin/adminAuthController/AdminController.js';
import {
  AddPackages,
  DeletePackages,
  UpdatePackages,
  ShowPackages,
  GetPackageById
} from '../controller/admin/packageController/PackageController.js';
import {
  AddDestination,
  GetAllDestinations,
  GetDestinationById,
  UpdateDestination,
  DeleteDestination,
  GetPopularDestinations,
  GetSeasonDestinations,
  GetCategoryDestinations,
  GetRegionDestinations,
  GetAdventureActivities,
  GetCultureHeritageDestinations,
} from '../controller/admin/destinationController/DestinationController.js';
import {
  addBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  getBlogsByCategory,
} from '../controller/admin/blogController/BlogController.js';
import {
  addArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
} from '../controller/admin/articleController/ArticleController.js';
import {
  addTestimonial,
  getAllTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
} from '../controller/admin/testimonialController/TestimonialController.js';
import {
  addFAQ,
  getAllFAQs,
  getFAQById,
  updateFAQ,
  deleteFAQ,
} from '../controller/admin/faqController/FAQController.js';
import * as tripController from '../controller/admin/tripController/TripController.js';
import {
  getActiveTripsWithSlots,
  getTripDetails,
} from '../controller/admin/tripController/TripManagementController.js';
import {
  getAvailableSlots,
  getSlotById,
  getAllSlots,
  removeBookingFromSlot,
  updateSlot,
} from '../controller/admin/slotController/SlotController.js';
import {
  getSuggestedSlots,
  getBestMatchesForSoloTraveler,
  getSimilarSlots,
} from '../controller/admin/slotController/SlotMatchingController.js';
import { AddUser, deleteVendor, updateVendor, showVendors, updateVendorStatus, setVendor, changeDefaultPassword } from '../controller/admin/vendorController/VendorController.js';
import { createCommunityTrip, getAllCommunityTrips, getCommunityTripById, updateCommunityTrip, deleteCommunityTrip, joinCommunityTrip } from '../controller/admin/communityController/CommunityTripController.js';
import {
  AddPayment as AddVendorPayment,
  GetAllPayments as GetAllVendorPayments,
  GetPaymentById as GetVendorPaymentById,
  UpdatePayment as UpdateVendorPayment,
  DeletePayment as DeleteVendorPayment
} from '../controller/admin/vendorController/VendorPaymentController.js';
import { getUser, updateUserStatus } from '../controller/admin/userController/UserController.js';
import { showBooking, getBookingById, updateBooking } from '../controller/admin/bookingController/BookingController.js';
import {
  AddCoupon,
  GetAllCoupons,
  GetCouponById,
  GetCouponUsageDetails,
  UpdateCoupon,
  DeleteCoupon,
  VerifyCoupon
} from '../controller/admin/couponController/CouponController.js';
import {
  AddPromoCode,
  GetAllPromoCodes,
  GetPromoCodeById,
  UpdatePromoCode,
  DeletePromoCode,
  VerifyPromoCode
} from '../controller/admin/promoCodeController/PromoCodeController.js';
import {
  AddCommunity,
  GetAllCommunity,
  GetCommunityById,
  UpdateCommunity,
  DeleteCommunity
} from '../controller/admin/communityController/CommunityController.js';
import {
  AddBanner,
  GetAllBanners,
  GetBannerById,
  UpdateBanner,
  DeleteBanner
} from '../controller/admin/bannerController/BannerController.js';
import {
  AddCaptain,
  GetAllCaptains,
  GetCaptainById,
  UpdateCaptain,
  DeleteCaptain
} from '../controller/admin/captainController/CaptainController.js';
import uploadCaptain from '../middleware/upload/captain/captain.js';
import {
  AssignCaptainToPackage,
  GetAllAssignments,
  GetAssignmentById,
  GetAssignmentsByCaptain,
  GetAssignmentsByPackage,
  UpdateAssignment,
  DeleteAssignment
} from '../controller/admin/captainController/CaptainAssignmentController.js';
import {
  AddAvailability,
  GetAvailabilityByCaptain,
  UpdateAvailability,
  DeleteAvailability
} from '../controller/admin/captainController/CaptainAvailabilityController.js';
import {
  AddPayment,
  GetAllPayments,
  GetPaymentById,
  UpdatePayment,
  DeletePayment
} from '../controller/admin/captainController/CaptainPaymentController.js';

// ============================================
// CONTROLLER IMPORTS - WEB/USER
// ============================================
import { sentOtp, verifyOtp } from '../controller/web/otp.js';
import { AddUser as AddWebUser } from '../controller/web/UserController.js';
import { addBooking } from '../controller/web/BookingController.js';
import { createPaymentOrder, verifyPayment } from '../controller/web/PaymentController.js';
import {
  getAllBlogs as getWebBlogs,
  getBlogById as getWebBlogById,
  getBlogCategories,
  getFeaturedTestimonials,
  getMainBlogPosts,
  getArticlePosts,
  updateBlogLike,
  updateBlogShare
} from '../controller/web/blogController/BlogController.js';
import {
  getAllFAQs as getWebFAQs,
  getFAQsByCategory
} from '../controller/web/faqController/FAQController.js';
import {
  checkPackageAvailability,
  checkCaptainAvailability,
  checkCombinedAvailability,
} from '../controller/web/AvailabilityController.js';
import { getAllPayments, getPaymentStatistics } from '../controller/admin/paymentController/PaymentController.js';
import {
  createSlotByTraveler,
  requestToJoinSlot,
  approveSlotJoinRequest,
  declineSlotJoinRequest,
  getPendingJoinRequests,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controller/web/SlotController.js';
import { ShowPackages as ShowUserPackages, GetPackageById as GetUserPackageById } from '../controller/web/packageController/PackageController.js';
import {
  GetAllActiveCaptains,
  GetCaptainByIdPublic,
  CheckCaptainAvailability
} from '../controller/web/captainController/CaptainController.js';
import { BookCaptain } from '../controller/web/captainController/BookingController.js';
import {
  signup,
  login,
  forgotPassword,
  resetPassword,
  setPassword,
  googleAuth,
  getCurrentUser
} from '../controller/web/authController/AuthController.js';

// ============================================
// OTP ROUTES
// ============================================
router.route('/sentotp').post(sentOtp);
router.route('/verifyotp').post(verifyOtp);
router.route('/auth/send-otp').post(sentOtp);
router.route('/auth/verify-otp').post(verifyOtp);

// ============================================
// ADMIN AUTH ROUTES
// ============================================
router.route('/admin/adminRegistration').post(adminRegistration);
router.route('/admin/adminlogin').post(adminLogin);

// ============================================
// ADMIN DESTINATION ROUTES
// ============================================
router.route('/admin/destination/add').post(uploadDestination, AddDestination);
router.route('/admin/destination/all').get(GetAllDestinations);
router.route('/admin/destination/popular').get(GetPopularDestinations);
router.route('/admin/destination/season').get(GetSeasonDestinations);
router.route('/admin/destination/category').get(GetCategoryDestinations);
router.route('/admin/destination/region').get(GetRegionDestinations);
router.route('/admin/destination/adventure').get(GetAdventureActivities);
router.route('/admin/destination/culture').get(GetCultureHeritageDestinations);
router.route('/admin/destination/:id').get(GetDestinationById);
router.route('/admin/destination/update/:id').put(uploadDestination, UpdateDestination);
router.route('/admin/destination/delete/:id').delete(DeleteDestination);

// ============================================
// ADMIN PACKAGE ROUTES
// ============================================
router.route('/admin/packages/AddPackages').post(uploadPackage, AddPackages);
router.route('/admin/packages/UpdatePackage/:id').patch(uploadPackage, UpdatePackages);
router.route('/admin/packages/DeletePackage/:id').delete(DeletePackages);
router.route('/admin/packages/showPackage').get(ShowPackages);
router.route('/admin/packages/packagedetail').post(GetPackageById);

// ============================================
// ADMIN BLOG ROUTES
// ============================================
router.route('/admin/addBlog').post(uploadBlog, addBlog);
router.route('/admin/getAllBlogs').get(getAllBlogs);
router.route('/admin/getBlog/:id').get(getBlogById);
router.route('/admin/updateBlog/:id').put(uploadBlog, updateBlog);
router.route('/admin/deleteBlog/:id').delete(deleteBlog);
router.route('/admin/category/:category').get(getBlogsByCategory);

// ============================================
// ADMIN ARTICLE ROUTES
// ============================================
router.route('/admin/addArticle').post(uploadBlog, addArticle);
router.route('/admin/getAllArticles').get(getAllArticles);
router.route('/admin/getArticle/:id').get(getArticleById);
router.route('/admin/updateArticle/:id').put(uploadBlog, updateArticle);
router.route('/admin/deleteArticle/:id').delete(deleteArticle);

// ============================================
// ADMIN TESTIMONIAL ROUTES
// ============================================
router.route('/admin/addTestimonial').post(verifyToken, uploadTestimonial, addTestimonial);
router.route('/admin/getAllTestimonials').get(verifyToken, getAllTestimonials);
router.route('/admin/getTestimonial/:id').get(verifyToken, getTestimonialById);
router.route('/admin/updateTestimonial/:id').put(verifyToken, uploadTestimonial, updateTestimonial);
router.route('/admin/deleteTestimonial/:id').delete(verifyToken, deleteTestimonial);

// ============================================
// ADMIN FAQ ROUTES
// ============================================
router.route('/admin/addFAQ').post(verifyToken, addFAQ);
router.route('/admin/getAllFAQs').get(verifyToken, getAllFAQs);
router.route('/admin/getFAQ/:id').get(verifyToken, getFAQById);
router.route('/admin/updateFAQ/:id').put(verifyToken, updateFAQ);
router.route('/admin/deleteFAQ/:id').delete(verifyToken, deleteFAQ);

// ============================================
// ADMIN TRIP ROUTES (Read-only - Shows trips from slots)
// ============================================
router.route('/admin/trip/active-trips').get(verifyToken, getActiveTripsWithSlots);
router.route('/admin/trip/details/:packageId/:tripDate').get(verifyToken, getTripDetails);

// ============================================
// ADMIN SLOT ROUTES
// ============================================
router.route('/admin/slot/available').get(verifyToken, getAvailableSlots);
router.route('/admin/slot/:id').get(verifyToken, getSlotById);
router.route('/admin/slot/all').get(verifyToken, getAllSlots);
router.route('/admin/slot/remove-booking').post(verifyToken, removeBookingFromSlot);
router.route('/admin/slot/update/:id').put(verifyToken, updateSlot);

// ============================================
// SLOT MATCHING ROUTES (For Solo Travelers)
// ============================================
router.route('/admin/slot/suggestions').get(verifyToken, getSuggestedSlots);
router.route('/admin/slot/match-solo-traveler').post(verifyToken, getBestMatchesForSoloTraveler);
router.route('/admin/slot/similar/:slotId').get(verifyToken, getSimilarSlots);

// ============================================
// ADMIN VENDOR ROUTES
// ============================================
router.route('/admin/vendor/addVendor').post(verifyToken, uploadVendor, setVendor);
router.route('/admin/vendor/deleteVendor/:vendorId').delete(deleteVendor);
router.route('/admin/vendor/updateVendor/:vendorId').put(verifyToken, uploadVendor, updateVendor);
router.route('/admin/vendor/getVendor').get(showVendors);
router.route('/admin/vendor/changeVendorStatus').post(updateVendorStatus);

// ============================================
// ADMIN VENDOR PAYMENT ROUTES
// ============================================
router.route('/admin/vendor-payment/add').post(verifyToken, AddVendorPayment);
router.route('/admin/vendor-payment/all').get(verifyToken, GetAllVendorPayments);
router.route('/admin/vendor-payment/:id').get(verifyToken, GetVendorPaymentById);
router.route('/admin/vendor-payment/update/:id').put(verifyToken, UpdateVendorPayment);
router.route('/admin/vendor-payment/delete/:id').delete(verifyToken, DeleteVendorPayment);

// ============================================
// ADMIN USER ROUTES
// ============================================
router.route('/admin/user/getUser').get(getUser);
router.route('/admin/user/changeUserStatus/:id').post(updateUserStatus);

// ============================================
// ADMIN BOOKING ROUTES
// ============================================
router.route('/admin/booking/getBooking').get(verifyToken, showBooking);
router.route('/admin/booking/:id').get(verifyToken, getBookingById);
router.route('/admin/booking/:id').put(verifyToken, updateBooking);

// ============================================
// ADMIN COUPON ROUTES
// ============================================
router.route('/admin/coupon/add').post(verifyToken, AddCoupon);
router.route('/admin/coupon/all').get(verifyToken, GetAllCoupons);
router.route('/admin/coupon/:id').get(verifyToken, GetCouponById);
router.route('/admin/coupon/usage/:id').get(verifyToken, GetCouponUsageDetails);
router.route('/admin/coupon/update/:id').put(verifyToken, UpdateCoupon);
router.route('/admin/coupon/delete/:id').delete(verifyToken, DeleteCoupon);
router.route('/admin/coupon/verify').post(VerifyCoupon); // Public route for verification

// ============================================
// ADMIN PROMO CODE ROUTES
// ============================================
router.route('/admin/promo-code/add').post(verifyToken, AddPromoCode);
router.route('/admin/promo-code/all').get(verifyToken, GetAllPromoCodes);
router.route('/admin/promo-code/:id').get(verifyToken, GetPromoCodeById);
router.route('/admin/promo-code/update/:id').put(verifyToken, UpdatePromoCode);
router.route('/admin/promo-code/delete/:id').delete(verifyToken, DeletePromoCode);
router.route('/admin/promo-code/verify').post(VerifyPromoCode); // Public route for verification

// ============================================
// ADMIN COMMUNITY ROUTES
// ============================================
router.route('/admin/community/add').post(verifyToken, AddCommunity);
router.route('/admin/community/all').get(verifyToken, GetAllCommunity);
router.route('/admin/community/:id').get(verifyToken, GetCommunityById);
router.route('/admin/community/update/:id').put(verifyToken, UpdateCommunity);
router.route('/admin/community/delete/:id').delete(verifyToken, DeleteCommunity);

// ============================================
// ADMIN BANNER ROUTES
// ============================================
router.route('/admin/banner/add').post(verifyToken, uploadBanner, AddBanner);
router.route('/admin/banner/all').get(verifyToken, GetAllBanners);
router.route('/admin/banner/:id').get(verifyToken, GetBannerById);
router.route('/admin/banner/update/:id').put(verifyToken, uploadBanner, UpdateBanner);
router.route('/admin/banner/delete/:id').delete(verifyToken, DeleteBanner);

// ============================================
// ADMIN CAPTAIN ROUTES
// ============================================
router.route('/admin/captain/add').post(verifyToken, uploadCaptain, AddCaptain);
router.route('/admin/captain/all').get(verifyToken, GetAllCaptains);
router.route('/admin/captain/:id').get(verifyToken, GetCaptainById);
router.route('/admin/captain/update/:id').put(verifyToken, uploadCaptain, UpdateCaptain);
router.route('/admin/captain/delete/:id').delete(verifyToken, DeleteCaptain);

// ============================================
// ADMIN CAPTAIN ASSIGNMENT ROUTES
// ============================================
router.route('/admin/captain-assignment/add').post(verifyToken, AssignCaptainToPackage);
router.route('/admin/captain-assignment/all').get(verifyToken, GetAllAssignments);
router.route('/admin/captain-assignment/:id').get(verifyToken, GetAssignmentById);
router.route('/admin/captain-assignment/captain/:captainId').get(verifyToken, GetAssignmentsByCaptain);
router.route('/admin/captain-assignment/package/:packageId').get(verifyToken, GetAssignmentsByPackage);
router.route('/admin/captain-assignment/update/:id').put(verifyToken, UpdateAssignment);
router.route('/admin/captain-assignment/delete/:id').delete(verifyToken, DeleteAssignment);

// ============================================
// ADMIN CAPTAIN AVAILABILITY ROUTES
// ============================================
router.route('/admin/captain-availability/add').post(verifyToken, AddAvailability);
router.route('/admin/captain-availability/captain/:captainId').get(verifyToken, GetAvailabilityByCaptain);
router.route('/admin/captain-availability/update/:id').put(verifyToken, UpdateAvailability);
router.route('/admin/captain-availability/delete/:id').delete(verifyToken, DeleteAvailability);

// ============================================
// ADMIN CAPTAIN PAYMENT ROUTES
// ============================================
router.route('/admin/captain-payment/add').post(verifyToken, AddPayment);
router.route('/admin/captain-payment/all').get(verifyToken, GetAllPayments);
router.route('/admin/captain-payment/:id').get(verifyToken, GetPaymentById);
router.route('/admin/captain-payment/update/:id').put(verifyToken, UpdatePayment);
router.route('/admin/captain-payment/delete/:id').delete(verifyToken, DeletePayment);

// ============================================
// AUTH ROUTES
// ============================================
router.route('/auth/signup').post(signup);
router.route('/auth/login').post(login);
router.route('/auth/forgot-password').post(forgotPassword);
router.route('/auth/reset-password').post(resetPassword);
router.route('/auth/set-password').post(setPassword);
router.route('/auth/google').post(googleAuth);
router.route('/auth/me').get(verifyToken, getCurrentUser);

// ============================================
// USER ROUTES
// ============================================
router.route('/user/AddUser').post(AddWebUser);

// ============================================
// USER PACKAGE ROUTES
// ============================================
router.route('/user/getPackages').get(ShowUserPackages);
router.route('/user/getPackagebyId').post(GetUserPackageById);

// ============================================
// USER CAPTAIN ROUTES (Public - Frontend)
// ============================================
router.route('/user/captains').get(GetAllActiveCaptains);
router.route('/user/captain/:id').get(GetCaptainByIdPublic);
router.route('/user/captain/:captainId/availability').get(CheckCaptainAvailability);
router.route('/user/captain/book').post(BookCaptain);

// ============================================
// USER BOOKING ROUTES
// ============================================
router.route('/booking/addBooking').post(addBooking);

// ============================================
// PAYMENT ROUTES
// ============================================
router.route('/payment/create-order').post(createPaymentOrder);
router.route('/payment/verify').post(verifyPayment);

// ============================================
// AVAILABILITY ROUTES
// ============================================
router.route('/availability/package').get(checkPackageAvailability);
router.route('/availability/captain').get(checkCaptainAvailability);
router.route('/availability/combined').get(checkCombinedAvailability);

// ============================================
// ADMIN PAYMENT ROUTES
// ============================================
router.route('/admin/payments/all').get(verifyToken, getAllPayments);
router.route('/admin/payments/statistics').get(verifyToken, getPaymentStatistics);

// ============================================
// USER SLOT ROUTES (Frontend)
// ============================================
router.route('/user/slot/available').get(getAvailableSlots);
router.route('/user/slot/:id').get(getSlotById);
router.route('/user/slot/suggestions').get(getSuggestedSlots);
router.route('/user/slot/match-solo-traveler').post(getBestMatchesForSoloTraveler);
router.route('/user/slot/similar/:slotId').get(getSimilarSlots);
router.route('/user/slot/create').post(verifyToken, createSlotByTraveler);
router.route('/user/slot/request-join').post(verifyToken, requestToJoinSlot);
router.route('/user/slot/approve-request/:requestId').post(verifyToken, approveSlotJoinRequest);
router.route('/user/slot/decline-request/:requestId').post(verifyToken, declineSlotJoinRequest);
router.route('/user/slot/pending-requests/:userId').get(verifyToken, getPendingJoinRequests);

// ============================================
// NOTIFICATION ROUTES
// ============================================
router.route('/user/notifications/:userId').get(verifyToken, getUserNotifications);
router.route('/user/notifications/:notificationId/read').put(verifyToken, markNotificationAsRead);
router.route('/user/notifications/:userId/read-all').put(verifyToken, markAllNotificationsAsRead);

// ============================================
// VENDOR BUSINESS ROUTES (with file uploads)
// ============================================
router.route('/business/setVendor').post(uploadVendor, setVendor);
router.route('/business/changeDefaultPassword/:username').post(changeDefaultPassword);

// ============================================
// ADMIN COMMUNITY TRIPS ROUTES
// ============================================
router.route('/admin/community-trip/create').post(verifyToken, uploadCommunity, createCommunityTrip);
router.route('/admin/community-trip/all').get(verifyToken, getAllCommunityTrips);
router.route('/admin/community-trip/:tripId').get(verifyToken, getCommunityTripById);
router.route('/admin/community-trip/update/:tripId').put(verifyToken, uploadCommunity, updateCommunityTrip);
router.route('/admin/community-trip/delete/:tripId').delete(verifyToken, deleteCommunityTrip);
router.route('/admin/community-trip/:tripId/join').post(verifyToken, joinCommunityTrip);
router.route('/admin/community-trip/:tripId/messages').get(verifyToken, getTripMessages);
router.route('/admin/community-message/create').post(verifyToken, createMessage);
router.route('/admin/community-message/:messageId').put(verifyToken, updateMessage);
router.route('/admin/community-message/:messageId').delete(verifyToken, deleteMessage);

// ============================================
// USER COMMUNITY TRIPS ROUTES (Frontend)
// ============================================
router.route('/user/community-trip/create').post(verifyToken, uploadCommunity, createCommunityTrip);
router.route('/user/community-trip/all').get(getAllCommunityTrips);
router.route('/user/community-trip/:tripId').get(getCommunityTripById);
router.route('/user/community-trip/:tripId/join').post(verifyToken, joinCommunityTrip);
router.route('/user/community-trip/:tripId/messages').get(verifyToken, getTripMessages);
router.route('/user/community-message/create').post(verifyToken, createMessage);

// ============================================
// USER BLOG ROUTES (Frontend)
// ============================================
router.route('/user/blog/all').get(getWebBlogs);
router.route('/user/blog/categories').get(getBlogCategories);
router.route('/user/blog/testimonials').get(getFeaturedTestimonials);
router.route('/user/blog/main-posts').get(getMainBlogPosts);
router.route('/user/blog/article-posts').get(getArticlePosts);
router.route('/user/blog/:id/like').post(updateBlogLike);
router.route('/user/blog/:id/share').post(updateBlogShare);
router.route('/user/blog/:id').get(getWebBlogById);

// ============================================
// USER FAQ ROUTES (Frontend)
// ============================================
router.route('/user/faq/all').get(getWebFAQs);
router.route('/user/faq/category/:category').get(getFAQsByCategory);

// ============================================
// LEGACY ROUTES (keeping for backward compatibility)
// ============================================
router.route('/packages').get(ShowPackages);
router.route('/packages/showPackage').get(ShowPackages);
router.route('/user/packages').get(ShowUserPackages);

