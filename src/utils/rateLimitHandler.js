const rateLimitHandler = (req, res, options) => {
  return res.status(429).json({
    success: false,
    error: "RATE_LIMIT_EXCEEDED",
    message: options.message || "Too many requests, please try again later.",
    retryAfter: res.getHeader("Retry-After"), // seconds
    limit: res.getHeader("RateLimit-Limit"),
    remaining: res.getHeader("RateLimit-Remaining"),
    resetAt: res.getHeader("RateLimit-Reset"),
  });
};

export default rateLimitHandler;
