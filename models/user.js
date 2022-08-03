import mongoose from "mongoose";
import bcrypt from "bcrypt";
const SALT_WORK_FACTOR = 10;
const userSchema = mongoose.Schema({
  First_name:String,
  Last_name:String,
  user_name:String,
  email: String,
  password: String,
  city: String,
});

userSchema.pre("save", async function save(next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
    const hash = await bcrypt.hash(this.password, salt);
    console.log(this.password, salt, hash);
    this.password = hash;
    return next();
  } catch (err) {
    return next(err);
  }
});

userSchema.methods.validatePassword = async function validatePassword(data) {
  return bcrypt.compare(data, this.password);
};

const User = new mongoose.model("user", userSchema);
export default User;
