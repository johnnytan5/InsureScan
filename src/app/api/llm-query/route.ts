import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { input } = body; // combined instruction + format string

    if (!input) {
      return NextResponse.json(
        { error: 'Missing input in request body.' },
        { status: 400 }
      );
    }


    const completion = await openai.chat.completions.create({
      model: "qwen-plus",
      messages : [
      { role: "system", content: "You are a helpful assistant, please stricty adhere to the format." },
      { role: "user", content: input }]
    });

    const output = completion.choices[0].message.content;

    return NextResponse.json({ result: output });

  } catch (error: any) {
    console.error('LLM query error:', error);
    return NextResponse.json(
      {
        error: error.message || 'An error occurred while querying the LLM.',
        help: 'https://www.alibabacloud.com/help/en/model-studio/developer-reference/error-code',
      },
      { status: 500 }
    );
  }
}
