import mongoose from "mongoose";

const ArticleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    author: {
        type: String,
        default: ""
    },
    authorImage: {
        type: String,
        default: ""
    },
    publishedDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ["Draft", "Published"],
        default: "Published"
    }
}, {
    timestamps: true  // Optional: adds createdAt and updatedAt fields
});

const Article = mongoose.model("Article", ArticleSchema);

export default Article;

