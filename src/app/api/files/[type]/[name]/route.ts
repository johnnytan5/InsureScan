import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string, name: string } }
) {
  try {
    const { type, name } = params;
    const filePath = path.join(process.cwd(), 'uploads', type, name);
    
    // Try to read the file
    const file = await readFile(filePath).catch(() => null);
    
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Set appropriate content type
    const ext = path.extname(name).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.mp4') contentType = 'video/mp4';
    
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}