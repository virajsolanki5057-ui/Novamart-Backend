import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

export const isGoogleOAuthConfigured = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const resolveGoogleCallbackUrl = () => {
  if (process.env.GOOGLE_CALLBACK_URL) {
    return process.env.GOOGLE_CALLBACK_URL;
  }

  const backendBase = process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL;
  if (backendBase) {
    return `${backendBase.replace(/\/$/, "")}/api/auth/google/callback`;
  }

  return "http://localhost:5000/api/auth/google/callback";
};

if (isGoogleOAuthConfigured()) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: resolveGoogleCallbackUrl(),
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile?.emails?.[0]?.value?.toLowerCase();
          const providerId = profile?.id;
          const name = profile?.displayName || email?.split("@")[0] || "Google User";
          const avatar = profile?.photos?.[0]?.value || null;

          if (!email || !providerId) {
            return done(new Error("Google account did not provide required profile data."));
          }

          let user = await User.findOne({
            $or: [{ provider: "google", provider_id: providerId }, { email }],
          });

          if (user) {
            if (user.provider !== "google" && user.password) {
              return done(null, false, {
                message: `Please login using your ${user.provider || "local"} account.`,
              });
            }

            user.provider = "google";
            user.provider_id = providerId;
            user.avatar = user.avatar || avatar;
            user.name = user.name || name;
            await user.save();
            return done(null, user);
          }

          user = await User.create({
            name,
            email,
            avatar,
            provider: "google",
            provider_id: providerId,
          });

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
} else {
  console.warn(
    "Google OAuth disabled: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend environment variables."
  );
}

export default passport;
