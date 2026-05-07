const jwt = require("jsonwebtoken");

const errorResponse = (res, status, message, errors = []) => {
  return res.status(status).json({
    success: false,
    message,
    errors
  });
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse(res, 401, "Authentication token is required");
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return errorResponse(res, 401, "Invalid or expired token");
  }
};

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, "Authentication token is required");
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 403, "You do not have permission to access this resource");
    }

    return next();
  };
};

module.exports = {
  verifyToken,
  authorizeRole
};
