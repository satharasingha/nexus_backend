import express from "express";

import {
    changePassword,
    createUser,
    getUserData,
    loginUser,
    updateUserData,
    getAllUsers,
    toggleBlockUser,
    toggleAdminUser
} from "../controllers/userController.js";

import authenticateUser from "../middlewares/authentication.js";

const userRouter = express.Router();

/* ================= PUBLIC ROUTES ================= */
userRouter.post("/register", createUser);
userRouter.post("/login", loginUser);

/* ================= AUTHENTICATED ROUTES ================= */
userRouter.get("/me", authenticateUser, getUserData);
userRouter.put("/", authenticateUser, updateUserData);
userRouter.put("/password", authenticateUser, changePassword);

/* ================= ADMIN ROUTES ================= */
userRouter.get("/all", authenticateUser, getAllUsers);
userRouter.put("/:id/block", authenticateUser, toggleBlockUser);
userRouter.put("/:id/admin", authenticateUser, toggleAdminUser);

export default userRouter;