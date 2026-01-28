import mongoose from "mongoose";

const errorMiddleware = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors || [];

  // MongoDB & Mongoose Errors

  // Duplicate key error
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(", ");
    statusCode = 400;
    message = `Duplicate field value: ${fields}`;
  }

  // Invalid ObjectId (CastError)
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  }

  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Validation Error";
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Response

  const response = {
    success: false,
    message,
  };

  if (errors.length > 0) {
    response.errors = errors;
  }

  // Show stack only in development
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

const asyncHandler = (requestHandler) => {
  return (req, resp, next) => {
    Promise.resolve(requestHandler(req, resp, next))
           .catch((err) => next(err));
  };
};

export { errorMiddleware, asyncHandler };
