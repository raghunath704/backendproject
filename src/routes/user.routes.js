import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    registerUser,
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,


} from "../controllers/user.controller.js";
import {upload} from '../middlewares/multer.middleware.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router()
//this will add /register path and will register
router.route("/register").post(
    
    //middlewere injection just before registering user
    // we are using fields option because we want to upload multiple things
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    
    //registering user
    
    registerUser
    
    
)

router.route("/login").post(loginUser)

//secure route
//injecting middlewere varifyjwt before logout
router.route("/logout").post(verifyJWT, logoutUser )

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT ,changeCurrentPassword)

router.route("/current-user").get(verifyJWT ,getCurrentUser)
//patch is used to only update specified things
//unless if post is used then all properties will get genrated once more
router.route("/update-account").patch(verifyJWT ,updateAccountDetails)
//upload is a multer property and it used for uploading image
//.single is used to only upload one picture 
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router. route("/c/:username").get(verifyJWT, getUserChannelProfile)
router. route("/history").get(verifyJWT, getWatchHistory)



export default router