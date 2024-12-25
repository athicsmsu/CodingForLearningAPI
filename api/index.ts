import express from "express";
import { conn } from "../dbconnect";

export const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).send("Method GET in index.ts");
});