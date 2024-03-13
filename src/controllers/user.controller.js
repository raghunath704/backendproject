import { asyncHandler } from "../utils/asyncHandler.js";

//registering user and sending json data
const registerUser=asyncHandler(async (req,res)=>{
    res.status(201).json({
        message:"contoller is running"
    })
})

export {registerUser}