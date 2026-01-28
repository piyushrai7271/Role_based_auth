import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "./src/middlewars/error.middleware.js";
const app = express();

app.use(helmet({
    contentSecurityPolicy:false,
    crossOriginEmbedderPolicy:false
}));
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());

// import routes..
import userRoute from "./src/routes/user.routes.js";

// api routes....
app.use("/api/auth", userRoute);
app.use(errorMiddleware);

export default app;
