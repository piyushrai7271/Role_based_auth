import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "./src/middlewars/error.middleware.js";
import { globalRateLimiter } from "./src/middlewars/rateLimiter.middleware.js";
const app = express();

app.use(helmet({
    contentSecurityPolicy:false,
    crossOriginEmbedderPolicy:false
}));
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());

// trust proxy (very Important in production)
app.set("trust proxy",1); // helps to find correct ip 
app.use(globalRateLimiter);

// import routes..
import userRoute from "./src/routes/user.routes.js";

// api routes....
app.use("/api/auth", userRoute);
app.use(errorMiddleware); // global error handler

export default app;
