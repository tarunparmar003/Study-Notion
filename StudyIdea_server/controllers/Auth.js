const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const User = require("../models/User");
const OTP = require("../models/OTP");
const Profile = require("../models/Profile");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
require("dotenv").config();

// ------------------------- SIGNUP -------------------------
exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
      return res.status(403).json({ success: false, message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists, please login" });
    }

    // Get latest OTP
    const recentOTP = await OTP.findOne({ email }).sort({ createdAt: -1 });

    if (!recentOTP || recentOTP.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create profile
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: contactNumber || null,
    });

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      accountType,
      approved: accountType === "Instructor" ? false : true,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/9.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    return res.status(200).json({ success: true, message: "User registered successfully", user });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ success: false, message: "Signup failed, please try again" });
  }
};

// ------------------------- LOGIN -------------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).populate("additionalDetails");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found, please signup" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, accountType: user.accountType },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    user.token = token;
    user.password = undefined;

    return res
      .cookie("token", token, { expires: new Date(Date.now() + 3 * 60 * 60 * 1000), httpOnly: true })
      .status(200)
      .json({ success: true, token, user, message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Login failed, please try again" });
  }
};

// ------------------------- SEND OTP -------------------------
exports.sendotp = async (req, res) => {
  try {
    const { email } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already registered" });
    }

    let otp;
    let existingOTP;
    do {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      existingOTP = await OTP.findOne({ otp });
    } while (existingOTP);

    await OTP.create({ email, otp });

    await mailSender(
      email,
      "StudyNotion - Verify Your Email",
      `<h1>Your OTP is: ${otp}</h1><p>It will expire in 5 minutes.</p>`
    );

    return res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// ------------------------- CHANGE PASSWORD -------------------------
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, message: "New passwords do not match" });
    }

    const user = await User.findById(req.user.id);

    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: "Old password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await mailSender(
      user.email,
      "Password Updated",
      passwordUpdated(user.email, `Hi ${user.firstName}, your password was changed successfully.`)
    );

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ success: false, message: "Failed to update password" });
  }
};
