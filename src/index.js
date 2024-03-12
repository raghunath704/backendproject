import dotenv from "dotenv"
import connectDB from "./db/index.js";
dotenv.config({path:'/.env'})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port : ${process.env.PORT}`);
    })
    //Error listener for app to throw erro
    app.on("error", (error)=>{
        console.log("ERROR: ",error);
        throw error
    })

})
.catch((err)=>{
    console.log("Mongodb connection failed !!!",err);
})









/*
We can also write db codes in direct index.js but its not a good practise

import { Express } from "express";

const app=express()
(async ()=>{
    try{
        //connect database
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        //Error listener for app to throw erro
        app.on("error", (error)=>{
            console.log("ERROR: ",error);
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is Live on ${process.env.PORT}`);
        })

    }
    catch(error){
        //show error
        console.error("ERROR",error)
        throw error
    }
})()
*/