import { z } from "zod"


export const SignUpSchema = z.object({
    name: z.string(),
    password: z.string().min(5),
    email: z.email()
})

export const SignInSchema = z.object({
    email: z.string(),
    password: z.string().min(5)
})

export const PostSchema = z.object({
    text: z.string(),
    categories: z.string().array()
})
