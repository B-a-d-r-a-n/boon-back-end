// models/user.model.mjs
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please tell us your name!"],
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
      // Consider adding a validator for email format
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    avatarUrl: { type: String, required: false },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 8,
      select: false, // Do not send password back in query results by default
    },
    passwordConfirm: {
      // Only used for validation, not saved
      type: String,
      // required: [true, 'Please confirm your password'], // Only required on registration
      validate: {
        // This only works on CREATE and SAVE!!!
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords are not the same!",
      },
    },
    passwordChangedAt: Date,
    refreshToken: String, // For storing a refresh token if needed for specific strategies
  },
  { timestamps: true }
); // Adds createdAt and updatedAt

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field as it's not needed to be saved
  this.passwordConfirm = undefined;
  next();
});

// Pre-save middleware to update passwordChangedAt
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; // -1 sec to ensure token is created after password change
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  // False means NOT changed
  return false;
};

const User = mongoose.model("User", userSchema);

export default User;
