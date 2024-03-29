import mongoose, {Schema} from "mongoose";

const subsciptionSchema=new Schema({
    subscriber:{
        //Schema.Types.ObjectId is used when refering different property
        type:Schema.Types.ObjectId, //One who subscribes
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId, //One whom subscribers are subscribing
        ref:"User"
    },


},{timestamps:true})


export const Subscription=mongoose.model("Subscription",subsciptionSchema)