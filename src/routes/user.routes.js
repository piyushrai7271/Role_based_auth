import express from "express";
import {upload} from "../config/cloudinary.js";
import {jwtValidation,authorizeRoles} from "../middlewars/jwtAuth.middleware.js";
import {
  signUp,
  login,
  logOut,
  changePassword,
  updateAvatar,
  updateUserDetails,
  deleteUser,
  getUser,
  getAllUser,
} from "../controllers/user.controller.js";
const router = express.Router();

// unauthorized routes....
router.post("/signup",upload.single("avatar"),signUp);
router.post("/login",login);

// authorized routes.....
router.post("/logout",jwtValidation,logOut);
router.patch("/change-password",jwtValidation,changePassword);
router.put("/update-avatar",jwtValidation,upload.single("avatar"),updateAvatar);
router.put("/update-user-details",jwtValidation,updateUserDetails);
router.delete("/delete-user/:id",jwtValidation,authorizeRoles("admin"),deleteUser);
router.get("/getuser",jwtValidation,getUser);
router.get("/get-all-user",jwtValidation,authorizeRoles("admin"),getAllUser);

export default router;
