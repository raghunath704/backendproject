import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if(!title || title==""){
        throw new ApiError(400,"Title is required")
    }
    if(!description || title==""){
        throw new ApiError(400,"Description is required")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalpath = req.files?.thumbnail[0]?.path;

    if(!videoLocalPath){ 
        throw new ApiError(400,"videoLocalPath is required")
    }
    if(!thumbnailLocalpath){ 
        throw new ApiError(400,"thumbnailLocalpath is required")
    }

    const videoFile= await uploadOnCloudinary(videoLocalPath)
    const thumbnail= await uploadOnCloudinary(thumbnailLocalpath)

    if(!videoFile){
        throw new ApiError(400,"Video not uploaded")
    }
    if(!thumbnail){
        throw new ApiError(400,"Thumbnail not uploaded")
    }

    const video=await Video.create({
        title,
        description,
        videoFile: {
            url: videoFile.url,
            public_id: videoFile.public_id
        },
        thumbnail: {
            url: thumbnail.url,
            public_id: thumbnail.public_id
        },
        duration: videoFile.duration,
        isPublished: false,
        owner: req.user._id,
    })

    const videoUploaded = await Video.findById(video._id);

    if (!videoUploaded) {
        throw new ApiError(500, "VideoUpload failed please try again !!!");
    }

    return res.status(201).json(
        new ApiResponse(201,video, "Video uploaded successfully")
    )

    


})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(videoId==""){
        throw new ApiError(400,"Video id field is empty");
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Video not found")
    }

    const video = await User.aggregate([
        {
            $match:{
                //converting 
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from :"likes",
                localField:"_id",
                foreignField:"video",
                as: "likes"
            }

        },
        {   //join operation to find users subscribbers
            // access going  video model->user model
            $lookup:{
                from :"users",
                localField:"owner",
                foreignField:"_id",
                as: "owner",
                //as we are getting getting user as owner,
                //all the users property will be stored to watchhistory
                //we only need the name of the user.
                //so writting a pipeline to filter out all unnececery fields of user
                pipeline:[
                    {   //access going  user model->subscription model
                        $lookup:{
                            from :"subscriptions",
                            localField:"_id",
                            foreignField:"channel",
                            as: "subscribers",
                            

                        }

                    },
                    {
                        $addFields :{
                            subscriberCount:{
                                $size:"$subscribers"
                            },
                            isSubscribed:{
                                $cond:{
                                    if: { $in: [ req.user?._id, "$subscribers.subscriber"] }, 
                                    then: true,
                                    else :false
                                }

                            }

                        }

                    },
                    {
                        $project:{
                            username:1,
                            "avatar.url":1,
                            subscriberCount:1,
                            isSubscribed

                        }

                    }
                    
                ]
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size:"$likes"
                },
                owner:{
                    $first:"$owner"
                },
                isLiked:{
                    $cond:{
                        if: {$in: [req.user?._id, "$likes.likedBy"]},
                    }
                }
            }
            
        },
        {
            $project:{
                "videoFile.url": 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                comments: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1
            }
        }
    ])

    if(!video){
        throw new ApiError(400,"Video not found")
    }

    // increment views if video fetched successfully
    await Video.findByIdAndUpdate(videoId, {
        $inc: {
            views: 1
        }
    });

    // add this video to user watch history
    await User.findByIdAndUpdate(req.user?._id, {
        $addToSet: {
            watchHistory: videoId
        }
    });

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        video[0],
        "Video fetched successfuly"
    ))
    
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description} =req.body
    
    //TODO: update video details like title, description, thumbnail

    if(!isValidObjectId(videoId) || !videoId?.trim()){
        throw new ApiError(400,"Invalid video id")
    }

    if(!title || !description) {
        throw new ApiError(400, "Title and Description are required")
    }
    

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not found")
    }

    if(video.owner.toString() != req.user?._id.toString()){
        throw new ApiError(400,"You are not the owner so cant update")
    }

    //deleting old thumbnail and updating with new one
    const thumbnailToDelete = video.thumbnail?.public_id;

    const newthumbnailLocalPath=req.file?.path
    if(!newthumbnailLocalPath){
        throw new ApiError(404, "New Thumbnail file not found")
    }


    const thumbnail = await uploadOnCloudinary(newthumbnailLocalPath);
    if (!thumbnail) {
        throw new ApiError(400, "Thumbnial not found ");
    }

    
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {   //set is a mongodb opoeratier that sets value to parrameters
            $set: {
                title:title,
                description: description,
                thumbnail:{
                    public_id:thumbnail.public_id,
                    url:thumbnail.url
                }
            },
        },
        //this ensures we are gatiing updated/new value
        {new: true}
        
    )

    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update video please try again");
    }

    // deleting old thumbnail from cloudinary
    if (updatedVideo) {
        const oldThumbnailDeleted = await deleteOnCloudinary(thumbnailToDelete);
        if (!oldThumbnailDeleted) {
            throw new ApiError(404, "Old thumbnail not deleted");
        }
    }


    res.status(200).json(
        new ApiResponse(200,"Video details updated successfully")
    )


})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!isValidObjectId(videoId) && !videoId?.trim()){
        throw new ApiError(400,"VideoId not valid");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "No video found to delete");
    }

    if(video?.owner?.toString()!=req.user?._id.toString()){
        throw new ApiError(400, "You cant delete the video as you are not the owner")
    }

    const videoDeleted = await Video.findByIdAndDelete(video?._id);

    if(!videoDeleted){
        throw new ApiError(400, "Failed to delete the video")
    }


    await deleteOnCloudinary(video?.thumbnail.public_id);
    // specify video while deleting video
    await deleteOnCloudinary(video?.videoFile.public_id,"video");

    // delete video likes
    await Like.deleteMany({
        video: videoId
    })

     // delete video comments
    await Comment.deleteMany({
        video: videoId,
    })

    res.send(200)
    .json(
        200,
        "Video Deleted sucessfully"
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId) || !videoId.trim()){
        throw new ApiError(400,"VideoId not valid");
    }

    const video=await Video.findById(videoId)
    if(!video) {
        throw new ApiError(400, "Video not found")
    }
    if(video?.owner?._id.toString() != req.user?._id.toString()){
        throw new ApiError(400, "You cant toggle, as you are not owner")
    }

    const videotoggled = await Video.findOneAndUpdate(
        videoId,
        {
            $set:{
                isPublished:!video?.isPublished
            }

        },
        {new: true}
    )

    if(!videotoggled){
        throw new ApiError(400,"Failed to toggle publish status")
    }

    return res
    .status(200)
    //send updated user details as  json
    .json(new ApiResponse(
        200,  
        { isPublished: videotoggled.isPublished },
        "Video publish status updated successfully"
    ))

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
