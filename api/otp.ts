import express from "express";
import nodemailer from "nodemailer";
export const router = express.Router();

// ใช้ Gmail SMTP หรือของคุณเอง
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "65011212145@msu.ac.th", // ใส่อีเมลจริง
    pass: "lltvcvttbrgrdbkv", // ใส่รหัสผ่านแอป (ไม่ใช่รหัส Gmail ปกติ)
  },
});

// เปลี่ยน otpStore ให้เก็บ OTP, timeout และ expiresAt
const otpStore = new Map<
  string,
  { otp: string; timeout: NodeJS.Timeout; expiresAt: number }
>();

// POST /api/send-otp
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresInMs = 5 * 60 * 1000; // 5 นาที
  const expiresAt = Date.now() + expiresInMs;

  // ถ้ามี OTP เดิมอยู่แล้ว ให้เคลียร์ timeout ก่อน
  if (otpStore.has(email)) {
    clearTimeout(otpStore.get(email)!.timeout);
  }

  const timeout = setTimeout(() => {
    otpStore.delete(email);
    console.log(`OTP for ${email} expired.`);
  }, expiresInMs);

  otpStore.set(email, { otp, timeout, expiresAt });

  const mailOptions = {
    from: "your_email@gmail.com",
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp} (valid for 5 minutes)`,
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
  const record = otpStore.get(email);

  if (!record) {
    return res.status(400).json({ message: "No OTP sent or already expired" });
  }

  if (Date.now() > record.expiresAt) {
    clearTimeout(record.timeout);
    otpStore.delete(email);
    return res.status(400).json({ message: "OTP has expired" });
  }

  if (otp !== record.otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  clearTimeout(record.timeout);
  otpStore.delete(email);
  res.status(200).json({ message: "OTP verified successfully" });
});
