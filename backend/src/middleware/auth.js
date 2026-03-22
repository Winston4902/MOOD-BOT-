// backend/src/middleware/auth.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

export default function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token missing" });
    }
    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id };
    return next();
  } catch (err) {
    console.warn("Auth verify error:", err && err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
