
//This middlewere will actually varify if user exists or not
//

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

//whenever some fields are not in use _ is added. in this case res.
export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        //check for access token in cookies
        //the second condition is for the case when cookies is not stored.( Mobile development)
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        // console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
        //decode access token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        
        //deselcting password and refreshtoken from user object
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            
            throw new ApiError(401, "Invalid Access Token")
        }
        //if all tokens are varified, then add the user in req.user
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
})