import mongoose from "mongoose";

const TopAttractionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  }
}, { _id: false });

const HotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
  rating: {
    type: Number,
    required: false,
  },
  priceRange: {
    type: String,
    required: false,
  },
  location: {
    type: String,
    required: false,
  }
}, { _id: false });

const FoodAndCuisineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    enum: ["Veg", "Non-Veg"],
    required: false,
  },
  vegType: {
    type: String,
    required: false,
  },
  nonVegType: {
    type: String,
    required: false,
  }
}, { _id: false });

const NearbyDestinationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  distance: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
  }
}, { _id: false });

const ActivitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
  duration: {
    type: String,
    required: false,
  },
  priceRange: {
    type: String,
    required: false,
  },
  location: {
    type: String,
    required: false,
  }
}, { _id: false });

const EventFestivalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
  month: {
    type: String,
    required: false,
  },
  date: {
    type: String,
    required: false,
  },
  location: {
    type: String,
    required: false,
  }
}, { _id: false });

const PlaceDetailSchema = new mongoose.Schema({
  placeName: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  weatherInfo: {
    type: String,
    required: false,
  },
  images: [String],
  topAttractions: [TopAttractionSchema],
  food: [FoodAndCuisineSchema],
  hotels: [HotelSchema],
  activities: [ActivitySchema],
  eventsFestivals: [EventFestivalSchema],
  nearbyDestinations: [NearbyDestinationSchema],
}, { _id: false });

const ExploreDestinationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["popular", "season", "category", "region", "adventure", "culture"],
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  
  name: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  location: {
    type: String,
    required: false,
  },
  images: [String],
  bestTimeToVisit: {
    type: String,
  },
  weatherInfo: {
    type: String,
  },
  
  title: {
    type: String,
  },
  color: {
    type: String,
  },
  places: {
    type: String,
  },
  desc: {
    type: String,
  },
  image: {
    type: String,
  },
  season: {
    type: String,
  },
  category: {
    type: String,
  },
  
  region: {
    type: String,
  },
  state: {
    type: String,
  },
  
  activityType: {
    type: String,
  },
  
  heritageType: {
    type: String,
  },
  
  highlights: [String],
  duration: {
    type: String,
  },
  
  topAttractions: [TopAttractionSchema],
  hotels: [HotelSchema],
  foodAndCuisine: [FoodAndCuisineSchema],
  nearbyDestinations: [NearbyDestinationSchema],
  activities: [ActivitySchema],
  eventsFestivals: [EventFestivalSchema],
  priceRange: {
    min: Number,
    max: Number,
    currency: { type: String, default: "INR" }
  },
  coordinates: {
    latitude: Number,
    longitude: Number,
  },
  
  placesDetails: [PlaceDetailSchema],
  
}, {
  timestamps: true
});

const ExploreDestination = mongoose.model("ExploreDestination",  ExploreDestinationSchema);
export default ExploreDestination

