import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    // search for your channel in the DB
    const channel = await User.findById(req.user?._id);

    if (!channel) {
        throw new ApiError(400, "Channel not found.");
    }

    const channelStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channel),
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "video_likes",
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "owner",
                foreignField: "channel",
                as: "total_subscribers"
            }
        },
        {   //The _id field here acts as the key for the group. When you set _id to null, you’re instructing MongoDB to group all documents into a single group. This is useful when you want to perform aggregate operations over the entire collection of documents that match the previous stages of the pipeline.
            $group: {
                _id: null,
                TotalVideos: {$sum : 1},    // sum to get all videos of the user
                TotalViews: {$sum : "$views"},    
                TotalSubscribers: {
                    //as all videos are of same channel so all video documents will have same number of total subscribers,so tkaing from first document.
                    $first: {
                        $size: "$total_subscribers"
                    }
                },
                TotalLikes:{
                    $first:{
                        $size: "$video_likes"
                    }
                },
            }
        },
        {
            $project: {
               TotalVideos: 1,
               TotalSubscribers: 1,
               TotalViews: 1,
               TotalLikes: 1,
            }
        }
    ])

    // return response
    return res
    .status(200)
    .json(new ApiResponse(200, channelStats, "Channel stats fetched successfully."))


})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    // search for your channel in the DB
    const channel = await User.findById(req.user?._id);

    if (!channel) {
        throw new ApiError(400, "Channel not found.");
    }
    const channelVideos=await Video.aggregate([
        {
            $match:{
                owner:mongoose.Types.ObjectId(channel)
            }
        },
        {
            $project:{
                _id: 1,
                title: 1,
                description: 1,
                videoFile: 1,
                thumbnail: 1,
                createdAt: 1,

            }
        }
    ])

    if (channelVideos.length === 0) {
        throw new ApiError(404, "No videos were found")
    }

    // returning response
    return res
    .status(200)
    .json(new ApiResponse(200, channelVideos, "Channel videos fetched successfully."))

})

export {
    getChannelStats, 
    getChannelVideos
}