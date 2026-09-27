import express from "express";
import mongoose from "mongoose";
import userRouter from "./routers/userRouter.js";
import authenticateUser from "./middlewares/authentication.js";
import productRouter from "./routers/productRouter.js";
import cors from "cors";
import dotenv from "dotenv";
import orderRouter from "./routers/orderRouter.js";
import reviewRouter from "./routers/reviewRouter.js";

dotenv.config();

const app = express();

// ===============================
// MongoDB Configuration
// ===============================

const mongodbURI = process.env.MONGO_URI;

console.log("MONGO_URI exists:", !!mongodbURI);

if (!mongodbURI) {
    console.error("MONGO_URI is not defined.");
    process.exit(1);
}

// Connect to MongoDB
mongoose
    .connect(mongodbURI)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    });

// ===============================
// Middleware
// ===============================

app.use(
    cors({
        origin: true,
        credentials: true,
    })
);

app.use(express.json());

// ===============================
// Health Check
// ===============================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Nexus backend is running",
    });
});

// ===============================
// Authentication Middleware
// ===============================

app.use(authenticateUser);

// ===============================
// API Routes
// ===============================

app.use("/api/users", userRouter);

app.use("/api/products", productRouter);

app.use("/api/orders", orderRouter);

app.use("/api/reviews", reviewRouter);

// ===============================
// 404 Handler
// ===============================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl,
    });
});

// ===============================
// Error Handler
// ===============================

app.use((error, req, res, next) => {
    console.error("Server error:", error);

    res.status(error.status || 500).json({
        success: false,
        message: error.message || "Internal server error",
    });
});

// ===============================
// Start Server
// ===============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});
