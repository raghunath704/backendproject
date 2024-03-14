import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

//registering user and sending json data
const registerUser=asyncHandler(async (req,res)=>{
    // get user details from frontend
    //destructuring object from req.body
    const {fullName,email,username,password}=req.body
    console.log(email);

    //validation - check if not empty

    if(fullName==="") throw new ApiError(400, "Fullname is required") 
    if(username==="") throw new ApiError(400, "Username is required") 
    if(email==="") throw new ApiError(400, "Email is required") 
    if(password==="") throw new ApiError(400, "Password is required") 

    // check if user already exists: username, email 
    //findone checksa and return first document that have the following parameters
    //can use find also, no difference.
    //$or is a special type of syntax that cheks if any one of the parameters is same
    //then it stores the valuse
    const existedUser= User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser) {
        throw new ApiError(409,"User with email or username already exists")
        //we can check further for example email if the @ is present or not
    }

    // check for images, check for avatar

    
    //as we wrote a middlewere in the userroute, it gives the req more fields like file
    // avatar[0] is a path of the file in the local folder
    //we may and may not get files (avatar,coverimage and their path) thats why using "?" .
    const avatarLocalPath = req. files?.avatar[0]?.path
    const coverImageLocalPath = req. files?.coverImage[0]?.path

    //check if avatar path is there or not else throw error

    if(!avatarLocalPath){ 
        throw new ApiError(400,"Avatar is required")
    }
    
    // upload them to cloudinary, avatar
    const avatar= await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar is required")
    }

    // create user object - create entry in db
    //creating user object , giving all parameters and createinng a entry at mongodb
    const user=await User.create({
        fullName,
        avatar: avatar.url,
        //if the cover image exisists then use its url else use empty string
        coverImage: coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()

    })
    // remove password and refresh token field from response
    //if user is created in mongodb, mongodb generates a unique _id for every user object.
    // .select method is for selecting some property,
    //but if we put - infront of any , then it is excluded 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    // check for user creation

    if(!createdUser) throw new ApiError(500, "Something went wrong while registering user")


    // return Api response 

    return res.status(201).json(
        new ApiResponse(201,createdUser,"User registered Successfully")
    )

})

export {registerUser}