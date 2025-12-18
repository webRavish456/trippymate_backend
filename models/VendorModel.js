// import mongoose from "mongoose";

// const VendorSchema = new mongoose.Schema({
//     // Personal Details
//     name: {
//         type: String,
//         required: true
//     },
//     username: {
//         type: String
//     },
//     email: {
//         type: String
//     },
//     address: {
//         type: String
//     },
//     typeOfId: {
//         type: String   // e.g., Passport, Aadhaar, Driver's License
//     },
//     idNumber: {
//         type: String
//     },

//     // Business Details
//     businessName: {
//         type: String
//     },
//     businessType: {
//         type: String
//     },
//     businessRegistrationNo: {
//         type: String
//     },
//     gstNo: {
//         type: String
//     },
//     description: {
//         type: String
//     },
//     operatingHours: {
//         type: String
//     },

//     // File Uploads
//     companyLogo: {
//         filename: String,
//         path: String,
//         mimetype: String,
//         size: Number
//     },
//     businessProof: {
//         filename: String,
//         path: String,
//         mimetype: String,
//         size: Number
//     },
//     vendorGovernmentId: {
//         filename: String,
//         path: String,
//         mimetype: String,
//         size: Number
//     },

//     // System Fields
//     password: {
//         type: String
//     },
//     status: {
//         type: String,
//         required: true,
//         default: "Inactive"
//     }
// },
// { timestamps: true });

// const Vendor = mongoose.model("Vendor", VendorSchema);

// export default Vendor




import mongoose from "mongoose";

const VendorSchema = new mongoose.Schema({
    // Personal details
    name: {
        type: String,
        required: true
    },
    username:{
        type:String
    },
    password:{
        type:String
    },
    address: {
        type: String
    },
    email: {
        type: String,
        required: true
    },
    typeOfId: {
        type: String
    },
    idNumber: {
        type: String
    },

    // Business details
    businessName: {
        type: String,
        required: true
    },
    businessType: {
        type: String
    },
    vendorType: {
        type: String,
        enum: ['hotel', 'transport', 'activity', 'food', 'event'],
        default: 'hotel'
    },
    // Hotel specific fields
    hotelDetails: {
        roomTypes: [{
            type: {
                type: String // Deluxe, Standard, Suite
            },
            pricePerNight: Number,
            capacity: Number,
            amenities: [String]
        }],
        mealPlans: [{
            type: {
                type: String, // EP, CP, MAP, AP
                enum: ['EP', 'CP', 'MAP', 'AP']
            },
            price: Number
        }],
        amenities: [String],
        checkInTime: String,
        checkOutTime: String,
        policies: String
    },
    // Transport specific fields
    transportDetails: {
        vehicleTypes: [{
            type: {
                type: String, // Sedan, SUV, Tempo Traveller, Bus
                enum: ['sedan', 'suv', 'tempo_traveller', 'bus', 'other']
            },
            perKmCost: Number,
            perDayCost: Number,
            capacity: Number,
            driverIncluded: Boolean,
            vehicleImages: [String]
        }],
        driverDetails: {
            name: String,
            licenseNumber: String,
            phone: String,
            experience: Number
        },
        availability: {
            type: Boolean,
            default: true
        }
    },
    // Activity specific fields
    activityDetails: {
        activityType: {
            type: String,
            enum: ['trek', 'scuba_diving', 'rafting', 'safari', 'camping', 'paragliding', 'bungee_jumping', 'other']
        },
        perPersonCost: Number,
        minAge: Number,
        maxAge: Number,
        safetyRequirements: [String],
        duration: String, // e.g., "2 hours", "Full day"
        groupSize: {
            min: Number,
            max: Number
        },
        equipmentProvided: Boolean,
        guideIncluded: Boolean
    },
    // Food/Restaurant specific fields
    foodDetails: {
        mealPackages: [{
            name: String,
            description: String,
            price: Number,
            items: [String]
        }],
        perPlateRates: {
            breakfast: Number,
            lunch: Number,
            dinner: Number
        },
        cuisineTypes: [String], // Indian, Chinese, Continental, etc.
        specialties: [String],
        capacity: Number,
        servingHours: String
    },
    // Event specific fields
    eventDetails: {
        services: [{
            type: {
                type: String,
                enum: ['dj_music', 'decor', 'local_performers', 'event_setup', 'photography', 'catering', 'other']
            },
            description: String,
            price: Number
        }],
        eventTypes: [String], // Wedding, Corporate, Birthday, etc.
        capacity: Number,
        equipmentProvided: [String]
    },
    businessRegistrationNo: {
        type: String
    },
    gstNo: {
        type: String
    },
    description: {
        type: String
    },
    operatingHours: {
        type: String
    },

    // File uploads
    companyLogo: {
        filename: String,
        path: String,
        publicId: String,
        mimetype: String,
        size: Number
    },
    businessProof: {
        filename: String,
        path: String,
        publicId: String,
        mimetype: String,
        size: Number
    },
    vendorGovernmentId: {
        filename: String,
        path: String,
        publicId: String,
        mimetype: String,
        size: Number
    },
    aadhaarCard: {
        filename: String,
        path: String,
        publicId: String,
        mimetype: String,
        size: Number
    },
    panCard: {
        filename: String,
        path: String,
        publicId: String,
        mimetype: String,
        size: Number
    },
    license: {
        filename: String,
        path: String,
        publicId: String,
        mimetype: String,
        size: Number
    },
    gstCertificate: {
        filename: String,
        path: String,
        publicId: String,
        mimetype: String,
        size: Number
    },
    certificate: {
        filename: String,
        path: String,
        publicId: String,
        mimetype: String,
        size: Number
    },
    otherDocument: {
        filename: String,
        path: String,
        publicId: String,
        mimetype: String,
        size: Number
    },

    // Bank Details
    bankDetails: {
        accountHolderName: {
            type: String
        },
        accountNumber: {
            type: String
        },
        ifscCode: {
            type: String
        },
        bankName: {
            type: String
        },
        branchName: {
            type: String
        },
        accountType: {
            type: String,
            enum: ['savings', 'current'],
            default: 'savings'
        },
        upiId: {
            type: String
        }
    },
    phone: {
        type: String
    },
    // Status
    status: {
        type: String,
        required: true,
        default: "Inactive"
    }
}, 
{timestamps: true});

const Vendor = mongoose.model("Vendor", VendorSchema);

export default Vendor