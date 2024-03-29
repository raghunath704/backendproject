import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

//for configuration we use app.use().
//applying cors middlewere to allow different url frontends to call the backend
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
    
}))

//limit for recieving json data by the server
app.use(express.json({limit: "16kb"}))
//for recieving data from url
app.use(express.urlencoded ({extended: true, limit:"16kb" }) )
//to store public datas in temporarry folder
app.use(express.static("public"))

app.use(cookieParser())

//routes import

import userRouter from './routes/user.routes.js'

//routes declearation
//this will pass the request to userRouter route
//no need to write routes hare.
app.use("/api/v1/users",userRouter)

export default app