import mongoose from 'mongoose'


const userSchema = new mongoose.Schema({
  userId: String,
  name: String,
  resumes: [
    {
      title: String,
      url: String,
      uploadedAt: Date,
      cloudinaryId: String,
    },
  ],
  liked : [
    {
      name : String,
      resumeId : String,
      url : String,
      title : String,
      likedAt : Date,
    }
  ],
  disliked : [
    {
      name : String,
      resumeId : String,
      url : String,
      title : String,
      dislikedAt : Date,
    }
  ]
});
const User = mongoose.model("swipeCV", userSchema);
export default User;
