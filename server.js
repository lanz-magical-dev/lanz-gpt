import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load env variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// setup lanzgpt (groq api)
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// chat endpoint
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    console.warn("Missing User Message.");
    return res.status(400).json({ reply: "Message is Required." });
  }

  console.log("User:", message);

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "llama3-8b-8192", // models: llama3-8b-8192, llama3-70b-8192, mixtral
      messages: [{ role: "user", content: message }],
    });

    const reply = chatCompletion.choices?.[0]?.message?.content || "No Response Generated.";
    console.log("LanzGPT:", reply);

    res.json({ reply });
  } catch (err) {
    console.error("LanzGPT Error:", err.message || err);
    res.status(500).json({ reply: "Oops! Something Went Wrong with LanzGPT." });
  }
});

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`LanzGPT Server Running → http://localhost:${PORT}`);
});
