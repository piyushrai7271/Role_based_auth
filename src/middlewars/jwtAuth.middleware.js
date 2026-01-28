import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const jwtValidation = async (req, res, next) => {
  try {
    // 1. Get token (cookie OR header)
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: access token missing",
      });
    }

    // 2. Verify token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // 3. (Optional but good) check if user still exists
    const userExists = await User.exists({ _id: decodedToken._id });
    if (!userExists) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user does not exist",
      });
    }

    // 4. Attach decoded data to request
    req.user = decodedToken;
    // req.user = { _id, fullName, email, role }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: invalid or expired token",
    });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. jwtValidation must run before this
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user not authenticated",
      });
    }

    // 2. Role check
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: you do not have permission to access this resource",
      });
    }

    // 3. Permission granted
    next();
  };
};

export { jwtValidation, authorizeRoles };
