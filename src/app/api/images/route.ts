import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/aspara-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const claimId = searchParams.get('claim_id');
    
    if (!claimId) {
      return NextResponse.json(
        { error: 'claim_id is required' },
        { status: 400 }
      );
    }
    
    const result = await pool.query(
      'SELECT * FROM images WHERE claim_id = $1 ORDER BY id',
      [claimId]
    );
    
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { claim_id, file_url, part, severity } = await request.json();
    
    const result = await pool.query(
      'INSERT INTO images (claim_id, file_url, part, severity) VALUES ($1, $2, $3, $4) RETURNING *',
      [claim_id, file_url, part, severity]
    );
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating image record:', error);
    return NextResponse.json(
      { error: 'Failed to create image record' },
      { status: 500 }
    );
  }
}