
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { JsonWebTokenError } = require('jsonwebtoken');
const app = express();
const PORT = 3000;


const uri = 'mongodb+srv://bohananco:Stour1120@finalwebsite.aalhuhv.mongodb.net/WebsiteData';

app.use(express.json());
app.use(cors());


mongoose.connect(uri)
  .then(() => {
    console.log("Database connected");
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  })
  .catch((error) => console.error("Connection Error:", error));


// Regulars Schema
const regularssSchema = new mongoose.Schema({
  username: String,
  password: String,
});
// Comment Schema
const commentsSchema = new mongoose.Schema({
  profilepic: String,
  username: String,
  comment: String,
  id: String,
});
// User-account Schema
const usersSchema = new mongoose.Schema({
  username: String,
  profilepic: String,
  tags: [String],
  description: String,
  joined: String,
});

// User-post Schema
const userpostSchema = new mongoose.Schema({
  image: String,
  game: String,
  post: String,
  poster: String,
  avatar: String,
  datacategory: String,
  id: String,
  description: String,
});


const UserPostModel = mongoose.model("userposts", userpostSchema, "userposts");
const CommentModel = mongoose.model("comment", commentsSchema, "comments");
const UserModel = mongoose.model("user", usersSchema, "users");


app.get("/Posts", async (req, res) => {
  try {
    const data = await UserPostModel.find();
    res.json(data);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});
app.post("/Posts", async (req, res) => {
  try {
    const newPost = new UserPostModel(req.body);
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});
app.get("/Comments", async (req, res) => {
  try {
    const data = await CommentModel.find();
    res.json(data);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

app.get("/Users", async (req, res) => {
  try {
    const data = await UserModel.find();
    res.json(data);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
app.post("/Regulars/login", async (req, res) => {
  const user = regulars.find(regular => regular.name === req.body.name);

  
  if (!user) {
    return res.status(400).send('Cannot find user'); 
  }

  try {
   
    if (await compare(req.body.password, user.password)) {
      res.send("good to go");
      const accesstoken = jwt.sign(user, process.env.ACCESS_TOKEN_LOGIN)
      res.json({accesstoken: accesstoken})

    } else {
      res.send("nope try again");
    }
  } catch (error) {
    
    console.error("Login error:", error);
    res.status(500).send("Server error during login"); 
  }
});

app.get("/Posts/:id", async (req, res) => {
  try {
    const post = await UserPostModel.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Error fetching post" });
  }
});

app.put("/Posts/:id", async (req, res) => {
  try {
    const updatedPost = await UserPostModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators:true }
    );
    if (!updatedPost) return res.status(404).json({ error: "Post not found" });
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ error: "Failure to submit post" });
  }
});

app.delete("/Posts/:id", async (req, res) => {
  try {
    const deletedPost = await UserPostModel.findByIdAndDelete(req.params.id);
    if (!deletedPost) return res.status(404).json({ error: "Post not found" });
    res.json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failure to delete post" });
  }
});

app.post("/Comments", async (req, res) => {
  try {
    const newComment = new CommentModel(req.body);
    const savedComment = await newComment.save();
    res.status(201).json(savedComment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
});
app.get("/Comments/:id", async (req, res) => {
  try {
    const postComments = await CommentModel.find({ id: req.params.id });
    res.json(postComments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comments for post" });
  }
});



