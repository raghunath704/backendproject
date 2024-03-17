import { Router } from "express";
import { loginUser, logoutUser, registerUser,refreshAccessToken } from "../controllers/user.controller.js";
import {upload} from '../middlewares/multer.middleware.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router()
//this will add /register ppath and will register
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

export default router