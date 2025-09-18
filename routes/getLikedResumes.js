import express from 'express';
import User from '../models/User.js';

const router = express.Router();

router.get('/:user', async(req,res) => {
    const { user: username } = req.params;
    try{
        const user = await User.findOne({ name: username });
        if(!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const likedIds = user.liked.map((like) => like.resumeId);
        const others = await User.find({"resumes.cloudinaryId": { $in: likedIds }});

        const likedResumes = others.flatMap((u) =>
            u.resumes
                .filter((r) => likedIds.includes(r.cloudinaryId))
                .map((r) => ({
                    name: u.name,
                    email: u.email,
                    ...r.toObject(),
                }))
        );

        res.json(likedResumes);
    }
    catch(error){
        console.error('Error fetching liked resumes:', error);
        res.status(500).json({ error: error.message });
    }
})

export default router;