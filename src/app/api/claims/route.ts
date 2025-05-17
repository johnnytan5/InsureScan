import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/aspara-db';

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM claims');
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching claims:', error);
    return NextResponse.json(
      { error: 'Failed to load claims' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, status, claim_score } = await request.json();
    
    const result = await pool.query(
      'INSERT INTO claims (name, status, claim_score) VALUES ($1, $2, $3) RETURNING *',
      [name, status, claim_score]
    );
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating claim:', error);
    return NextResponse.json(
      { error: 'Failed to create claim' },
      { status: 500 }
    );
  }
}