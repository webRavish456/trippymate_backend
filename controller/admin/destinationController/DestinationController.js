import ExploreDestination from "../../../models/ExploreDestinationmodel.js";


const mergeImages = (items, images) => {
  if (!Array.isArray(items)) return [];
  if (!Array.isArray(images)) images = [];
  
  return items.map((item, i) => ({
    ...item,
    image: images[i] || item.image || ""
  }));
};



export const AddDestination = async (req, res) => {
  try {
    const body = req.body;

    if (!body.type) {
      return res.status(400).json({
        status: false,
        message: "type is required",
      });
    }


    switch (body.type) {
      case "season":
        if (!body.title || !body.desc) {
          return res.status(400).json({
            status: false,
            message: "title and desc are required for season destinations",
          });
        }
        break;
        
      case "category":
        if (!body.category || !body.desc) {
          return res.status(400).json({
            status: false,
            message: "category and desc are required for category destinations",
          });
        }
        break;
        
      case "region":
        if (!body.region || !body.desc) {
          return res.status(400).json({
            status: false,
            message: "region and desc are required for region destinations",
          });
        }
        break;
        
      case "adventure":
        if (!body.title && !body.name) {
          return res.status(400).json({
            status: false,
            message: "title or name is required for adventure activities",
          });
        }
        if (!body.desc && !body.description) {
          return res.status(400).json({
            status: false,
            message: "desc or description is required for adventure activities",
          });
        }
        break;
        
      case "culture":
        if (!body.title && !body.name) {
          return res.status(400).json({
            status: false,
            message: "title or name is required for culture & heritage destinations",
          });
        }
        if (!body.desc && !body.description) {
          return res.status(400).json({
            status: false,
            message: "desc or description is required for culture & heritage destinations",
          });
        }
        break;
        
      case "popular":
      default:
        if (!body.name || !body.description || !body.location) {
          return res.status(400).json({
            status: false,
            message: "name, description, and location are required for popular destinations",
          });
        }
        break;
    }


    const images = req.imageUrls?.images || [];
    const hotelImages = req.imageUrls?.hotelImages || [];
    const foodImages = req.imageUrls?.foodImages || [];
    const nearbyImages = req.imageUrls?.nearbyImages || [];
    const activityImages = req.imageUrls?.activityImages || [];
    const eventImages = req.imageUrls?.eventImages || [];
    const attractionImages = req.imageUrls?.attractionImages || [];
    
    // Separate category main image from place images (only for category, season, region, adventure, culture)
    // For popular destinations, all images go into the images array
    let categoryImage = "";
    let placeImages = [];
    if (body.type !== "popular") {
      categoryImage = images.length > 0 ? images[0] : "";
      placeImages = images.slice(1); // Remaining images are for places
    }


    const hotels = body.hotels ? mergeImages(JSON.parse(body.hotels), hotelImages) : [];
    const foodAndCuisine = body.foodAndCuisine ? mergeImages(JSON.parse(body.foodAndCuisine), foodImages) : [];
    const nearbyDestinations = body.nearbyDestinations ? mergeImages(JSON.parse(body.nearbyDestinations), nearbyImages) : [];
    const activities = body.activities ? mergeImages(JSON.parse(body.activities), activityImages) : [];
    const eventsFestivals = body.eventsFestivals ? mergeImages(JSON.parse(body.eventsFestivals), eventImages) : [];
    const topAttractions = body.topAttractions ? mergeImages(JSON.parse(body.topAttractions), attractionImages) : [];


    const validateArrayOfObjects = (arr, fieldName) => {
      if (!Array.isArray(arr)) {
        console.log(`${fieldName} is not an array, converting to empty array`);
        return [];
      }
      const filtered = arr.filter(item => typeof item === 'object' && item !== null);
      if (filtered.length !== arr.length) {
        console.log(`${fieldName}: filtered out ${arr.length - filtered.length} non-object items`);
      }
      return filtered;
    };

    const hotelsValidated = validateArrayOfObjects(hotels, 'hotels');
    const foodAndCuisineValidated = validateArrayOfObjects(foodAndCuisine, 'foodAndCuisine');
    const nearbyDestinationsValidated = validateArrayOfObjects(nearbyDestinations, 'nearbyDestinations');
    const activitiesValidated = validateArrayOfObjects(activities, 'activities');
    const eventsFestivalsValidated = validateArrayOfObjects(eventsFestivals, 'eventsFestivals');

  

    let highlights;
    if (body.highlights) {
      highlights = JSON.parse(body.highlights);
      if (!Array.isArray(highlights)) highlights = undefined;
    }

    let priceRange;
    if (body.priceRange) {
      priceRange = JSON.parse(body.priceRange);
      if (!priceRange || typeof priceRange !== "object") priceRange = undefined;
    }

    let coordinates;
    if (body.coordinates) {
      coordinates = JSON.parse(body.coordinates);
      if (!coordinates || typeof coordinates !== "object") coordinates = undefined;
    }

    // Handle placesDetails for season, category, region, adventure, culture types
    let placesDetails;
    if (body.placesDetails && ["season", "category", "region", "adventure", "culture"].includes(body.type)) {
      try {
        placesDetails = typeof body.placesDetails === "string" 
          ? JSON.parse(body.placesDetails) 
          : body.placesDetails;
        if (Array.isArray(placesDetails)) {
          // Merge images into placesDetails
          let attractionImageIndex = 0;
          let foodImageIndex = 0;
          let hotelImageIndex = 0;
          let activityImageIndex = 0;
          let eventImageIndex = 0;
          let nearbyImageIndex = 0;
          let placeImageIndex = 0;
          
          placesDetails = placesDetails.map((place) => {
            const updatedPlace = { ...place };
            
            // Merge place images (images array for each place)
            if (placeImageIndex < placeImages.length && updatedPlace.images) {
              // Calculate how many images this place should have
              const existingPlaceImages = Array.isArray(updatedPlace.images) ? updatedPlace.images.filter(img => typeof img === 'string' && img.length > 0).length : 0;
              const newPlaceImages = [];
              // Keep existing images
              if (Array.isArray(updatedPlace.images)) {
                updatedPlace.images.forEach(img => {
                  if (typeof img === 'string' && img.length > 0) {
                    newPlaceImages.push(img);
                  }
                });
              }
              // Add new uploaded images
              for (let i = 0; i < existingPlaceImages && placeImageIndex < placeImages.length; i++) {
                // Skip if already has image
              }
              // Add remaining new images
              while (placeImageIndex < placeImages.length && newPlaceImages.length < (existingPlaceImages + 5)) {
                newPlaceImages.push(placeImages[placeImageIndex++]);
              }
              updatedPlace.images = newPlaceImages;
            } else if (placeImageIndex < placeImages.length) {
              // If place doesn't have images array, create one
              const newPlaceImages = [];
              while (placeImageIndex < placeImages.length && newPlaceImages.length < 5) {
                newPlaceImages.push(placeImages[placeImageIndex++]);
              }
              updatedPlace.images = newPlaceImages;
            }
            
            // Merge topAttractions images
            if (updatedPlace.topAttractions && Array.isArray(updatedPlace.topAttractions)) {
              updatedPlace.topAttractions = updatedPlace.topAttractions.map((item, index) => {
                if (attractionImageIndex < attractionImages.length) {
                  return { ...item, image: attractionImages[attractionImageIndex++] || item.image || "" };
                }
                return item;
              });
            }
            
            // Merge food images
            if (updatedPlace.food && Array.isArray(updatedPlace.food)) {
              updatedPlace.food = updatedPlace.food.map((item, index) => {
                if (foodImageIndex < foodImages.length) {
                  return { ...item, image: foodImages[foodImageIndex++] || item.image || "" };
                }
                return item;
              });
            }
            
            // Merge hotel images
            if (updatedPlace.hotels && Array.isArray(updatedPlace.hotels)) {
              updatedPlace.hotels = updatedPlace.hotels.map((item, index) => {
                if (hotelImageIndex < hotelImages.length) {
                  return { ...item, image: hotelImages[hotelImageIndex++] || item.image || "" };
                }
                return item;
              });
            }
            
            // Merge activity images
            if (updatedPlace.activities && Array.isArray(updatedPlace.activities)) {
              updatedPlace.activities = updatedPlace.activities.map((item, index) => {
                if (activityImageIndex < activityImages.length) {
                  return { ...item, image: activityImages[activityImageIndex++] || item.image || "" };
                }
                return item;
              });
            }
            
            // Merge event images
            if (updatedPlace.eventsFestivals && Array.isArray(updatedPlace.eventsFestivals)) {
              updatedPlace.eventsFestivals = updatedPlace.eventsFestivals.map((item, index) => {
                if (eventImageIndex < eventImages.length) {
                  return { ...item, image: eventImages[eventImageIndex++] || item.image || "" };
                }
                return item;
              });
            }
            
            // Merge nearby destination images
            if (updatedPlace.nearbyDestinations && Array.isArray(updatedPlace.nearbyDestinations)) {
              updatedPlace.nearbyDestinations = updatedPlace.nearbyDestinations.map((item, index) => {
                if (nearbyImageIndex < nearbyImages.length) {
                  return { ...item, image: nearbyImages[nearbyImageIndex++] || item.image || "" };
                }
                return item;
              });
            }
            
            return updatedPlace;
          });
        } else {
          placesDetails = undefined;
        }
      } catch (error) {
        console.error("Error parsing placesDetails:", error);
        placesDetails = undefined;
      }
    }

    // Use category image if available, otherwise fallback to body.image or req.imageUrls?.image
    // For popular destinations, use first image from images array if available
    let singleImage = "";
    if (body.type === "popular") {
      singleImage = images.length > 0 ? images[0] : (body.image || req.imageUrls?.image || "");
    } else {
      singleImage = categoryImage || body.image || req.imageUrls?.image || "";
    }



    const destinationData = {
      name: body.name,
      description: body.description,
      location: body.location,
      type: body.type,

      bestTimeToVisit: body.bestTimeToVisit,
      season: body.season,
      category: body.category,
      region: body.region,
      activityType: body.activityType,
      heritageType: body.heritageType,
      duration: body.duration,
      weatherInfo: body.weatherInfo,

      title: body.title,
      color: body.color,
      places: body.places,
      desc: body.desc,
      status: body.status || "active",

      image: singleImage,
      images,

      hotels: hotelsValidated,
      foodAndCuisine: foodAndCuisineValidated,
      nearbyDestinations: nearbyDestinationsValidated,
      activities: activitiesValidated,
      eventsFestivals: eventsFestivalsValidated,
      topAttractions,
  
  
      highlights,

      coordinates,
      priceRange,
      
      // Add placesDetails for season, category, region, adventure, culture types
      ...(placesDetails && { placesDetails }),
    };

  
  

    const saved = await ExploreDestination.create(destinationData);

    return res.status(201).json({
      status: true,
      message: "Destination added successfully",
      data: saved,
    });

  } catch (err) {
    console.error("ADD ERROR:", err);
    res.status(500).json({ status: false, message: err.message });
  }
};


