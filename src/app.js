import { express } from "express";
import cors from 'cors';
import cookieParser from 'cookie-parser'

const app=express();

//for configuration we use app.use().
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

export default app