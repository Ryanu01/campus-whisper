import express from "express";
import { PostSchema, SignInSchema, SignUpSchema } from "./types";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import authMiddleWare from "./middleware";
import { CategoryEnum } from "@prisma/client";
import cors from "cors"
const client = new PrismaClient()
const PORT = 3000;
const app = express()

app.use(cors())
app.use(express.json())
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

    const validCategories = data.categories.filter((cat) =>
      Object.values(CategoryEnum).includes(cat as CategoryEnum)
    );
    
    const postDb = await client.post.create({
      data: {
        text: data.text,
        created_by: Number(req.userId),
        created_at: new Date(),
        categories: validCategories as CategoryEnum[],
      }
    })

    return res.status(200).json({
      postDb,
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

app.get("/api/v1/posts/bulk", authMiddleWare, async (req, res) => {
  try {
    
    const allPosts = await client.post.findMany()

    if(!allPosts) {
      return res.status(200).json({
        message: "NO_POSTS",
        error: false
      })
    }

    return res.status(200).json({
      allPosts,
      message: "",
      error: false
    })

  } catch (error) {
    return res.status(500).json({
      message: error,
      error: true
    })
  }
})

app.get("/api/v1/post/:userId", authMiddleWare, async (req, res) => {

  try {
    const userId = Number(req.params.userId)
    if(!userId) {
      return res.status(404).json({
        message: "NO_USERID_FOUND",
        error: true
      })
    }
    const allPosts = await client.post.findMany({
      where: {
        created_by: userId
      },
    })

    return res.status(200).json({
      allPosts,
      message: "",
      error: false
    })
  } catch (error) {
    return res.status(500).json({
      message: error,
      error: true
    })  
  }
})

app.get("/api/v1/posts/:category", authMiddleWare, async (req, res) => {
  try {

    const category = req.params.category

    if(!category) {
      return res.status(411).json({
        message: "NO_CATEGORY_PROVIDED",
        error: true
      })
    }
    
    if (!Object.values(CategoryEnum).includes(category as CategoryEnum)) {
      return res.status(400).json({
        message: "INVALID_CATEGORY",
        error: true,
      });
    }

    const posts = await client.post.findMany({
      where: {
        categories: {
          has: category as CategoryEnum
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    if(!posts.length) {
      return res.status(404).json({
        message: "NO_POSTS_AVAILABLE",
        error: true
      })
    }

    return res.status(200).json({
      posts,
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      message: error,
      error: true
    })
  }
})

app.get("/api/v1/post/like/:postId", authMiddleWare, async (req, res) => {
  try {
    const postId = req.params.postId

    
    if(!postId) {
      return res.status(404).json({
        message: "POST_NOT_FOUND",
        error: true
      })
    }

    const postDb = await client.post.findFirst({
      where: {
        id: Number(postId)
      }
    })

    if(!postDb) {
      return res.status(404).json({
        message: "POST_NOT_AVAILABLE",
        error: true
      })
    }
    const likes = await client.like.count({
      where: {
        postId: postDb?.id
      }
    })

    
    return res.status(200).json({
      likes,
      error: false
    })
  } catch (error) {
    return res.status(500).json({
      message: error,
      error: true
    })
  }
})

app.post("/api/v1/like/:postId", authMiddleWare, async (req, res) => {
  try {
    const postId = req.params.postId
    if(!postId) {
      return res.status(404).json({
        message: "POST_NOT_FOUND",
        error: true
      })
    }

    const postExist = await client.post.findFirst({
      where: {
        id: Number(postId)
      }
    })

    if(!postExist) {
      return res.status(404).json({
        message: "POST_NOT_FOUND",
        error: true
      })
    }

    const updateLike = await client.like.create({
      data: {
        postId: postExist.id,
        userId: Number(req.userId)
      }
    })

    return res.status(200).json({
      updateLike,
      message: "LIKE_ADDED",
      error: false
    })
  } catch (error) {
    return res.status(500).json({
      message: error,
      error: true
    })
  }
})

app.listen(PORT)
