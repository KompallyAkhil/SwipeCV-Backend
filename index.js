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
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import User from "./models/User.js";

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

// Create HTTP server and Socket.IO
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket.io",
});

// helper: compute dashboard stats for a username
async function computeDashboard(username) {
  const user = await User.findOne({ name: username });
  if (!user) return null;

  const likes = await User.find({ "liked.name": username }).then((docs) =>
    docs.reduce((acc, u) => acc + u.liked.filter((r) => r.name === username).length, 0)
  );
  const dislikes = await User.find({ "disliked.name": username }).then((docs) =>
    docs.reduce((acc, u) => acc + u.disliked.filter((r) => r.name === username).length, 0)
  );

  return {
    totalLikes: likes,
    totalDislikes: dislikes,
    totalViews: likes + dislikes,
    hasResume: user.resumes.length > 0,
  };
}

// helper: compute available resumes for swiper
async function computeResumesFor(username) {
  let user = await User.findOne({ name: username });
  if (!user) return [];

  const swipedIds = [
    ...user.liked.map((r) => r.resumeId),
    ...user.disliked.map((r) => r.resumeId),
  ];

  const others = await User.find({ name: { $ne: username } });
  const resumes = others.flatMap((u) =>
    u.resumes
      .filter((r) => !swipedIds.includes(r.cloudinaryId))
      .map((r) => ({ name: u.name, ...r.toObject() }))
  );
  return resumes;
}

io.on("connection", (socket) => {
  const username = socket.handshake.auth?.username;
  if (username) {
    socket.join(`user:${username}`);
  }

  socket.on("resumes:fetch", async (payload) => {
    const userFor = payload?.username || username;
    if (!userFor) return;
    try {
      const resumes = await computeResumesFor(userFor);
      socket.emit("resumes:batch", resumes);
    } catch (e) {
      console.error("resumes:fetch error", e);
    }
  });

  socket.on("dashboard:fetch", async (payload) => {
    const userFor = payload?.username || username;
    if (!userFor) return;
    try {
      const stats = await computeDashboard(userFor);
      if (stats) socket.emit("dashboard:update", stats);
    } catch (e) {
      console.error("dashboard:fetch error", e);
    }
  });
});

// expose io to routes
app.set('io', io);

app.use("/uploadResume", uploadResumeRouter);

app.use("/getResumes", getResumesRouter);

app.use("/api/dashboard", dashBoardRouter);

app.use("/swipeResume", swipeResumeRouter);

app.use("/likedResumes", getLikedResumesRouter);

app.use("/api", getAllResumeDetailsRouter);

httpServer.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

