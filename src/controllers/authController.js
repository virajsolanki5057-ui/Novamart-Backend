import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      provider: "local",
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user,
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(400).json({
        msg: "Please login with Google",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

export const googleLogin = async (req, res) => {
  try {
    console.log("📥 Incoming Google Login Request Body:", req.body);
    
    // Check if frontend sent a token OR raw user data
    const { token, name: bodyName, email: bodyEmail, avatar: bodyAvatar, providerId: bodyProviderId } = req.body;

    let email, name, provider_id, avatar;

    if (token) {
      // 1. If frontend sends the actual Google JWT Token, verify it securely
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      provider_id = payload.sub;
      avatar = payload.picture;
    } else if (bodyEmail && bodyName) {
      // 2. Fallback: If frontend already processed the OAuth and just sends the profile
      email = bodyEmail;
      name = bodyName;
      provider_id = bodyProviderId || "google-auth";
      avatar = bodyAvatar;
    } else {
      return res.status(400).json({ msg: "Token or valid user profile data is required" });
    }

    // 3. Search for user by provider_id OR email
    let user = await User.findOne({
      $or: [{ provider_id, provider: "google" }, { email }],
    });

    if (user) {
      // User exists, just update their details if they were missing
      if (!user.provider_id) {
        user.provider = "google";
        user.provider_id = provider_id;
        user.avatar = user.avatar || avatar;
        await user.save();
      } else if (user.provider !== "google") {
        return res.status(400).json({
          msg: `Please login using your ${user.provider || "local"} account.`,
        });
      }
    } else {
      // 4. USER DOES NOT EXIST -> CREATE AND STORE IN DATABASE
      user = await User.create({
        name,
        email,
        avatar,
        provider_id,
        provider: "google",
      });
      console.log("✅ New Google User Stored in Database:", user.email);
    }

    const jwtToken = generateToken(user);

    res.json({
      success: true,
      token: jwtToken,
      user,
    });
  } catch (err) {
    console.error("❌ GOOGLE LOGIN ERROR:", err);
    res.status(500).json({ msg: "Failed to process Google Login", error: err.message });
  }
};