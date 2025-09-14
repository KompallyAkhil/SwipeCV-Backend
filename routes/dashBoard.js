import express from 'express';
import User from '../models/User.js';

const router = express.Router();

router.get("/:username",async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ name: username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const likes = await User.find({
      "liked.name": username,
    }).then((docs) =>
      docs.reduce(
        (acc, u) =>
          acc + u.liked.filter((r) => r.name === username).length,
        0
      )
    );

    const dislikes = await User.find({
      "disliked.name": username,
    }).then((docs) =>
      docs.reduce(
        (acc, u) =>
          acc + u.disliked.filter((r) => r.name === username).length,
        0
      )
    );

    res.json({
      totalLikes: likes,
      totalDislikes: dislikes,
      totalViews: likes + dislikes,
      hasResume: user.resumes.length > 0,
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;