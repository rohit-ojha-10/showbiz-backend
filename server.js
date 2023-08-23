const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
require("dotenv").config();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
mongoose
  .connect(process.env.DATABASE_URL, { useNewUrlParser: true })
  .then((res) => console.log("connected"));
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("database connected"));
app.use(express.json());
const user = require("./Models/User");

let refreshTokens = [];
app.listen(process.env.PORT || 4000, () => {
  console.log("running");
});
app.get("/my-reviews", authenticateToken, async (req, res) => {
  try {
    const id = req.query.id;
    const curr_user = await user.findOne({ _id: id });
    return res.send({ success: true, reviews: curr_user.reviews });
  } catch (error) {
    res.send({ success: false });
  }
});
app.get("/all-reviews", authenticateToken, async (req, res) => {
  try {
    const allData = await user.find({}, { reviews: 1, name: 1 });
    const allReviews = allData.flatMap((obj) => {
      return { reviews: obj.reviews, name: obj.name };
    });
    return res.send({ success: true, reviews: allReviews });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "reviews not fetched" });
  }
});
app.get("/get-users", authenticateToken, async (req, res) => {
  try {
    if (req.authenticated?.success) {
      return res.json({ success: true, username: req.authenticated.payload });
    } else return res.json(req.authenticated);
  } catch (error) {
    return res.json(error);
  }
});
app.get("/refresh-token", async (req, res) => {
  try {
    const refreshToken = req.headers["authorization"];
    console.log(refreshToken);
    if (refreshToken == null) {
      console.log(refreshToken);
      return res.json({ success: false });
    }
    if (refreshTokens.includes(refreshToken)) {
      let username;
      jwt.verify(
        refreshToken,
        process.env.REFRESH_WEB_TOKEN,
        (err, payload) => {
          if (err)
            return res.json({ success: false, message: "Invalid Token" });
          username = payload.username;
          const authToken = jwt.sign(
            { username: username },
            process.env.ACCESS_WEB_TOKEN,
            { expiresIn: "20m" }
          );
          const newRefreshToken = jwt.sign(
            { username: username },
            process.env.REFRESH_WEB_TOKEN
          );
          refreshTokens.push(newRefreshToken);
          return res.json({
            success: true,
            authToken: authToken,
            refreshToken: newRefreshToken,
          });
        }
      );
    } else {
      console.log("here");
      return res.json({ success: false });
    }
  } catch (error) {
    console.log(error);
    return res.json(error);
  }
});
app.get("/authenticate", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null)
      return res.json({ success: false, message: "Invalid Token" });
    jwt.verify(token, process.env.ACCESS_WEB_TOKEN, (err, payload) => {
      if (err) return res.json({ success: false, message: err });
      return res.json({ success: true, payload: payload.username });
    });
  } catch (error) {
    return res.json(error);
  }
});
app.post("/create-user", async (req, res) => {
  try {
    const data = req.body;
    const { name, email, username, password } = data;
    const new_user = new user({
      name: name,
      email: email,
      username: username,
      password: password,
    });
    await new_user.save();
    console.log(new_user);
    const check = user.findOne({ name: new_user.name });
    console.log(check);
    res.json({ success: true, data: check.data });
  } catch (error) {
    res.json(error);
  }
});
app.post("/add-review", authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    const { title, content, rating } = data;
    const username = req.authenticated.payload;
    const current_user = await user.findOne({ username: username });
    console.log(current_user);
    current_user.reviews.push({
      title: title,
      rating: rating,
      content: content,
    });
    await current_user.save();
    const check = await user.findOne({ username: username });
    console.log(check);
    return res.json({ success: true, user: check });
  } catch (error) {
    console.log(error);
    return res.json({ error });
  }
});
app.post("/login", async (req, res) => {
  let curr_user = await user.findOne({ username: req.body.username });
  try {
    if (curr_user.password === req.body.password) {
      console.log("here");
      const token = jwt.sign(
        { username: req.body.username },
        process.env.ACCESS_WEB_TOKEN,
        { expiresIn: "20m" }
      );
      const refreshToken = jwt.sign(
        { username: req.body.username },
        process.env.REFRESH_WEB_TOKEN
      );
      refreshTokens.push(refreshToken);
      let user_id = curr_user.id;
      return res.json({
        success: true,
        authToken: token,
        refreshToken: refreshToken,
        user_id: user_id,
      });
    } else {
      console.log(password.data, req.body.password);
      return res.json({ success: false });
    }
  } catch (error) {
    console.log(error);
    return res.json(error);
  }
});
function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null)
      return res.json({ success: false, message: "Invalid Token" });
    jwt.verify(token, process.env.ACCESS_WEB_TOKEN, (err, payload) => {
      if (err) {
        return res.json({ success: false, message: err });
      }
      req.authenticated = { success: true, payload: payload.username };
      next();
    });
  } catch (error) {
    return res.json({ success: false, message: err });
  }
}
