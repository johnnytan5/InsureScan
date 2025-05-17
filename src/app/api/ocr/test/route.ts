import { NextResponse } from "next/server";
import OpenAI from "openai";

// OpenAI client initialization
const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY!,
  baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
});

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64 || !imageBase64.startsWith('data:image/')) {
      return NextResponse.json(
        { error: "Valid image base64 is required" },
        { status: 400 }
      );
    }
    
    // Perform OCR using OpenAI
    const response = await openai.chat.completions.create({
      model: "qwen-vl-max",
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text: "You are a helpful assistant.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageBase64 },
            },
            {
              type: "text",
              text: "Extract all text and return them in a clean format please. Extract driver information",
            },
          ],
        },
      ],
    });

    const extractedText = response.choices[0].message.content || "";
    
    return NextResponse.json({
      success: true,
      text: extractedText
    });
  } catch (error: any) {
    console.error("OCR test error:", error);
    
    return NextResponse.json(
      {
        error: error.message || "Error processing image",
        status: "error",
      },
      { status: 500 }
    );
  }
}