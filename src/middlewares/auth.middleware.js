import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Check if Authorization header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  // 2. Extract token string
  const token = authHeader.split(" ")[1];

  try {
    // 3. Verify token with your secret key
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.SECRET_KEY || "YOUR_SECRET_KEY"
    );

    // 4. Attach decoded payload (user ID, etc.) to request object
    req.user = decoded;

    // 5. Pass control to the next handler/controller
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};