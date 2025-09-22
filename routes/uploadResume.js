import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });
import User from "../models/User.js";
dotenv.config();

(() => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log("Cloudinary configured successfully");
  } catch (error) {
    console.error("Error configuring Cloudinary:", error);
  }
})();

router.post("/", upload.single("resume"), async (req, res) => {
  const { resumeTitle, user , email} = req.body;
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "swipeCV",
        use_filename: true,
        unique_filename: false,
        public_id: user + "_" + (resumeTitle || "Untitled_Resume"),
        access_mode: "public",
        resource_type: "auto",
      },
      async (error, result) => {
        if (error) return res.status(500).json({ error: error.message });

        let existingUser = await User.findOne({ name: user });
        if (existingUser) {
          existingUser.resumes.push({
            title: resumeTitle || "Untitled Resume",
            url: result.secure_url,
            uploadedAt: new Date(),
            cloudinaryId: result.public_id,
          });
          await existingUser.save();
        } else {
          const newUser = await User.create({
            userId: new mongoose.Types.ObjectId().toString(),
            name: user,
            email: email,
            resumes: [
              {
                title: resumeTitle || "Untitled Resume",
                url: result.url,
                uploadedAt: new Date(),
                cloudinaryId: result.public_id,
              },
            ],
          });
          await newUser.save();
        }

        // Emit socket events
        const io = req.app.get('io');
        if (io) {
          // Ask all clients to refresh resumes lists
          io.emit('resumes:refresh');

          // Update dashboard for uploader
          try {
            const owner = await User.findOne({ name: user });
            if (owner) {
              const likes = await User.find({ "liked.name": user }).then((docs) =>
                docs.reduce((acc, u) => acc + u.liked.filter((r) => r.name === user).length, 0)
              );
              const dislikes = await User.find({ "disliked.name": user }).then((docs) =>
                docs.reduce((acc, u) => acc + u.disliked.filter((r) => r.name === user).length, 0)
              );
              io.to(`user:${user}`).emit('dashboard:update', {
                totalLikes: likes,
                totalDislikes: dislikes,
                totalViews: likes + dislikes,
                hasResume: owner.resumes.length > 0,
              });
            }
          } catch (e) {
            console.error('Error emitting dashboard after upload:', e);
          }
        }

        res.json({ message: "Resume uploaded successfully", url: result.secure_url });
      }
    );

    uploadStream.end(req.file.buffer); 
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;