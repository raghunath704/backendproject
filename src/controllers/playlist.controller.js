import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if(name.trim()=="" || description.trim()==""){
        throw new ApiError(400,"Name and Description cant be empty")
    }

    const playlist=await Playlist.create({
        name,
        description,
        owner:req.user?._id
    })

    if(!playlist){
        throw new ApiError(400,"Error while creating playlist")
    }

    return res.status(200).json(new ApiResponse(200,playlist,"Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid Userid")
    }
    const user=await User.findById(userId)
    if(!user){
        throw new ApiError(404,"User not found")
    }

    // searching for playlists in the DB where userId is same as owner of tweet
    const playlists = await Playlist.aggregate([
        {
            $match: {   // returning only those tweets where owner & user._id are same
                owner: new mongoose.Types.ObjectId(user._id)  
            }
        }
    ]);

    // if there are no playlists return response
    if (playlists.length === 0) {  // the type of tweets is object so we can check its length
        return res
        .status(404)
        .json(new ApiResponse(400, playlists, "User has no playlists."));
    }

    // returning response
    return res
    .status(200)
    .json(new ApiResponse(200, playlists, "Playlists fetched successfully."));

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invaalid PplaylistId")
    }

    const searchedPlaylist=await Playlist.findById(playlistId)
    if(!searchedPlaylist){
        throw new ApiError(404,"Playlist not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,searchedPlaylist,"Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlistId")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId")
    }
    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"Playlist not found")
    }

    const video=await Playlist.findById(playlistId)
    if(!video){
        throw new ApiError(404,"Video not found")
    }
    // adding video to playlist if the playlist owner is currently logged in
    let videoPlaylist;
    if (playlist.owner.toString() === req.user._id.toString()) {
        videoPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                // pushing the video into the "videos" array of the playlist using "$addToSet method" as we want to push the video to the playlist only if it doesn't already exists in the playlist.
               $addToSet: {videos: video._id}   
            },
            {new: true}
        )
    }else {
        throw new ApiError(400, "Unauthorized access to playlist");
    }

    // returning response
    return res
    .status(200)
    .json(new ApiResponse(200, videoPlaylist, "Video added to playlist successfully."))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlistId")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId")
    }
    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"Playlist not found")
    }

    const video=await Playlist.findById(playlistId)
    if(!video){
        throw new ApiError(404,"Video not found")
    }

    // adding video to playlist if the playlist owner is currently logged in
    let videoPlaylist;
    if (playlist.owner.toString() === req.user._id.toString()) {
        videoPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                //$pull operator is used to remove elements from an array that match a specified condition. It modifies an existing array by removing all instances of a value or values that satisfy the given condition
               $pull: {videos: video._id} 
            },
            {new: true}
        )
    }else {
        throw new ApiError(400, "Unauthorized access to playlist");
    }

    // returning response
    return res
    .status(200)
    .json(new ApiResponse(200, videoPlaylist, "Video removed from playlist successfully."))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid PlaylistId")
    }

    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    if(req.user?._id.toString()!==playlist.owner.toString()){
        throw new ApiError(400, "Only playlist creater can delete it")
    }

    await Playlist.findByIdAndDelete(playlistId)

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully."));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid PlaylistId")
    }

    const updateplaylist=await Playlist.findById(playlistId)
    if(!updateplaylist){
        throw new ApiError(404, "Playlist not found")
    }

    if(name.trim()=="" || description.trim()==""){
        throw new ApiError(400,"Name and Description cant be empty")
    }

    if(req.user?._id.toString()!==updateplaylist.owner.toString()){
        throw new ApiError(400, "Only playlist creater can delete it")
    }

    const updatedPlaylist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name,
                description
            }
            
        },
        {new: true}
    )
    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Plsylist updated successfully."))


})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
