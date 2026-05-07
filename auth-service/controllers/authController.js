const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const allowedRoles = ["admin", "customer"];

const successResponse = (res, status, message, data = {}) => {
  return res.status(status).json({
    success: true,
    message,
    data
  });
};

const errorResponse = (res, status, message, errors = []) => {
  return res.status(status).json({
    success: false,
    message,
    errors
  });
};

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role
});

const register = async (req, res) => {
  try {
    const { name, email, password, role = "customer" } = req.body;
    const errors = [];

    if (!name) errors.push("Name is required");
    if (!email) errors.push("Email is required");
    if (!password) errors.push("Password is required");
    if (role && !allowedRoles.includes(role)) errors.push("Role must be admin or customer");

    if (errors.length > 0) {
      return errorResponse(res, 400, "Validation error", errors);
    }

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return errorResponse(res, 400, "Email is already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    return successResponse(res, 201, "User registered successfully", sanitizeUser(user));
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      return errorResponse(
        res,
        400,
        "Validation error",
        error.errors.map((item) => item.message)
      );
    }

    return errorResponse(res, 500, "Failed to register user");
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const errors = [];

    if (!email) errors.push("Email is required");
    if (!password) errors.push("Password is required");

    if (errors.length > 0) {
      return errorResponse(res, 400, "Validation error", errors);
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return errorResponse(res, 401, "Invalid email or password");
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return errorResponse(res, 401, "Invalid email or password");
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "24h"
      }
    );

    return successResponse(res, 200, "Login successful", {
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return errorResponse(res, 500, "Failed to login");
  }
};

module.exports = {
  register,
  login
};
