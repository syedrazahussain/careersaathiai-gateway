import express from "express";
import dotenv from 'dotenv';
import proxy from "express-http-proxy"
import cors from "cors"
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { getcurrentUser } from "./controllers/user.controller.js";
import { isAuth } from "./middleware/isAuth.js";
import { proxyWithHeaders } from "./utils/proxyWithHeaders.js";

dotenv.config()
const app = express();
app.use(express.json())
app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true
}));
app.use(morgan("dev"))
app.use(cookieParser())


app.get('/',(req,res)=>{
    res.send("hello");
})

app.use("/api/auth",proxy(process.env.AUTH_SERVICE_URL))
app.use("/api/resume",isAuth,proxyWithHeaders(process.env.RESUME_SERVICE_URL))
app.use("/api/interview",isAuth,proxyWithHeaders(process.env.INTERVIEW_SERVICE_URL))
app.use("/api/roadmap",isAuth,proxyWithHeaders(process.env.ROADMAP_SERVICE_URL))
app.use("/api/billing",isAuth,proxyWithHeaders(process.env.BILLING_SERVICE_URL))

app.get("/api/me",isAuth,getcurrentUser)

app.listen(process.env.PORT,()=>{
    console.log(`Gateway is running at port ${process.env.PORT}`)
    // connectDB()
})