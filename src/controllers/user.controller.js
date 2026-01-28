import {asyncHandler} from "../middlewars/error.middleware.js";
import   ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import {
    uploadToCloudinary,
    deleteFromCloudinary
} from "../config/cloudinary.js";

const generateAccessAndRefreshToken = async(userId) =>{
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave:false});
    return {accessToken,refreshToken};
  } catch (error) {
    throw new ApiError(
      500,
      "somthing went worng while generating access and refresh token"
    )
  }
}
const signUp = asyncHandler(async(req,res)=>{
  // take register data from body
  const {fullName,email,mobileNumber,bio,role,password} = req.body;
  // validate comming input
  if(!fullName || !email || !mobileNumber || !bio || !role || !password){
    throw new ApiError(400, "Please provide all required signup details")
  }
  // take avatar as file and validate it
  const avatarFile = req.file;
  if(!avatarFile){
    throw new ApiError(400,"Please upload avatar");
  }
  // check if email already used in db
  const existingUser = await User.findOne({email});
  if(existingUser){
    throw new ApiError(409, "User already exists with this email");
  }
  // upload avatar on cloudinary and it will return url
  const avatarUpload = await uploadToCloudinary(avatarFile);
  // create user in db
  const user = await User.create({
    fullName,
    email,
    mobileNumber,
    bio,
    role,
    password,
    avatar:{
      public_id: avatarUpload.public_id,
      url:avatarUpload.secure_url,
    },
  });
  // fetch created user without password and refresh token
  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  // return success response
  return res
     .status(201)
     .json(new ApiResponse(201,"User created successfully",createdUser));
});
const login = asyncHandler(async(req,res)=>{
  const {email,password} = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email or password is missing");
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshToken(user._id);
  
  const isProduction = process.env.NODE_ENV === "PRODUCTION";

  const accessTokenOption = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 15 * 60 * 1000,
  };

  const refreshTokenOption = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
     .status(200)
     .cookie("accessToken",accessToken,accessTokenOption)
     .cookie("refreshToken",refreshToken,refreshTokenOption)
     .json(
      new ApiResponse(
        200,
        "User logged in successfully",
        {loggedInUser}
      )
     )
});
const logOut = asyncHandler(async(req,res)=>{
  // take user from middleware 
  const userId = req.user._id;

  // find user
  const user = await User.findById(userId);
  if(!user){
    throw new ApiError(401,"Unauthorized : user is missing")
  }
  // Invalidate refresh token in db
  user.refreshToken = undefined;
  await user.save({validateBeforeSave:false});

  // cleare cookies of access and refresh token with response
   const isProduction = process.env.NODE_ENV === "PRODUCTION";

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  };

  // clear cookies
  return res
    .status(200)
    .clearCookie("accessToken",cookieOptions)
    .clearCookie("refreshToken",cookieOptions)
    .json(
      new ApiResponse(
        200,
        "User logged out successfully !!"
      )
    )
});
const changePassword = asyncHandler(async(req,res)=>{
  // take password, newPassword , confirmPassword from body
  const {password,newPassword,confirmPassword} = req.body;

  // user is comming from middleware req.user and validate it
  const userId = req.user._id;

  const user = await User.findById(userId);
  if(!user){
    throw new ApiError(401,"Unauthorize: user is missing");
  }

  // validate comming data
  if(!password || !newPassword || !confirmPassword){
     throw new ApiError(400,"Please provide all the field ")
  }

  //  compair password with password saved in db
  const isPasswordValid = await user.isPasswordCorrect(password);

  // if password correct than update password with new password
  if(!isPasswordValid){
    throw new ApiError(401,"Unauthrize : Current password is wrong");
  }

  // unvalid the refreshToken so, that user have to login again and save 
  user.password = newPassword;
  user.refreshToken = undefined;
  await user.save({validateBeforeSave:false});

  // return success response
  return res
      .status(200)
      .json(new ApiResponse(200,"Password changed successfully !!"))
});
const updateAvatar = asyncHandler(async(req,res)=>{
  const userId = req.user._id;
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(401, "Unauthorized: user is missing");
  }

  const avatarFile = req.file;
  if (!avatarFile) {
    throw new ApiError(400, "Please upload avatar");
  }

  // 1️⃣ Upload new avatar first
  const newAvatar = await uploadToCloudinary(avatarFile);

  if (!newAvatar?.public_id || !newAvatar?.secure_url) {
    throw new ApiError(500, "Avatar upload failed");
  }

  const oldPublicId = user.avatar?.public_id;

  // 2️⃣ Update user document
  user.avatar = {
    public_id: newAvatar.public_id,
    url: newAvatar.secure_url,
  };

  try {
    await user.save({ validateBeforeSave: false });
  } catch (error) {
    // rollback cloudinary upload
    await deleteFromCloudinary(newAvatar.public_id);
    throw error;
  }

  // 3️⃣ Delete old avatar (best effort)
  if (oldPublicId) {
    await deleteFromCloudinary(oldPublicId).catch(() => {});
  }

  return res.status(200).json(
    new ApiResponse(200, "Avatar updated successfully")
  );
});
const updateUserDetails = asyncHandler(async(req,res)=>{
  const userId = req.user._id;

  const user = await User.findById(userId);
  if(!user){
    throw new ApiError(401,"Unauthorize: user is missing !!");
  }
  // take user detail which is to be updated
  const {fullName,mobileNumber,bio,role} = req.body;

  // update each data sepratly
  if(fullName){
    user.fullName = fullName;
  }
  if(mobileNumber){
    user.mobileNumber = mobileNumber;
  }
  if(bio){
    user.bio = bio;
  }
  if(role){
    user.role = role;
  }

  // save data
  await user.save({validateBeforeSave:false});
  // return success response
  return res
    .status(200)
    .json(
      new ApiResponse(200,"User details updated successfully !!")
    )

});
const deleteUser = asyncHandler(async (req, res) => {
  // 1. userId coming from params
  const { id: userIdToDelete } = req.params;

  if (!userIdToDelete) {
    throw new ApiError(400, "User id is required");
  }

  const loggedInUser = req.user; // set by jwtValidation middleware

  // 2. Authorization logic
  const isAdmin = loggedInUser.role === "admin";
  const isSelf = loggedInUser._id.toString() === userIdToDelete;

  // ❌ Normal user trying to delete someone else
  if (!isAdmin && !isSelf) {
    throw new ApiError(403, "You are not allowed to delete this user");
  }

  // (OPTIONAL SAFETY RULE)
  // If you want to prevent admin from deleting himself
  if (isAdmin && isSelf) {
    throw new ApiError(400, "Admin cannot delete own account");
  }

  // 3. Check if user exists
  const user = await User.findById(userIdToDelete);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // 4. Delete avatar from cloudinary (optional but good practice)
  if (user.avatar?.public_id) {
    await deleteFromCloudinary(user.avatar.public_id);
  }

  // 5. Delete user from DB
  await User.findByIdAndDelete(userIdToDelete);

  // 6. Response
  return res
    .status(200)
    .json(new ApiResponse(200, "User deleted successfully"));
});
const getUser = asyncHandler(async(req,res)=>{
   const userId = req.user._id;

   const user = await User.findById(userId);
   if(!user){
    throw new ApiError(401,"Unauthorized : user not found")
   }

   // return response
   return res
     .status(200)
     .json(
      new ApiResponse(
        200,
        "User data fetched successfully !!",
        {
          id:user._id,
          fullName:user.fullName,
          email:user.email,
          mobileNumber:user.mobileNumber,
          bio:user.bio,
          role:user.role,
          avatar:{
            url:user.avatar.url,
            public_id:user.avatar.public_id
          }
        }
      )
     )
});
const getAllUser = asyncHandler(async(req,res)=>{});

export {
  signUp,
  login,
  logOut,
  changePassword,
  updateAvatar,
  updateUserDetails,
  deleteUser,
  getUser,
  getAllUser
}
