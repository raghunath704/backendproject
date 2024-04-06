import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} =req.body

    if(!content.trim()){
        throw new ApiError(400, "Content cant be empty")
    }

    const tweet=await Tweet.create({
        content,
        owner: req.user?._id
    })

    if(!tweet){
        throw new ApiError(400,"Failed to post tweet")
    }

    return res.status(200).json(new ApiResponse(200,tweet, "Tweet is posted successfully"));


})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} =req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid userId")
    }

    const tweets= await Tweet.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField: "owner",
                foreignField: "_id",
                as:"ownerDetails",
                pipeline:[
                    {
                        $project:{
                            username: 1,
                            fullName:1,
                            "avatar.url":1,

                        }
                    }
                ]
            },
        },
        {
            $lookup:{
                from:"likes",
                localField: "_id",
                foreignField: "tweet",
                as:"likeDetails",
                pipeline:[
                    {
                        $project:{
                            likedBy:1

                        }
                    }
                ]
            },

        },
        {
            $addFields:{
                likesCount: {
                    $size: "$likeDetails",

                },
                ownerDetails:{
                    $first: "$ownerDetails",
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, "$likeDetails.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $sort:{createdAt:-1}
        },
        {
            $project:{
                content: 1,
                ownerDetails:1,
                likesCount:1,
                createdAt:1,
                isLiked:1,
            }
        }
    ])

    if(!tweets){
        throw new ApiError(404,"Failed getting uweets, try again")
    }
    res.statuss(200).json(new ApiResponse(200,tweets,"Tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {content}=req.body
    const {tweetId}=req.params

    if(!isValidObjectId(tweetId) || !tweetId?.trim()){
        throw new ApiError(400, "Invalid TweetId")
    }

    if(!content ){
        throw new ApiError(400, "Content is required")
    }
    if(content=="" ){
        throw new ApiError(400, "Content cant be empty")
    }
    const tweet=await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }

    if(req.user?._id.toString() != tweet?.owner.toString()){
        throw new ApiError(400, "Only owner can update the tweet")
    }

    const updatedTweet=await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content,
            }
        },
        {new:true}
        
    )
    if(!updatedTweet){
        throw new ApiError(400, "Tweet not updated try again")
    }

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedTweet,
            "Tweet updated Successfully"
        )
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} =req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweetId")
    }
    const tweet=await findById(tweetId);
    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }

    if(tweet?.owner.toString() != req.user?._id.toString() ){
        throw new ApiError(400, "Only owner can delete tweets")
    }

    await Tweet.findByIdAndDelete(tweetId)

    

    res.status(200).json(new ApiResponse(200,{tweetId},"Tweet deleted successfuly"))



    
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
