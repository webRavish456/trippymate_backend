import mongoose from "mongoose";

const BlogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    content: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    tags: [{
        type: String
    }],
    category: {
        type: String,
        default: "Travel"
    },
    author: {
        type: String,
        default: ""
    },
    authorImage: {
        type: String,
        default: ""
    },
    readTime: {
        type: String,
        default: "5 min read"
    },
    publishedDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ["Draft", "Published"],
        default: "Published"
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    shares: {
        type: Number,
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    sectionType: {
        type: String,
        enum: ["main", "article"],
        default: "main"
    }
}, {
    timestamps: true  // Optional: adds createdAt and updatedAt fields
});

const Blog = mongoose.model("Blog", BlogSchema);

export default Blog