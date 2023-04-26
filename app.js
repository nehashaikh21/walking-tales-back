import "dotenv/config";
import cors from "cors";
import express from "express";
import authRouter from "./routes/auth.js";
import connectToMongo from "./models/index.js";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import userRouter from "./routes/user.js";

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

  app.use(
    cors({
      origin: [process.env.CLIENT],
      methods: ["GET", "POST"],
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json());

  app.use("/auth", authRouter);

  app.use("/users", userRouter);

  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: [process.env.CLIENT],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io = require("socket.io")(server, {
    handlePreflightRequest: (req, res) => {
      const headers = {
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Origin": req.headers.origin, //or the specific origin you want to give access to,
        "Access-Control-Allow-Credentials": true,
      };
      res.writeHead(200, headers);
      res.end();
    },
  });

  io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on("message", ({ name, message }) => {
      io.emit("message", { name, message });
    });

    // socket.on("join_room", (data) => {
    //   socket.join(data);
    //   // console.log(`User with ID: ${socket.id} joined room: ${data}`);
    // });

    // socket.on("send_message", (data) => {
    //   socket.to(data.room).emit("receive_message", data);
    // });

    // socket.on("disconnect", () => {
    //   console.log("User Disconnected", socket.id);
    // });
  });

  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", process.env.CLIENT); // update to match the domain you will make the request from
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });

  server.listen(process.env.PORT, () =>
    console.log("listening on " + process.env.PORT)
  );
});
