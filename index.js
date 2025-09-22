import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import getResumesRouter from "./routes/getResumes.js";
import dashBoardRouter from "./routes/dashBoard.js";
import swipeResumeRouter from "./routes/swipeResume.js";
import uploadResumeRouter from "./routes/uploadResume.js";
import getAllResumeDetailsRouter from "./routes/getAllResumeDetails.js";
import getLikedResumesRouter from "./routes/getLikedResumes.js";

const allowOrigins = ['http://localhost:5173', 'https://swipecv.vercel.app', 'https://swipecv.akhilkompally.app'];
dotenv.config();
const app = express();
app.options('*', cors());
app.use(cors({
  origin : allowOrigins,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  credentials: true,
}));
app.use(express.json());
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${process.env.DB_NAME}`);
    console.log("Connected to MongoDB !!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
})();


app.use("/uploadResume", uploadResumeRouter);

app.use("/getResumes", getResumesRouter);

app.use("/api/dashboard", dashBoardRouter);

app.use("/swipeResume", swipeResumeRouter);

app.use("/likedResumes", getLikedResumesRouter);

app.use("/api", getAllResumeDetailsRouter);

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
