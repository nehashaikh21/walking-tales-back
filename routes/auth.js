import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import authm from "../middleware/authm.js";
const router = express.Router();

router.get("/me", (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  //Authorization: 'Bearer TOKEN'
  if (!token) {
    res
      .status(200)
      .json({ success: false, message: "Error! Token was not provided." });
  }
  const decodedToken = jwt.verify(token, process.env.SECRET);
  res.status(200).json({ success: true, data: decodedToken });
  req.user = decodedToken.id;
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // DOES USER HAVE ACCOUNT
  const existingUser = await User.findOne({ email: email });
  console.log({ existingUser });
  if (existingUser === null) {
    res.status(400).send({
      success: false,
      message: "login failed. Check your credentials. Did you want to signup?",
    });
  } else {
    try {
      // DOES USER KNOW THE CORRECT PASSWORD
      const passwordIsCorrect = await existingUser.validatePassword(password);
      console.log({ passwordIsCorrect });

      if (!passwordIsCorrect) {
        res.status(400).send({
          success: false,
          message:
            "login failed. Check your credentials. Did you want to signup?",
        });
      } else {
        let token;
        try {
          token = jwt.sign(
            {
              userId: existingUser._id,
              email: existingUser.email,
              user_name: existingUser.user_name,
              isLoggedIn: true,
            },
            process.env.SECRET,
            { expiresIn: "1h" }
          );

          res.cookie('jwt', token, {
            httpOnly: true,
            secure: req.secure || req.headers['x-forwarded-proto'] === 'https', 
            sameSite: 'none'
        });

          res.status(201).json({
            success: true,
            message: "login successful",
            token,
            user :{
              id: existingUser._id,
              username: existingUser.user_name,
            }
          });
        } catch (e) {
          console.log({ e });
          res.status(500).send({
            success: false,
            message: "login failed. Please try again later.",
          });
        }
      }
    } catch (e) {
      res.status(500).send({
        success: false,
        message: "registration failed. Please try again later.",
      });
    }
  }
});

//--------------------------------------------------------------------------------------------------------------------------------------------------
//Registrestion part started
//--------------------------------------------------------------------------------------------------------------------------------------------------

// logout
// register
router.post("/register", async (req, res) => {
  const { email} = req.body;

  // check if is already used
  const existingUser = await User.findOne({email });
  if (existingUser !== null) {
    res.status(400).send({
      success: false,
      message: "registration failed. Maybe you already have an account?",
    });
  } else {
    try {
      const { First_name,Last_name,user_name,email,password,city } = req.body;

      const createdUser = await User.create({          
        First_name,
        Last_name,
        user_name,
        email,
        password,
        city,
      });
      let token;
      try {
        token = jwt.sign(
          {
            userId: createdUser._id,
            First_name: createdUser.First_name,
            Last_name: createdUser.Last_name,
            user_name: createdUser.user_name,
            email: createdUser.email,
            password: createdUser.password,
            city: createdUser.city,
            isLoggedIn: true,
          },
          process.env.SECRET,
          { expiresIn: "1h" }
        );

        res.status(201).json({
          success: true,
          data: { token },
        });
      } catch (e) {
        res.status(200).send({
          success: true,
          message: "registration was successful. Please log in.",
        });
      }
    } catch (e) {
      res.status(500).send({
        success: false,
        message: "registration failed. Please try again later.",
      });
    }
  }
});

router.post("/tokenIsValid", async (req, res) => {
  try {
    const token = req.header("x-auth-token");
    if (!token) return res.json(false);

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) return res.json(false);

    const user = await User.findById(verified.id);
    if (!user) return res.json(false);

    return res.json(true);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//get the username
router.get("/", authm, async (req, res) => {
  const user = await User.findById(req.user);
  res.json({
    email: user.email,
    username: user.user_name,
    id: user._id,
  });
});

//check if user is logged in
router.get("/user", async(req, res, next) => {
  let currentUser;
  if (req.cookies.jwt) {
      const token = req.cookies.jwt;
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      currentUser = await User.findById(decoded.id);
    } else {
      currentUser =  null;
    }    

    res.status(200).send({ currentUser });
});

export default router;