export const UpdateDestination = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await ExploreDestination.findById(id);
    if (!existing)
      return res.status(404).json({ status: false, message: "Destination not found" });

    const body = req.body;

    const hotelImages = req.imageUrls?.hotelImages || [];
    const foodImages = req.imageUrls?.foodImages || [];
    const nearbyImages = req.imageUrls?.nearbyImages || [];
    const activityImages = req.imageUrls?.activityImages || [];
    const eventImages = req.imageUrls?.eventImages || [];
    const images = req.imageUrls?.images;
    const attractionImages = req.imageUrls?.attractionImages || [];

    let updateData = { ...body };

    if (body.hotels) updateData.hotels = mergeImages(JSON.parse(body.hotels), hotelImages);
    if (body.foodAndCuisine)
      updateData.foodAndCuisine = mergeImages(JSON.parse(body.foodAndCuisine), foodImages);
    if (body.nearbyDestinations)
      updateData.nearbyDestinations = mergeImages(JSON.parse(body.nearbyDestinations), nearbyImages);
    if (body.activities)
      updateData.activities = mergeImages(JSON.parse(body.activities), activityImages);
    if (body.eventsFestivals)
      updateData.eventsFestivals = mergeImages(JSON.parse(body.eventsFestivals), eventImages);
    if (body.topAttractions)
      updateData.topAttractions = mergeImages(JSON.parse(body.topAttractions), attractionImages);

    if (images) updateData.images = images;
    if (body.image || req.imageUrls?.image) updateData.image = body.image || req.imageUrls?.image;

    if (body.highlights) updateData.highlights = JSON.parse(body.highlights);
    if (body.priceRange) {
      const priceRange = JSON.parse(body.priceRange);
      if (priceRange && typeof priceRange === "object") updateData.priceRange = priceRange;
    }
    if (body.coordinates) {
      const coordinates = JSON.parse(body.coordinates);
      if (coordinates && typeof coordinates === "object") updateData.coordinates = coordinates;
    }

    // Handle placesDetails for season, category, region, adventure, culture types
    if (body.placesDetails && ["season", "category", "region", "adventure", "culture"].includes(existing.type)) {
      try {
        const placesDetails = typeof body.placesDetails === "string" 
          ? JSON.parse(body.placesDetails) 
          : body.placesDetails;
        if (Array.isArray(placesDetails)) {
          // Merge images into placesDetails
          let attractionImageIndex = 0;
          let foodImageIndex = 0;
          let hotelImageIndex = 0;
          let activityImageIndex = 0;
          let eventImageIndex = 0;
          let nearbyImageIndex = 0;
          
          const placesDetailsWithImages = placesDetails.map((place) => {
            const updatedPlace = { ...place };
            
            // Merge topAttractions images
            if (updatedPlace.topAttractions && Array.isArray(updatedPlace.topAttractions)) {
              updatedPlace.topAttractions = updatedPlace.topAttractions.map((item, index) => {
                if (attractionImageIndex < attractionImages.length) {
                  return { ...item, image: attractionImages[attractionImageIndex++] || item.image || "" };
                }
                return item;
              });
            }
            
            // Merge food images
            if (updatedPlace.food && Array.isArray(updatedPlace.food)) {
              updatedPlace.food = updatedPlace.food.map((item, index) => {
                if (foodImageIndex < foodImages.length) {
                  return { ...item, image: foodImages[foodImageIndex++] || item.image || "" };
                }
                return item;
              });
            }
            
            // Merge hotel images
            if (updatedPlace.hotels && Array.isArray(updatedPlace.hotels)) {
              updatedPlace.hotels = updatedPlace.hotels.map((item, index) => {
                if (hotelImageIndex < hotelImages.length) {
                  return { ...item, image: hotelImages[hotelImageIndex++] || item.image || "" };
                }
                return item;
              });
            }
            
            // Merge activity images
            if (updatedPlace.activities && Array.isArray(updatedPlace.activities)) {
              updatedPlace.activities = updatedPlace.activities.map((item, index) => {
                if (activityImageIndex < activityImages.length) {
                  return { ...item, image: activityImages[activityImageIndex++] || item.image || "" };
                }
                return item;
              });
            }
            
            // Merge event images
            if (updatedPlace.eventsFestivals && Array.isArray(updatedPlace.eventsFestivals)) {
              updatedPlace.eventsFestivals = updatedPlace.eventsFestivals.map((item, index) => {
                if (eventImageIndex < eventImages.length) {
                  return { ...item, image: eventImages[eventImageIndex++] || item.image || "" };
                }
                return item;
              });
            }
            
            // Merge nearby destination images
            if (updatedPlace.nearbyDestinations && Array.isArray(updatedPlace.nearbyDestinations)) {
              updatedPlace.nearbyDestinations = updatedPlace.nearbyDestinations.map((item, index) => {
                if (nearbyImageIndex < nearbyImages.length) {
                  return { ...item, image: nearbyImages[nearbyImageIndex++] || item.image || "" };
                }
                return item;
              });
            }
            
            return updatedPlace;
          });
          
          updateData.placesDetails = placesDetailsWithImages;
        }
      } catch (error) {
        console.error("Error parsing placesDetails:", error);
      }
    }

    const updated = await ExploreDestination.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.json({
      status: true,
      message: "Destination updated successfully",
      data: updated,
    });

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ status: false, message: err.message });
  }
};

