import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";

const openai = new OpenAI({
  apiKey: "sk-cba48e806aba4b96996be1b8fed0fbcb",
  baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
});

const imagePath = "/Users/johnnytan/Desktop/a.png";

// Helper to determine MIME type based on file extension
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".webp": return "image/webp";
    case ".bmp": return "image/bmp";
    default: return "application/octet-stream";
  }
}

// Convert image to base64 data URL
async function imageToBase64(filePath) {
  const buffer = await fs.readFile(filePath);
  const base64 = buffer.toString("base64");
  const mimeType = getMimeType(filePath);
  return `data:${mimeType};base64,${base64}`;
}

async function main() {
  const base64ImageUrl = await imageToBase64(imagePath);

  const response = await openai.chat.completions.create({
    model: "qwen-vl-max",
    messages: [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: "You are a helpful assistant."
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: base64ImageUrl
            }
          },
          {
            type: "text",
            text: "Extract all text and return them in a clean format please. Extract driver information"
          }
        ]
      }
    ]
  });

  console.log(response.choices[0].message.content);
}

main();
