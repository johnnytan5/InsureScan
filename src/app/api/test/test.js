import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import FormData from 'form-data';

const API_KEY = "sk-cba48e806aba4b96996be1b8fed0fbcb"; // Replace with your DashScope API Key
const IMAGE_PATH = '/Users/johnnytan/Desktop/a.png'; // Replace with your own image path

async function runOCR() {
  try {
    const imageBuffer = await fs.readFile(IMAGE_PATH);

    const formData = new FormData();
    formData.append('model', 'qwen2.5-vl-32b-instruct'); // Use the correct model name
    formData.append('input', JSON.stringify({
      messages: [
        {
          role: 'user',
          content: [
            { text: 'Please extract all visible text from this image in a clean format.' },
            { image: "https://amwadxlwaqpoltaixxsy.supabase.co/storage/v1/object/public/temp//a.png"}
          ]
        }
      ]
    }));

    const response = await axios.post(
      'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation ',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    console.log('✅ OCR Result:');
    console.log(response.data.output.text || '(No text returned)');
  } catch (error) {
    console.error('❌ OCR Error:', error.response?.data || error.message);
  }
}

runOCR();