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

        //validateBeforeSave: false => it means validation doesn't run on any changes you make in pre('save') hooks
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
    //The findOne() function is used to find one document according to the condition. If multiple documents match the condition, then it returns the first document satisfying the condition. 
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

    
    //as we wrote a middlewere in the userroute, it gives the req more fields like avatar and cover image file
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

const loginUser = asyncHandler(async (req,res)=>{
    // req body -> data

    const {email, username, password} = req.body

    // username or email
    if (!username & !email) {
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

const refreshAccessToken = asyncHandler(async (req, res) => {

    //take refresh token from cookie or from body(mobile development)
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    //if refresh token is not present then throw error
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }
    //refresh token present
    try {
        //jwt.varify decodes the present refresh token 
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        //search user with that token in db
        const user = await User.findById(decodedToken?._id)

        //if that user doesnt exist then throw error
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
        //throw error if the refresh token sent by user(incoming refreshtoken) and 
        //the token saved in user object doesnot match
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
        //refresh token matched, give access to the session
        //options for sending cookie
        const options = {
            httpOnly: true,
            secure: true
        }
        //get reference to new access and refresh token to send through cookie.
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
        
        //send coockie and json responce
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    //get old and new password from frontend 
    const {oldPassword, newPassword} = req.body

    
    //find user based on old password
    const user = await User.findById(req.user?._id)

    //check if the old password is correct or not
    //it return true or false
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    //throw error if the password is not correct
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }
    //ifthe old password is correct then assign new password to the user password
    user.password = newPassword
    //save that new password to db
    await user.save({validateBeforeSave: false})
    //return json response 
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user, //we are getting req.user because we returned full user in auth middlewere
        "User fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    //get required fields from request.body
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {   //set is a mongodb opoeratier that sets value to parrameters
            $set: {
                fullName:fullName,
                email: email
            }
        },
        //this ensures we are gatiing updated/new value
        {new: true}
        
    ).select("-password") //remove password field from user

    return res
    .status(200)
    //send updated user details as  json
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar =asyncHandler(async(req,res)=>{
    //access local path of avatar
    const avatarLocalPath=req.file?.path

    //if the file not exist then throw error
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    //upload the file on cloudinary and returns path 
    const avatar=await uploadOnCloudinary(avatarLocalPath)

    //if avatar url is not found throw error
    if(!avatar.url){
        throw new ApiError(400,"Error while uploading avatar")
    }

    const user=User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,"Avatar updated successfully"))

})

const updateUserCoverImage =asyncHandler(async(req,res)=>{
    //access local path of avatar
    const coverImageLocalPath=req.file?.path

    //if the file not exist then throw error
    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover image file is missing")
    }

    //upload the file on cloudinary and returns path 
    const coverImage=await uploadOnCloudinary(avatarLocalPath)

    //if avatar url is not found throw error
    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading Cover image")
    }

    const user=User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,"Cover Image updated successfully"))

})



export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}