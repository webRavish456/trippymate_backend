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


    // Helper function to merge uploaded images with URLs from body
    const mergeImageSources = (uploadedImages, bodyImages) => {
      const uploaded = Array.isArray(uploadedImages) ? uploadedImages : [];
      
      // Parse body images - can be array of URLs or JSON string
      let bodyUrls = [];
      if (bodyImages) {
        if (Array.isArray(bodyImages)) {
          bodyUrls = bodyImages.filter(url => typeof url === 'string' && url.length > 0);
        } else if (typeof bodyImages === 'string') {
          try {
            const parsed = JSON.parse(bodyImages);
            if (Array.isArray(parsed)) {
              bodyUrls = parsed.filter(url => typeof url === 'string' && url.length > 0);
            } else if (typeof parsed === 'string' && parsed.length > 0) {
              bodyUrls = [parsed];
            }
          } catch (e) {
            // If not JSON, treat as single URL string
            if (bodyImages.length > 0) {
              bodyUrls = [bodyImages];
            }
          }
        }
      }
      
      // Merge: uploaded images first, then body URLs
      return [...uploaded, ...bodyUrls];
    };

    // Get uploaded images from middleware
    const uploadedImages = req.imageUrls?.images || [];
    const uploadedPlaceImages = req.imageUrls?.placeImages || []; // Separate placeDetails images
    const uploadedHotelImages = req.imageUrls?.hotelImages || [];
    const uploadedFoodImages = req.imageUrls?.foodImages || [];
    const uploadedNearbyImages = req.imageUrls?.nearbyImages || [];
    const uploadedActivityImages = req.imageUrls?.activityImages || [];
    const uploadedEventImages = req.imageUrls?.eventImages || [];
    const uploadedAttractionImages = req.imageUrls?.attractionImages || [];

    // Merge uploaded images with URLs from body (for Postman JSON requests)
    const images = mergeImageSources(uploadedImages, body.images);
    const hotelImages = mergeImageSources(uploadedHotelImages, body.hotelImages);
    const foodImages = mergeImageSources(uploadedFoodImages, body.foodImages);
    const nearbyImages = mergeImageSources(uploadedNearbyImages, body.nearbyImages);
    const activityImages = mergeImageSources(uploadedActivityImages, body.activityImages);
    const eventImages = mergeImageSources(uploadedEventImages, body.eventImages);
    const attractionImages = mergeImageSources(uploadedAttractionImages, body.attractionImages);
    
    // Separate category main image from place images (only for category, season, region, adventure, culture)
    // For popular destinations, all images go into the images array
    // IMPORTANT: PlaceDetails images are now sent with separate "placeImages" key, not mixed with main images
    let categoryImage = "";
    let placeImages = [];
    if (body.type !== "popular") {
      categoryImage = images.length > 0 ? images[0] : "";
      // Use uploadedPlaceImages (separate key) instead of images.slice(1)
      placeImages = uploadedPlaceImages; // PlaceDetails images come from separate key
      // Also merge any place images from body.placeImages (for Postman JSON requests)
      if (body.placeImages) {
        const bodyPlaceImages = Array.isArray(body.placeImages) ? body.placeImages : 
          (typeof body.placeImages === 'string' ? JSON.parse(body.placeImages) : []);
        placeImages = [...uploadedPlaceImages, ...bodyPlaceImages.filter(url => typeof url === 'string' && url.length > 0)];
      }
    }


    // Helper function to parse arrays - handles both JSON string (form-data) and array (JSON body)
    const parseArrayField = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field; // Already an array (JSON request)
      if (typeof field === 'string') {
        try {
          return JSON.parse(field); // Parse string (form-data request)
        } catch (e) {
          console.error(`Error parsing array field:`, e);
          return [];
        }
      }
      return [];
    };

    const hotels = body.hotels ? mergeImages(parseArrayField(body.hotels), hotelImages) : [];
    const foodAndCuisine = body.foodAndCuisine ? mergeImages(parseArrayField(body.foodAndCuisine), foodImages) : [];
    const nearbyDestinations = body.nearbyDestinations ? mergeImages(parseArrayField(body.nearbyDestinations), nearbyImages) : [];
    const activities = body.activities ? mergeImages(parseArrayField(body.activities), activityImages) : [];
    const eventsFestivals = body.eventsFestivals ? mergeImages(parseArrayField(body.eventsFestivals), eventImages) : [];
    const topAttractions = body.topAttractions ? mergeImages(parseArrayField(body.topAttractions), attractionImages) : [];


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

  

    // Helper function to parse JSON fields - handles both JSON string (form-data) and object (JSON body)
    const parseJsonField = (field) => {
      if (!field) return undefined;
      if (typeof field === 'object') return field; // Already an object (JSON request)
      if (typeof field === 'string') {
        try {
          return JSON.parse(field); // Parse string (form-data request)
        } catch (e) {
          console.error(`Error parsing JSON field:`, e);
          return undefined;
        }
      }
      return undefined;
    };

    let highlights;
    if (body.highlights) {
      highlights = parseJsonField(body.highlights);
      if (!Array.isArray(highlights)) highlights = undefined;
    }

    let priceRange;
    if (body.priceRange) {
      priceRange = parseJsonField(body.priceRange);
      if (!priceRange || typeof priceRange !== "object") priceRange = undefined;
    }

    let coordinates;
    if (body.coordinates) {
      coordinates = parseJsonField(body.coordinates);
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
            // IMPORTANT: Preserve existing images from JSON, then add new uploaded images
            const existingPlaceImages = Array.isArray(updatedPlace.images) 
              ? updatedPlace.images.filter(img => typeof img === 'string' && img.length > 0 && !img.startsWith("blob:"))
              : [];
            
            const newPlaceImages = [...existingPlaceImages]; // Start with existing images
            
            // Add new uploaded images from placeImages array
            // Each place gets images sequentially from placeImages array
            while (placeImageIndex < placeImages.length && newPlaceImages.length < (existingPlaceImages.length + 10)) {
              newPlaceImages.push(placeImages[placeImageIndex++]);
            }
            
            // Only update if we have images (either existing or new)
            if (newPlaceImages.length > 0 || existingPlaceImages.length > 0) {
              updatedPlace.images = newPlaceImages;
            } else if (!updatedPlace.images) {
              // Initialize empty array if no images exist
              updatedPlace.images = [];
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



    // For category, season, region, adventure, culture: images array should only contain main category image(s)
    // Place images are already in placesDetails, so don't include them in main images array
    // Remove duplicate: if image and images[0] are same, don't duplicate in images array
    let finalImages = [];
    if (body.type === "popular") {
      // Popular destinations: all images go in images array
      finalImages = images;
    } else {
      // Category/Season/Region/Adventure/Culture: only main category image(s) in images array
      // Remove duplicates: ensure image and images[0] are not duplicated
      if (images.length > 0) {
        // Start with first image (main category image)
        finalImages = [images[0]];
        // Add other unique images (if any additional main category images)
        // But exclude place images which are already in placesDetails
        for (let i = 1; i < images.length; i++) {
          // Only add if it's not already in finalImages and not a place image
          // Place images are handled separately in placesDetails
          if (!finalImages.includes(images[i])) {
            // For now, only keep first image to avoid duplicates
            // Additional main category images can be added if needed
            break;
          }
        }
      }
      // Ensure singleImage is in finalImages if not already
      if (singleImage && !finalImages.includes(singleImage)) {
        finalImages = [singleImage, ...finalImages.filter(img => img !== singleImage)];
      }
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
      state: body.state,
      activityType: body.activityType,
      heritageType: body.heritageType,
      duration: body.duration,
      weatherInfo: body.weatherInfo,

      title: body.title,
      color: body.color,
      desc: body.desc,
      status: body.status || "active",

      image: singleImage,
      images: finalImages, // Use finalImages to avoid duplicates

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

    // Helper function to merge uploaded images with URLs from body
    const mergeImageSources = (uploadedImages, bodyImages) => {
      const uploaded = Array.isArray(uploadedImages) ? uploadedImages : [];
      
      // Parse body images - can be array of URLs or JSON string
      let bodyUrls = [];
      if (bodyImages) {
        if (Array.isArray(bodyImages)) {
          bodyUrls = bodyImages.filter(url => typeof url === 'string' && url.length > 0);
        } else if (typeof bodyImages === 'string') {
          try {
            const parsed = JSON.parse(bodyImages);
            if (Array.isArray(parsed)) {
              bodyUrls = parsed.filter(url => typeof url === 'string' && url.length > 0);
            } else if (typeof parsed === 'string' && parsed.length > 0) {
              bodyUrls = [parsed];
            }
          } catch (e) {
            // If not JSON, treat as single URL string
            if (bodyImages.length > 0) {
              bodyUrls = [bodyImages];
            }
          }
        }
      }
      
      // Merge: uploaded images first, then body URLs
      return [...uploaded, ...bodyUrls];
    };

    // Get uploaded images from middleware
    const uploadedHotelImages = req.imageUrls?.hotelImages || [];
    const uploadedFoodImages = req.imageUrls?.foodImages || [];
    const uploadedNearbyImages = req.imageUrls?.nearbyImages || [];
    const uploadedActivityImages = req.imageUrls?.activityImages || [];
    const uploadedEventImages = req.imageUrls?.eventImages || [];
    const uploadedImages = req.imageUrls?.images;
    const uploadedPlaceImages = req.imageUrls?.placeImages || []; // Separate placeDetails images
    const uploadedAttractionImages = req.imageUrls?.attractionImages || [];

    // Merge uploaded images with URLs from body (for Postman JSON requests)
    const hotelImages = mergeImageSources(uploadedHotelImages, body.hotelImages);
    const foodImages = mergeImageSources(uploadedFoodImages, body.foodImages);
    const nearbyImages = mergeImageSources(uploadedNearbyImages, body.nearbyImages);
    const activityImages = mergeImageSources(uploadedActivityImages, body.activityImages);
    const eventImages = mergeImageSources(uploadedEventImages, body.eventImages);
    const images = body.images ? mergeImageSources(uploadedImages || [], body.images) : uploadedImages;
    const attractionImages = mergeImageSources(uploadedAttractionImages, body.attractionImages);

    let updateData = { ...body };

    // Helper function to parse arrays - handles both JSON string (form-data) and array (JSON body)
    const parseArrayField = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field; // Already an array (JSON request)
      if (typeof field === 'string') {
        try {
          return JSON.parse(field); // Parse string (form-data request)
        } catch (e) {
          console.error(`Error parsing array field:`, e);
          return [];
        }
      }
      return [];
    };

    // Helper function to parse JSON fields - handles both JSON string (form-data) and object (JSON body)
    const parseJsonField = (field) => {
      if (!field) return undefined;
      if (typeof field === 'object') return field; // Already an object (JSON request)
      if (typeof field === 'string') {
        try {
          return JSON.parse(field); // Parse string (form-data request)
        } catch (e) {
          console.error(`Error parsing JSON field:`, e);
          return undefined;
        }
      }
      return undefined;
    };

    if (body.hotels) updateData.hotels = mergeImages(parseArrayField(body.hotels), hotelImages);
    if (body.foodAndCuisine)
      updateData.foodAndCuisine = mergeImages(parseArrayField(body.foodAndCuisine), foodImages);
    if (body.nearbyDestinations)
      updateData.nearbyDestinations = mergeImages(parseArrayField(body.nearbyDestinations), nearbyImages);
    if (body.activities)
      updateData.activities = mergeImages(parseArrayField(body.activities), activityImages);
    if (body.eventsFestivals)
      updateData.eventsFestivals = mergeImages(parseArrayField(body.eventsFestivals), eventImages);
    if (body.topAttractions)
      updateData.topAttractions = mergeImages(parseArrayField(body.topAttractions), attractionImages);

    // Set images array (merged uploaded + URLs from body)
    if (images && images.length > 0) updateData.images = images;
    
    // Set single image - priority: uploaded image > body.image (URL) > existing image
    if (req.imageUrls?.image) {
      updateData.image = req.imageUrls.image;
    } else if (body.image && typeof body.image === 'string' && body.image.length > 0) {
      // body.image can be a URL from Postman
      updateData.image = body.image;
    }

    if (body.highlights) {
      const parsed = parseJsonField(body.highlights);
      if (Array.isArray(parsed)) updateData.highlights = parsed;
    }
    if (body.priceRange) {
      const priceRange = parseJsonField(body.priceRange);
      if (priceRange && typeof priceRange === "object") updateData.priceRange = priceRange;
    }
    if (body.coordinates) {
      const coordinates = parseJsonField(body.coordinates);
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
          let placeImageIndex = 0;
          
          // Merge uploaded place images with any from body.placeImages (for Postman JSON requests)
          let placeImages = uploadedPlaceImages;
          if (body.placeImages) {
            const bodyPlaceImages = Array.isArray(body.placeImages) ? body.placeImages : 
              (typeof body.placeImages === 'string' ? JSON.parse(body.placeImages) : []);
            placeImages = [...uploadedPlaceImages, ...bodyPlaceImages.filter(url => typeof url === 'string' && url.length > 0)];
          }
          
          const placesDetailsWithImages = placesDetails.map((place) => {
            const updatedPlace = { ...place };
            
            // Merge place images (images array for each place)
            // IMPORTANT: Preserve existing images from JSON, then add new uploaded images
            const existingPlaceImages = Array.isArray(updatedPlace.images) 
              ? updatedPlace.images.filter(img => typeof img === 'string' && img.length > 0 && !img.startsWith("blob:"))
              : [];
            
            const newPlaceImages = [...existingPlaceImages]; // Start with existing images
            
            // Add new uploaded images from placeImages array
            while (placeImageIndex < placeImages.length && newPlaceImages.length < (existingPlaceImages.length + 10)) {
              newPlaceImages.push(placeImages[placeImageIndex++]);
            }
            
            // Only update if we have images (either existing or new)
            if (newPlaceImages.length > 0 || existingPlaceImages.length > 0) {
              updatedPlace.images = newPlaceImages;
            } else if (!updatedPlace.images) {
              // Initialize empty array if no images exist
              updatedPlace.images = [];
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

// State mapping for each region
const getStatesForRegion = (region) => {
  const regionLower = (region || '').toLowerCase();
  const stateMap = {
    'north': [
      "Uttar Pradesh",
      "Uttarakhand",
      "Himachal Pradesh",
      "Punjab",
      "Haryana",
      "Jammu & Kashmir",
      "Ladakh",
      "Delhi",
      "Chandigarh"
    ],
    'east': [
      "West Bengal",
      "Odisha",
      "Jharkhand",
      "Bihar",
      "Sikkim",
      "Assam",
      "Arunachal Pradesh",
      "Manipur",
      "Meghalaya",
      "Mizoram",
      "Nagaland",
      "Tripura",
      "Chhattisgarh"
    ],
    'west': [
      "Gujarat",
      "Maharashtra",
      "Goa",
      "Madhya Pradesh",
      "Rajasthan",
      "Dadra & Nagar Haveli and Daman & Diu"
    ],
    'south': [
      "Tamil Nadu",
      "Karnataka",
      "Kerala",
      "Andhra Pradesh",
      "Telangana",
      "Puducherry",
      "Lakshadweep",
      "Andaman & Nicobar Islands"
    ],
  };
  
  // Match region (case-insensitive, handle variations like "north india", "north", etc.)
  if (regionLower.includes('north')) {
    return stateMap['north'] || [];
  } else if (regionLower.includes('east')) {
    return stateMap['east'] || [];
  } else if (regionLower.includes('west')) {
    return stateMap['west'] || [];
  } else if (regionLower.includes('south')) {
    return stateMap['south'] || [];
  }
  
  return [];
};

// Get states with destinations for a specific region
export const GetRegionStates = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the region data to find region name
    const region = await ExploreDestination.findById(id);
    if (!region || region.type !== 'region') {
      return res.status(404).json({ status: false, message: "Region not found" });
    }
    
    const regionName = (region.region || region.name || '').toLowerCase();
    
    // Get ALL region documents with same region name (because each state has separate document)
    // Example: Multiple documents with region: "North India" but different states
    const regionDocuments = await ExploreDestination.find({
      type: 'region',
      region: new RegExp(regionName, 'i'),
      status: 'active'
    });
    
    console.log(`Found ${regionDocuments.length} region documents for region: ${regionName}`);
    
    // Group by state: Create a map where key is state name and value is array of placesDetails
    const stateMap = {};
    
    // Process all region documents
    regionDocuments.forEach(doc => {
      const stateName = doc.state;
      if (!stateName) return;
      
      // Initialize state in map if not exists
      if (!stateMap[stateName]) {
        stateMap[stateName] = [];
      }
      
      // Add all placesDetails from this document to the state's array
      if (doc.placesDetails && Array.isArray(doc.placesDetails) && doc.placesDetails.length > 0) {
        doc.placesDetails.forEach(place => {
          stateMap[stateName].push({
            _id: place._id || `${doc._id}-${place.placeName || place.name || Math.random()}`,
            id: place._id || `${doc._id}-${place.placeName || place.name || Math.random()}`,
            name: place.placeName || place.name || '',
            location: place.location || `${stateName}`,
            rating: place.rating || 4.5,
            description: place.description || place.weatherInfo || '',
            image: place.image || place.images?.[0] || doc.image || '/explore-destination/default.png',
            images: place.images || (place.image ? [place.image] : []) || []
          });
        });
      }
    });
    
    // Also check popular destinations with state field matching this region's states
    const statesList = getStatesForRegion(regionName);
    const popularDestinations = await ExploreDestination.find({
      type: 'popular',
      status: 'active'
    });
    
    popularDestinations.forEach(dest => {
      const destState = dest.state;
      if (!destState) return;
      
      // Check if this destination's state belongs to this region
      const stateNameLower = destState.toLowerCase();
      const belongsToRegion = statesList.some(state => 
        state.toLowerCase() === stateNameLower
      );
      
      if (belongsToRegion) {
        // Initialize state in map if not exists
        if (!stateMap[destState]) {
          stateMap[destState] = [];
        }
        
        // Add popular destination to state's array
        stateMap[destState].push({
          _id: dest._id,
          id: dest._id,
          name: dest.name || '',
          location: dest.location || '',
          rating: dest.rating || 4.5,
          description: dest.description || dest.desc || '',
          image: dest.image || dest.images?.[0] || '/explore-destination/default.png',
          images: dest.images || (dest.image ? [dest.image] : []) || []
        });
      }
    });
    
    // Convert stateMap to array format
    const statesData = Object.keys(stateMap).map(stateName => {
      // Remove duplicates based on _id
      const uniqueDestinations = stateMap[stateName].filter((dest, index, self) =>
        index === self.findIndex(d => d._id === dest._id)
      );
      
      return {
        name: stateName,
        state: stateName,
        destinations: uniqueDestinations
      };
    }).filter(state => state.destinations.length > 0); // Only include states with destinations
    
    return res.json({
      status: true,
      data: {
        region: region.region || region.name,
        states: statesData
      }
    });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

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
        { category: new RegExp(search, "i") },
        { region: new RegExp(search, "i") },
        { state: new RegExp(search, "i") },
        { "placesDetails.placeName": new RegExp(search, "i") },
      ];

    const data = await ExploreDestination.find(q).sort({ createdAt: -1 });

    return res.json({ status: true, data });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};
