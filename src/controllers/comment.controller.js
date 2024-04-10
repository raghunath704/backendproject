import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import { Video } from "../models/video.models.js"
import { Like } from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    if(page<1 || limit>10){
        throw new ApiError(400, "Invalid query")
    }

    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"Video not found")
    }

    const videoComments=await Comment.aggregate([
        {
            $match:{
                video:mongoose.Types.ObjectId(video._id)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"commentOwner"
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"comment",
                as:"commentLikes"
            }
        },
        {
            $addFields:{
                commentOwner:{
                    $first: "$commentOwner"
                },
                commentLikesCount:{
                    $size: "$commentLikes"
                },
                isLiked:{
                    $cond:{
                        if: {$in: [req.user?._id, "$commentLikes.likedBy"]},
                    }
                }
            }
        },
        {
            $project:{
                content: 1,
                createdAt: 1,
                commentLikesCount: 1,
                commentOwner: {
                    username: 1,
                    avatar: 1
                },
                isLiked: 1
            }
        }
    ])

    // defining options for aggregate paginate
    const options = {
        // page: This is the current page number that the user wants to view. The parseInt(page, 10) function call converts the page variable from a string to an integer, ensuring that it’s a number that can be used for calculations. The second argument 10 specifies the base for the integer conversion, which is decimal in this case.
        
        page: parseInt(page, 10),

        // limit: This is the maximum number of comments to display on one page. Similarly, parseInt(limit, 10) converts the limit variable to an integer.
        limit: parseInt(limit, 10)
    }

    // using the aggregate paginate
    const comments = await Comment.aggregatePaginate(
        videoComments,
        options
    );
    if (!comments) {
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video has no comments."))
    }

    // returning response
    return res
    .status(200)
    .json(new ApiResponse(200, comments, "Video comments fetched successfully."))



})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    const {content}=req.body
    const {videoId}=req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid VideoId")
    }

    if(content.trim()===""){
        throw new ApiError(400,"Comment cant be empty")
    }

    // search for video in DB
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found");
    }

    const comment=await Comment.create({
        content:content,
        video:video._id,
        owner:req.user?._id,
    })

    if(!comment){
        throw new ApiError(400,"Something went wrong while posting comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comment,
            "Comment added successfully"
        )
    )

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const {commentId}=req.params
    const {content}=req.body

    if(!content.trim() || content.trim()===""){
        throw new ApiError(400,"Comment cant be empty")
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid Comment Id")
    }
    const commentExists=await Comment.findById(commentId);
    if(!commentExists){
        throw new ApiError(404, "Comment not found")
    }

    if(commentExists.owner.toString() !=req.user?._id.toString()){
        throw new ApiError(400, "Only owner can update comment")
    }

    const updatedComment=await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{content}
        },
        {new:true}
        
    )
    if(!updatedComment){
        throw new ApiError(404, "Comment not updated, try again")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updateComment,
            "Comment updated successfully"
        )
    )



})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const {commentId}=req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid Comment Id")
    }
    const commentExists=await Comment.findById(commentId);
    if(!commentExists){
        throw new ApiError(404, "Comment not found")
    }
    if(commentExists.owner.toString() !=req.user?._id.toString()){
        throw new ApiError(400, "Only owner can delete comment")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)
    // if comment is deleted delete its likes
    if (deleteComment) {    
        await Like.deleteMany({comment: deletedComment._id})
    }
    else {
        throw new ApiError(404, "Something went wrong while deleting comment.")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "Comment deelted successfully"
        )
    )


})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
