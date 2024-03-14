import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from '../middlewares/multer.middleware.js'

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

export default router