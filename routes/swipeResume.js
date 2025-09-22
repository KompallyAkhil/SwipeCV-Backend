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

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      // remove the swiped resume from the swiper's queue
      io.to(`user:${currentUser}`).emit('resumes:removed', { cloudinaryId: resume.cloudinaryId });

      // refresh liked resumes list for swiper
      io.to(`user:${currentUser}`).emit('likedResumes:refresh');

      // update dashboard for the resume owner (their likes/dislikes changed)
      try {
        const ownerStatsLikes = await User.find({ "liked.name": resumeOwner }).then((docs) =>
          docs.reduce((acc, u) => acc + u.liked.filter((r) => r.name === resumeOwner).length, 0)
        );
        const ownerStatsDislikes = await User.find({ "disliked.name": resumeOwner }).then((docs) =>
          docs.reduce((acc, u) => acc + u.disliked.filter((r) => r.name === resumeOwner).length, 0)
        );
        const owner = await User.findOne({ name: resumeOwner });
        if (owner) {
          io.to(`user:${resumeOwner}`).emit('dashboard:update', {
            totalLikes: ownerStatsLikes,
            totalDislikes: ownerStatsDislikes,
            totalViews: ownerStatsLikes + ownerStatsDislikes,
            hasResume: owner.resumes.length > 0,
          });
        }
      } catch (e) {
        console.error('Error emitting dashboard update:', e);
      }
    }

    res.json({ message: `Resume ${action}d successfully!` });
  } catch (error) {
    console.error("Error saving swipe:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;