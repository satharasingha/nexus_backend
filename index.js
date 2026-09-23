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

const mongodbURI = process.env.MONGO_URI;

console.log("MONGO_URI exists:", !!mongodbURI);

if (!mongodbURI) {
    console.error("MONGO_URI is not defined.");
    process.exit(1);
}

mongoose
    .connect(mongodbURI)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    });

app.use(cors());

app.use(express.json());

app.use(authenticateUser);

app.use("/api/users", userRouter);

app.use("/api/products", productRouter);

app.use("/api/orders", orderRouter);

app.use("/api/reviews", reviewRouter);

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});