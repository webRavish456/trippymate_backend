import mongoose from "mongoose";
import { createAdmin } from "../seedData/createAdmin.js";
import { seedRoles } from "../seedData/createRoles.js";

// mongodb+srv://teamdeveloper1993_db_user:<db_password>@trippymates.autuq8t.mongodb.net/trippymates?appName=Trippymates

const connection_string = "mongodb+srv://teamdeveloper1993_db_user:MR1Sa4Ml2ZaKgMCZ@trippymates.autuq8t.mongodb.net/trippymates?retryWrites=true&w=majority&appName=Trippymates";

export const connectDB = async () => {
  try {
  
    await mongoose.connect(connection_string, {
      family: 4,
    }).then(async ()=>{ 
      await seedRoles();
      await createAdmin();
      console.log('Connection successfull')}
    );
  } catch (error) {
    console.error("Error connecting to MongoDB Atlas:", error.message);
    throw error;
  }
};