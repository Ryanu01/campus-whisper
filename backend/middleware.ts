import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken"

export default function authMiddleWare (req: Request, res: Response, next: NextFunction) {
    try {
        const headers = req.headers["authorization"]?.split(" ")
        if(!headers) {
            return res.status(403).json({
                message: "TOKEN_INVALID",
                error: true
            })
        }
        const token = headers[1]!

        const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "") as JwtPayload

        if(!decoded) {
            return res.status(403).json({
                message: "TOKEN_INVALID",
                error: true
            })
        }

        req.userId = decoded.userId
        next()
    } catch (error) {
        return res.status(500).json({
            message: error,
            error: true
        })
    }
}