import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

//Function to generate and save access and refresh token
const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        //set generated refreshtoken to database
        user.refreshToken = refreshToken
        //save the updated user
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

//registering user and sending json data
const registerUser=asyncHandler(async (req,res)=>{
    // get user details from frontend
    //destructuring object from req.body
    const {fullName,email,username,password}=req.body
    //console.log(email);

    //validation - check if not empty

    if(fullName==="") throw new ApiError(400, "Fullname is required") 
    if(username==="") throw new ApiError(400, "Username is required") 
    if(email==="") throw new ApiError(400, "Email is required") 
    if(password==="") throw new ApiError(400, "Password is required") 

    // check if user already exists: username, email 
    //findone checks and return first document that have the following parameters
    //can use find also, no difference.
    //$or is a special type of syntax that cheks if any one of the parameters is same
    //then it stores the valuse
    const existedUser= await User.findOne({
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

    //const coverImageLocalPath = req. files?.coverImage[0]?.path
    //check if cover image is uploaded by the user or not only then proceed or else will face undifined error
    let coverImageLocalPath;
    //the case handles when user doesnot upload coverimage
    if(req.files &&  Array.isArray(req.files.coverImage) && req.files.coverImage.length>0) {
        coverImageLocalPath=req.files.coverImage[0].path
    }
    

    

    //console.log(req.files);

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

const loginUser =asyncHandler(async (req,res)=>{
    // req body -> data

    const {email, username, password} = req.body

    // username or email
    if (!(username || email)) {
        throw new ApiError(400,"Username or emaill is required.")

    }
    //now if you wnat the user to validate through only username or password, you can check only that parameter.

    //find the user
    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User doent exist")
    }
    //password check
    //User capital (U) is mongodb user object 
    // user small (u) is local instance user object
    const isPasswordValid = await user.isPasswordCorrect(password)


    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }

    //access and referesh token

    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)


    //send cookie
    //make database call and get user without certain preoperties
    const loggedInUser= await User.findById(user._id).select("-password -refreshToken")

    //makes cashe only modifiable through server
    const options = {
        httponly: true, 
        secure: true
    }

    //Return access and refresh token 

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken",refreshToken,options)
    .json( 
        new ApiResponse(
            200,
            //we are sending the accesstoken and refresh token in json even after sending them in cookie is for if the backend is for mobile development, then cookie is not saved so if the tokens are sent by json responce then frontend developer can manually save them.
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "User logged In Successfully"
            
        )
    )
})

const logoutUser =asyncHandler(async(req,res)=>{
    //user had a access token and we decoded the token and matched if it is vakid token or not in auth middlewere in the return it returns user with valid token. so we get access to the user by this technique

    await User.findByIdAndUpdate(
        req.user._id,
        {   //removing refreshtoken
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {   //this ensures the return document doesnot have old values,but the updated one.or else the refresh token will also come.
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))

})

export {registerUser,loginUser,logoutUser}