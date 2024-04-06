import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile: {
            type: {
                url: String, //cloudinary url
                public_id: String, //public id for deletion from cloudinary
            },
            required: true,
        },
        thumbnail: {
            type: {
                url: String, //cloudinary url
                public_id: String, //public id for deletion from cloudinary
            },
            required: true,
        },
        title: {
            type: String, 
            required: true
        },
        description: {
            type: String, 
            required: true
        },
        duration: {
            type: Number, 
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }

    }, 
    {
        timestamps: true
    }
)
//mongooseAggregatePaginate helps  to write aggregating query
//In this context, to implement video history functionality we using this
videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)