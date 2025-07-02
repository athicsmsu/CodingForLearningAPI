import express from "express";

import { router as index } from "./api/index";
import { router as user } from "./api/user";
import { router as otp } from "./api/otp";
import { router as code } from "./api/CodeCompile";
import { router as gameplay } from "./api/gameplay";
import { router as question } from "./api/question";
import { router as history } from "./api/History";


import bodyParser from "body-parser";

export const app = express();
import cors from "cors";
app.use(
  cors({
    origin: "*",
  })
);

// ตั้งค่า body parser
app.use(bodyParser.text());
app.use(bodyParser.json());

app.use("/", index);
app.use("/user", user);
app.use("/code", code);
app.use("/otp", otp);
app.use("/gameplay", gameplay);
app.use("/question", question);
app.use("/history", history);