import express from "express";
import { PostSchema, SignInSchema, SignUpSchema } from "./types";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import authMiddleWare from "./middleware";
const client = new PrismaClient()
const PORT = 3000;
const app = express()

app.post("/api/v1/user/signup", async (req, res) => {
  try {
    const body = req.body
    const { success, data } = SignUpSchema.safeParse(body)

    if (!success) {
      return res.status(411).json({
        message: "INVALID_INPUTS",
        error: true
      })
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)

    const userExist = await client.user.findFirst({
      where: {
        email: data.email,
        password: hashedPassword
      }
    })

    if (userExist) {
      return res.status(400).json({
        message: "USER_ALREADY_EXIST",
        error: true
      })
    }



    const user = await client.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name
      }
    })

    return res.status(200).json({
      userId: user.id,
      message: "USER_CREATED",
      error: false
    })
  } catch (error) {
    return res.status(500).json({
      message: error,
      error: true
    })
  }
})

app.post("/api/v1/user/signin", async (req, res) => {
  try {
    const body = req.body
    const { success, data } = SignInSchema.safeParse(body)

    if (!success) {
      return res.status(411).json({
        message: "INVALID_INPUTS",
        error: true
      })
    }

    const userExist = await client.user.findFirst({
      where: {
        email: data.email
      }
    })

    if (!userExist) {
      return res.status(403).json({
        message: "USER_DOES_NOT_EXIST",
        error: true
      })
    }

    const isPasswordCorrect = await bcrypt.compare(data.password, userExist.password)
    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "INVALID_CREDENTIALS",
        error: true
      })
    }

    const token = jwt.sign({ userId: userExist.id, email: userExist.email }, process.env.JWT_SECRET ?? "")

    return res.status(201).json({
      token,
      message: "LOGIN_SUCCESSFUL",
      error: false
    })
  } catch (error) {
    return res.status(500).json({
      message: error,
      error: true
    })
  }
})

app.post("/api/v1/createPost", authMiddleWare, async (req, res) => {
  try {
    const body = req.body

    const { success, data } = PostSchema.safeParse(body)

    if (!success) {
      return res.status(411).json({
        message: "INVALID_INPUTS",
        error: true
      })
    }

    const postExist = await client.post.findFirst({
      where: {
        id: data.postId
      }
    })

    if (!postExist) {
      return res.status(404).json({
        message: "POST_DOES_NOT_EXIST",
        error: true
      })
    }

    const categoryDb = await client.category.create({
      data: {
        funny: data.categories.funny,
        rant: data.categories.rant,
        academics: data.categories.academics,
        crush: data.categories.crush,
        beef: data.categories.beef,
        gossips: data.categories.gossips,
        post_id: data.postId
      }
    })

    return res.status(200).json({
      categories: categoryDb,
      message: "POST_CREATED_SUCCESFULLY",
      error: false
    })
  } catch (error) {
    return res.status(500).json({
      message: error,
      error: true
    })
  }
})



app.listen(PORT, () => {
  console.log("Server running " + PORT);

})
