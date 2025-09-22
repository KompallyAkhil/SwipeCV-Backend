import express from 'express';
import User from '../models/User.js';
const router = express.Router();

router.post("/",async (req, res) => {
  const { currentUser, resumeOwner, action, resume } = req.body;

  try {
    let user = await User.findOne({ name: currentUser });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (action === "like") {
      user.liked.push({
        name: resumeOwner,
        resumeId: resume.cloudinaryId,
        url: resume.url,
        title: resume.title,
        likedAt: new Date(),
      });
    } else if (action === "dislike") {
      user.disliked.push({
        name: resumeOwner,
        resumeId: resume.cloudinaryId,
        url: resume.url,
        title: resume.title,
        dislikedAt: new Date(),
      });
    }

    await user.save();

    res.json({ message: `Resume ${action}d successfully!` });
  } catch (error) {
    console.error("Error saving swipe:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;