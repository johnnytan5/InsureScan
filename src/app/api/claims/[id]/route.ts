import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/aspara-db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const result = await pool.query(
      'SELECT * FROM claims WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching claim:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claim' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const updates = await request.json();
    
    // Build the SET clause and parameters dynamically
    const allowedFields = ['status', 'claim_score', 'processed_at'];
    const setValues: string[] = [];
    const queryParams: any[] = [];
    
    // Add id as the first parameter
    queryParams.push(id);
    let paramCounter = 1;
    
    // // Always add updated_at = NOW()
    // setValues.push('updated_at = NOW()');
    
    // Build the SET clause based on provided fields
    Object.entries(updates).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        setValues.push(`${key} = $${paramCounter + 1}`);
        queryParams.push(value);
        paramCounter++;
      }
    });
    
    const query = `
      UPDATE claims 
      SET ${setValues.join(', ')} 
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, queryParams);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Error updating claim:', error);
    return NextResponse.json(
      { error: 'Failed to update claim' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Check if claim exists before deleting
    const checkResult = await pool.query(
      'SELECT id FROM claims WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      );
    }
    
    // Delete the claim
    await pool.query(
      'DELETE FROM claims WHERE id = $1',
      [id]
    );
    
    return NextResponse.json(
      { message: 'Claim deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting claim:', error);
    return NextResponse.json(
      { error: 'Failed to delete claim' },
      { status: 500 }
    );
  }
}