import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || "",
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || "",
  },
});

interface PanicGestureRequest {
  videoFrameDataUri: string;
}

interface PanicGestureResponse {
  panicGestureDetected: boolean;
  confidenceScore: number;
  error?: string;
}

app.post("/api/detect-panic-gesture", async (req, res) => {
  try {
    const { videoFrameDataUri } = req.body as PanicGestureRequest;

    if (!videoFrameDataUri) {
      return res.status(400).json({ 
        panicGestureDetected: false, 
        confidenceScore: 0,
        error: "No video frame provided" 
      });
    }

    const base64Match = videoFrameDataUri.match(/^data:([^;]+);base64,(.+)$/);
    if (!base64Match) {
      return res.status(400).json({ 
        panicGestureDetected: false, 
        confidenceScore: 0,
        error: "Invalid data URI format" 
      });
    }

    const mimeType = base64Match[1];
    const base64Data = base64Match[2];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: `You are an AI model specializing in hand pose recognition. Analyze this image to determine if it contains a panic gesture.

The panic gesture is defined as a person holding up one open hand with all five fingers clearly spread apart, palm facing the camera.

Respond ONLY with a JSON object in this exact format:
{"panicGestureDetected": true/false, "confidenceScore": 0.0-1.0}

The confidenceScore should be between 0 and 1, indicating how confident you are in the detection.
Only return the JSON, no other text.`,
            },
          ],
        },
      ],
    });

    const text = response.text || "";
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as PanicGestureResponse;
        return res.json({
          panicGestureDetected: Boolean(parsed.panicGestureDetected),
          confidenceScore: Number(parsed.confidenceScore) || 0,
        });
      }
    } catch {
      console.error("Failed to parse AI response:", text);
    }

    return res.json({
      panicGestureDetected: false,
      confidenceScore: 0,
    });
  } catch (error) {
    console.error("Error detecting panic gesture:", error);
    return res.status(500).json({
      panicGestureDetected: false,
      confidenceScore: 0,
      error: "Failed to analyze image",
    });
  }
});

app.get("/api/health", (_, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Gesture detection server running on port ${PORT}`);
});
