import express from "express";
import User from "../models/User.js"

const router = express.Router();

// GET /api/resumes/feedback/:username
router.get("/resumes/feedback/:username", async (req, res) => {
  try {
    const { username } = req.params;

    // Step 1: Find the user
    const user = await User.findOne({ name: username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Step 2: For each resume, count likes/dislikes across all users
    const resumesWithFeedback = await Promise.all(
      user.resumes.map(async (resume) => {
        const likesCount = await User.countDocuments({
          "liked.name": username,
          "liked.title": resume.title,
        });

        const dislikesCount = await User.countDocuments({
          "disliked.name": username,
          "disliked.title": resume.title,
        });

        return {
          resumeId: resume._id,
          title: resume.title,
          url: resume.url,
          uploadedAt: resume.uploadedAt,
          cloudinaryId: resume.cloudinaryId,
          likes: likesCount,
          dislikes: dislikesCount,
        };
      })
    );

    // Step 3: Return response
    res.json({
      username,
      resumes: resumesWithFeedback,
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
