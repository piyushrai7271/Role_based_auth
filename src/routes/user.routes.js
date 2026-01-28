import express from "express";
import {data} from "../controllers/user.controller.js"
const router = express.Router();


router.post("/data",data);


export default router;