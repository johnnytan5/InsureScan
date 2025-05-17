import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/aspara-db';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Build query with optional filters
    let query = 'SELECT * FROM claims';
    const queryParams: any[] = [];
    
    if (status) {
      query += ' WHERE status = $1';
      queryParams.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, queryParams);
    
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching claims:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claims' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, status } = await request.json();
    
    // Validate required fields
    if (!name || !status) {
      return NextResponse.json(
        { error: 'Name and status are required fields' },
        { status: 400 }
      );
    }
    
    // Insert the claim with current timestamp
    const result = await pool.query(
      'INSERT INTO claims (name, status, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [name, status]
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