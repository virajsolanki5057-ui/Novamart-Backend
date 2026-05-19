import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

const getFrontendUrl = () => (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

const sanitizeRedirectPath = (path) => {
  if (!path || typeof path !== "string") return "/";
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
};

const buildFrontendLoginUrl = ({ redirect, token, error }) => {
  const url = new URL("/login", `${getFrontendUrl()}/`);
  const safeRedirect = sanitizeRedirectPath(redirect);

  if (token) url.searchParams.set("oauth_token", token);
  if (error) url.searchParams.set("oauth_error", error);
  if (safeRedirect !== "/") url.searchParams.set("redirect", safeRedirect);

  return url.toString();
};

const encodeState = (redirectPath) =>
  Buffer.from(JSON.stringify({ redirect: sanitizeRedirectPath(redirectPath) })).toString("base64url");

const decodeState = (state) => {
  if (!state || typeof state !== "string") return "/";

  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    return sanitizeRedirectPath(parsed.redirect);
  } catch {
    return "/";
  }
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

    return res.status(201).json({
      success: true,
      token,
      user,
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
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

    return res.json({
      success: true,
      token,
      user,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const startGoogleAuth = (req, res, next) => {
  const requestedRedirect = sanitizeRedirectPath(req.query.redirect);
  const state = encodeState(requestedRedirect);

  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state,
  })(req, res, next);
};

export const googleCallback = (req, res, next) => {
  const redirectPath = decodeState(req.query.state);

  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err || !user) {
      const errorMessage = info?.message || err?.message || "Google login failed";
      return res.redirect(buildFrontendLoginUrl({ redirect: redirectPath, error: errorMessage }));
    }

    const token = generateToken(user);
    return res.redirect(buildFrontendLoginUrl({ redirect: redirectPath, token }));
  })(req, res, next);
};

export const googleLogin = async (req, res) => {
  try {
    const {
      token,
      idToken,
      name: bodyName,
      email: bodyEmail,
      avatar: bodyAvatar,
      providerId: bodyProviderId,
    } = req.body || {};

    const rawToken = token || idToken;
    let email;
    let name;
    let provider_id;
    let avatar;

    if (rawToken) {
      const ticket = await client.verifyIdToken({
        idToken: rawToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      email = payload?.email?.toLowerCase();
      name = payload?.name;
      provider_id = payload?.sub;
      avatar = payload?.picture || null;
    } else if (bodyEmail && bodyName) {
      email = String(bodyEmail).toLowerCase();
      name = bodyName;
      provider_id = bodyProviderId || "google-auth";
      avatar = bodyAvatar || null;
    } else {
      return res.status(400).json({ msg: "Token or valid user profile data is required" });
    }

    if (!email || !provider_id) {
      return res.status(400).json({ msg: "Google profile is missing required fields" });
    }

    let user = await User.findOne({
      $or: [{ provider: "google", provider_id }, { email }],
    });

    if (user) {
      if (user.provider !== "google" && user.password) {
        return res.status(400).json({
          msg: `Please login using your ${user.provider || "local"} account.`,
        });
      }

      user.provider = "google";
      user.provider_id = provider_id;
      user.avatar = user.avatar || avatar;
      user.name = user.name || name;
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        avatar,
        provider_id,
        provider: "google",
      });
    }

    const jwtToken = generateToken(user);

    return res.json({
      success: true,
      token: jwtToken,
      user,
    });
  } catch (err) {
    console.error("GOOGLE LOGIN ERROR:", err);
    return res.status(500).json({ msg: "Failed to process Google login", error: err.message });
  }
};
