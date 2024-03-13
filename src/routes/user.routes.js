import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router=Router()
//this will add /register ppath and will register
router.route("/register").post(registerUser)

export default router