import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        productId: {
            type: String,
            required: true
        },
        productName: {
            type: String,
            default: ""
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        text: {
            type: String,
            required: true,
            maxlength: 500
        },
        approved: {
            type: Boolean,
            required: true,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const Review = mongoose.model("Review", reviewSchema);

export default Review;