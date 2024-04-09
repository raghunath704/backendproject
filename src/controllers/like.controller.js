import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid VideoId")
    }
    
    const alreadyLiked = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id,
    })

    if(alreadyLiked){
        await Like.findByIdAndDelete(alreadyLiked);

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {isLiked: false},
                "Video unliked"
            )
        )
    }

    await Like.create({
        likedBy:req.user?._id,
        video: videoId
    })

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {isLiked:true},
        "Video Liked"
    ))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid commentId")
    }

    const alreadyLiked=await Like.findOne({
        likedBy:req.user?._id,
        comment:commentId
    })

    if(alreadyLiked){
        await Like.findByIdAndDelete(alreadyLiked)
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {isLiked: false},
                "Comment unliked"
            )
        )
    }

    await Like.create({
        likedBy:req.user?._id,
        comment:commentId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {isLiked: true},
            "Comment liked"
        )
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweetId")
    }

    const alreadyLiked=await Like.findOne({
        likedBy:req.user?._id,
        tweet:tweetId
    })

    if(alreadyLiked){
        await Like.findByIdAndDelete(alreadyLiked)
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {isLiked: false},
                "Tweet unliked"
            )
        )
    }

    await Like.create({
        likedBy:req.user?._id,
        tweet:tweetId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {isLiked: true},
            "Tweet liked"
        )
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const allLikedVideos=await Like.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"likedVideo",

            }
        },
        {
            $project: {
                likedVideo: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    owner: 1
                }
            }
        }
    ])

    if (!allLikedVideos?.length) {
        throw new ApiError(404, "user has no liked videos.");
    }

    //returning response
    return res
    .status(200)
    .json(new ApiResponse(200, allLikedVideos, "Liked videos successfully fetched."));
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}