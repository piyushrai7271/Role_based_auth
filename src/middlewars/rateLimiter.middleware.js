import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "../config/redis.js";
import rateLimitHandler from "../utils/rateLimitHandler.js";

// GLOBAL limiter
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  // method to generate custom identifer for client
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req.ip);
    return req.userId ? `${ip}:${req.userId}` : ip;
  },
  // help to unable new header stander
  standardHeaders: true,
  // help to block previous header of x-Header 
  legacyHeaders: false, 
  // this line is for giving proper message in response
  handler: rateLimitHandler,
  // this is for storing attampts
  store: new RedisStore({
    // used for making different limiter in one redis store
    prefix: "rl:global:", 
   // all the variable store in key value so, to run them we need sendCommand
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
});

// LOGIN / AUTH limiter (strict)
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,

  standardHeaders: true,
  legacyHeaders: false,

  message: "Too many login attempts. Try again later.",

  handler: rateLimitHandler,

  store: new RedisStore({
    prefix: "rl:auth:",
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
});



export { globalRateLimiter, authRateLimiter };
