import express from "express";
import Review from "../models/review.js";
import User from "../models/user.js";
import authenticateUser from "../middlewares/authentication.js"; // 🔁 match your actual path

const reviewRouter = express.Router();

/* ================= CREATE REVIEW ================= */
reviewRouter.post("/", authenticateUser, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Please login to review" });
        }

        const { productId, productName, rating, text } = req.body;

        if (!productId || !rating || !text) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // 🔎 Find user by email (since JWT doesn't have _id)
        const user = await User.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const review = new Review({
            userId: user._id,     // ✅ real ObjectId from DB
            productId,
            productName,
            rating,
            text
        });

        await review.save();

        res.status(201).json({
            message: "Review submitted. It will appear after approval."
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ================= GET APPROVED REVIEWS (for homepage) ================= */
reviewRouter.get("/", async (req, res) => {
    try {
        const { approved, limit } = req.query;

        const filter = {};
        if (approved === "true") filter.approved = true;

        const reviews = await Review.find(filter)
            .populate("userId", "firstName lastName image")
            .sort({ createdAt: -1 })
            .limit(parseInt(limit) || 20);

        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ================= GET REVIEWS FOR A PRODUCT ================= */
reviewRouter.get("/product/:productId", async (req, res) => {
    try {
        const reviews = await Review.find({
            productId: req.params.productId,
            approved: true
        })
            .populate("userId", "firstName lastName image")
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ================= ADMIN: APPROVE A REVIEW ================= */
reviewRouter.put("/:id/approve", authenticateUser, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Please login" });
        }

        // 🔐 Check isAdmin from DB (safer than token)
        const user = await User.findOne({ email: req.user.email });
        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: "Admin only" });
        }

        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { approved: true },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        res.json(review);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ================= ADMIN: DELETE A REVIEW ================= */
reviewRouter.delete("/:id", authenticateUser, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Please login" });
        }

        const user = await User.findOne({ email: req.user.email });
        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: "Admin only" });
        }

        await Review.findByIdAndDelete(req.params.id);
        res.json({ message: "Review deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default reviewRouter;