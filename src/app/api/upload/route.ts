import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Base upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const type = formData.get('type') as string || 'documents';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Create directory for the specific file type
    const typeDir = path.join(UPLOAD_DIR, type);
    await mkdir(typeDir, { recursive: true });
    
    // Create file path
    const filePath = path.join(typeDir, fileName);
    
    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);
    
    // Generate a URL for accessing this file
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const fileUrl = `${baseUrl}/api/files/${type}/${fileName}`;
    
    return NextResponse.json({ fileUrl }, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}