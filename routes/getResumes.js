import express from "express";
import User from "../models/User.js";
import mongoose from "mongoose";

const router = express.Router();

router.get("/:user", async (req, res) => {
  const { user: username } = req.params;

  try {
    let user = await User.findOne({ name: username }); // use let here
    if (!user) {
      user = await User.create({
        userId: new mongoose.Types.ObjectId().toString(),
        name: username,
        resumes: [],
        liked: [],
        disliked: [],
      });
    }

    const swipedIds = [
      ...user.liked.map((r) => r.resumeId),
      ...user.disliked.map((r) => r.resumeId),
    ];

    const others = await User.find({ name: { $ne: username } });

    const resumes = others.flatMap((u) =>
      u.resumes
        .filter((r) => !swipedIds.includes(r.cloudinaryId))
        .map((r) => ({
          name: u.name,
          ...r.toObject(),
        }))
    );

    res.json(resumes);
  } catch (error) {
    console.error("Error fetching resumes:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
