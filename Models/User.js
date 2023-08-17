const mongoose = require("mongoose");
const userSchema = mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  username: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  reviews: [
    {
      title: String,
      content: String,
    },
  ],
});
module.exports = mongoose.model("User", userSchema);
