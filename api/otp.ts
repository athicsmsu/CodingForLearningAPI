import express from "express";
import nodemailer from "nodemailer";
export const router = express.Router();

const otpStore = new Map<string, string>(); // key = email, value = otp

// ใช้ Gmail SMTP หรือของคุณเอง
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "65011212145@msu.ac.th", // ใส่อีเมลจริง
    pass: "lltvcvttbrgrdbkv", // ใส่รหัสผ่านแอป (ไม่ใช่รหัส Gmail ปกติ)
  },
});

// POST /api/send-otp
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 หลัก
  otpStore.set(email, otp); // เก็บ OTP ชั่วคราว

  const mailOptions = {
    from: "Codeing For Learnig",
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    res.status(500).json({ error: "Failed to send email", detail: error });
  }
});

// POST /api/verify-otp
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const validOtp = otpStore.get(email);

  if (otp === validOtp) {
    otpStore.delete(email); // ล้าง OTP เมื่อใช้สำเร็จ
    res.status(200).json({ message: "OTP verified successfully" });
  } else {
    res.status(400).json({ message: "Invalid OTP" });
  }
});