export const GetAllDestinations = async (req, res) => {
  try {
    const { type, search } = req.query;
    const q = {};

    if (type) q.type = type;
    if (search)
      q.$or = [
        { name: new RegExp(search, "i") },
        { location: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
        { title: new RegExp(search, "i") },
      ];

    const data = await ExploreDestination.find(q).sort({ createdAt: -1 });

    return res.json({
      status: true,
      data,
    });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

export const GetDestinationById = async (req, res) => {
  try {
    const d = await ExploreDestination.findById(req.params.id);
    if (!d) return res.status(404).json({ status: false, message: "Not found" });

    return res.json({ status: true, data: d });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

export const DeleteDestination = async (req, res) => {
  try {
    const d = await ExploreDestination.findByIdAndDelete(req.params.id);
    if (!d) return res.status(404).json({ status: false, message: "Not found" });

    return res.json({ status: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

export const GetPopularDestinations = (req, res) => filterType(req, res, "popular");
export const GetSeasonDestinations = (req, res) => filterType(req, res, "season");
export const GetCategoryDestinations = (req, res) => filterType(req, res, "category");
export const GetRegionDestinations = (req, res) => filterType(req, res, "region");
export const GetAdventureActivities = (req, res) => filterType(req, res, "adventure");
export const GetCultureHeritageDestinations = (req, res) => filterType(req, res, "culture");

const filterType = async (req, res, type) => {
  try {
    const { search } = req.query;
    const q = { type };

    if (search)
      q.$or = [
        { name: new RegExp(search, "i") },
        { location: new RegExp(search, "i") },
        { title: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
        { desc: new RegExp(search, "i") },
        { places: new RegExp(search, "i") },
        { category: new RegExp(search, "i") },
        { region: new RegExp(search, "i") },
        { state: new RegExp(search, "i") },
      ];

    const data = await ExploreDestination.find(q).sort({ createdAt: -1 });

    return res.json({ status: true, data });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};
