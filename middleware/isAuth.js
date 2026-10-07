import redis from "../shared/redis/redis.js"


export const isAuth = async (req, res, next) => {

    try {


        const sessionId = req.cookies?.session

        console.log("COOKIE SESSION:", sessionId);
        console.log("REDIS KEY:", `session:${sessionId}`);
        
        if (!sessionId) {
            console.log("session id not getting")
            return res.status(401).json({ message: "unauthorized" })
        }
        console.log("session getting")

        const session = await redis.get(`session:${sessionId}`)

        console.log(`session get from redis:${session}`)
        if (!session) {
            return res.status(401).json({ message: "session expired" })
        }

        req.user = JSON.parse(session);

        next()

    } catch (error) {
        return res.status(500).json({ message: error.message })

    }


}