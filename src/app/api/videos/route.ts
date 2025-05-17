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
      'SELECT * FROM videos WHERE claim_id = $1 ORDER BY id',
      [claimId]
    );
    
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { claim_id, file_url, model_status } = await request.json();
    
    const result = await pool.query(
      'INSERT INTO videos (claim_id, file_url, model_status) VALUES ($1, $2, $3) RETURNING *',
      [claim_id, file_url, model_status]
    );
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating video record:', error);
    return NextResponse.json(
      { error: 'Failed to create video record' },
      { status: 500 }
    );
  }
}