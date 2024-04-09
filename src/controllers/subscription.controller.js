import mongoose, {Mongoose, isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid ChannelId")
    }
    // search for channel in DB
    const channel = await User.findById(channelId);

    if (!channel) {
        throw new ApiError(400, "Channel not found.");
    }

    if(req.user?._id == channel._id.toString()){
        throw new ApiError(400, "You can't subscribe your own channel")
    }

     // check if channel is already subscribed if not already subscribed subscribe the channel
    const isSubscribed=await Subscription.findOne({
        subscriber:req.user?._id,
        channel:channelId,
    })

    if(channelAlreadySubscribed){
        await Subscription.findByIdAndDelete(isSubscribed?._id);
        return res.status(200)
        .json(new ApiResponse(200,{subscribed:false},"Unsubscribed Successfully"))
    }

    await Subscription.create({
        subscriber:req.user?._id,
        channel:channelId
    })

    return res
    .status(200)
    .json(new ApiResponse(200,{subscribed:true},"Subscribed Successfully"))



})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channelId")
    }

    const subscribers= await Subscription.aggregate([
        {
            match:{
                channel: new Mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriber"
            }
        },
        {
            $project:{
                subscriber:{
                    _id:1,
                    username:1,
                    email:1
                }
                

            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            subscribers,
            "Subscribers fetched successfully"
    ))
    
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid SubscriberId")
    }

    const subscribedChannels=await Subscription.aggregate([
        {
            $match:{
                subscriber:Mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscribedChannel"
            }
        },
        {
            $project:{
                subscribedChannel:{
                    _id: 1,
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                    coverImage : 1,
                }
                

            }
        }
    ])

    if (!subscribedChannels.length) {
        throw new ApiError(404, "No channels subscribed");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, subscribedChannels, "Channels subscribed successfully fetched"));

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}