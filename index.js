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
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(morgan("dev"))
app.use(cookieParser())


app.get('/', (req, res) => {
    res.send("hello");
})


app.get("/api/warmup", async (_req, res) => {
    const services = [
        ["auth", process.env.AUTH_SERVICE_URL],
        ["billing", process.env.BILLING_SERVICE_URL],
        ["interview", process.env.INTERVIEW_SERVICE_URL],
        ["resume", process.env.RESUME_SERVICE_URL],
        ["roadmap", process.env.ROADMAP_SERVICE_URL],
    ];

    const results = await Promise.all(
        services.map(async ([name, baseUrl]) => {
            if (!baseUrl) {
                return {
                    service: name,
                    status: "not_configured",
                };
            }

            const controller = new AbortController();
            const timeout = setTimeout(
                () => controller.abort(),
                8000
            );

            try {
                const url =
                    `${baseUrl.replace(/\/+$/, "")}/health`;

                const response = await fetch(url, {
                    signal: controller.signal,
                });

                return {
                    service: name,
                    status: response.ok
                        ? "reachable"
                        : "unavailable",
                };
            } catch {
                return {
                    service: name,
                    status: "unavailable",
                };
            } finally {
                clearTimeout(timeout);
            }
        })
    );

    const ready = results.every(
        (service) => service.status === "reachable"
    );

    return res.status(200).json({
        status: ready ? "ready" : "warming",
        services: results,
    });
});

app.use("/api/auth", proxy(process.env.AUTH_SERVICE_URL))
app.use("/api/resume", isAuth, proxyWithHeaders(process.env.RESUME_SERVICE_URL))
app.use("/api/interview", isAuth, proxyWithHeaders(process.env.INTERVIEW_SERVICE_URL))
app.use("/api/roadmap", isAuth, proxyWithHeaders(process.env.ROADMAP_SERVICE_URL))
app.use("/api/billing", isAuth, proxyWithHeaders(process.env.BILLING_SERVICE_URL))

app.get("/api/me", isAuth, getcurrentUser)

app.listen(process.env.PORT, () => {
    console.log(`Gateway is running at port ${process.env.PORT}`)
    // connectDB()
})