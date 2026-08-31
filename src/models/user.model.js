import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    company: { type: String, trim: true },
    address: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    gender: {
  type: String,
  required: true,
  enum: ["male", "female", "other", "Male", "Female", "Other"],
},
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    userName: { type: String, trim: true },
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
    },
    roles: {
      type: String,
      enum: ["user", "driver", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

// Mongoose automatically pluralizes "User" to the "users" collection
const User = mongoose.model("User", userSchema);

export default User;