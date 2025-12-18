import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

import { router } from "./routes/routes.js";
import { connectDB } from "./db/mongo-db-connect.js";
import { setupSocketIO } from "./socket/socketHandler.js";

const app = express();

app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

connectDB();

// All Routes
app.use('/api', router);

// Create HTTP server
const httpServer = createServer(app);

// Setup Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

setupSocketIO(io);

httpServer.listen(8080, () => {
    console.log("App is listening on port 8080");
});