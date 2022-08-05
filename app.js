import "dotenv/config";
import cors from "cors";
import express from "express";
import authRouter from "./routes/auth.js";
import connectToMongo from "./models/index.js";
import cookieParser from "cookie-parser"
import {Server} from "socket.io";
import http from "http";


const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:8080",
  },
});

if (!process.env.PORT) {
  console.log("please provide PORT number and try again");
  process.exit();
}
if (!process.env.SECRET) {
  console.log("please provide SECRET and try again");
  process.exit();
}

connectToMongo().then((connection) => {
  const app = express();
  server = http.createServer(app);
  app.use(express.json());
  app.use(
    cors({
      origin: ["http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    })
  );
  app.use(cookieParser());
  
  app.use("/auth", authRouter);

  io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (data) => {
    socket.join(data);
    console.log(`User with ID: ${socket.id} joined room: ${data}`);
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});


  app.listen(process.env.PORT, () =>
    console.log("listening on " + process.env.PORT)
  );
});
