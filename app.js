import "dotenv/config";
import cors from "cors";
import express from "express";
import authRouter from "./routes/auth.js";
import connectToMongo from "./models/index.js";
import cookieParser from "cookie-parser"

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

  app.listen(process.env.PORT, () =>
    console.log("listening on " + process.env.PORT)
  );
});
