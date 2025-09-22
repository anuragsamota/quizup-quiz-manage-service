//database/conn.js

import mongoose from "mongoose";
import { config } from 'dotenv';
config();

export default async function connect(){
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database Connected");
    } catch (error) {
        console.log("Invalid Database Connection");
    }
}