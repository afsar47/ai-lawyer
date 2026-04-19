import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import AIResult from '../../../models/AIResult';
import dbConnect from '../../../lib/mongodb';

// GET - Fetch AI results for a user (legacy: patientId)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || searchParams.get('patientId');
    const type = searchParams.get('type');

    console.log('Fetching AI results:', { userId, type });

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    // Ensure it's a string for comparison
    const userIdStr = String(userId);
    const query: any = { 
      $or: [{ userId: userIdStr }, { patientId: userIdStr }]
    };
    if (type) {
      query.type = type;
    }

    console.log('Query:', JSON.stringify(query, null, 2));

    const results = await AIResult.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    console.log('Found AI results:', results.length);
    if (results.length > 0) {
      console.log('Sample result patientId:', results[0].patientId);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST - Save a new AI result
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    let { userId, patientId, type, title, content, rawData, aiModel, metadata } = body;

    // Ensure userId is a string (fallback to legacy patientId)
    userId = String(userId || patientId);
    patientId = String(patientId || userId);

    console.log('Saving AI result:', { userId, type, title, hasContent: !!content });

    if (!userId || !type || !title || !content) {
      console.error('Missing required fields:', { userId: !!userId, type: !!type, title: !!title, content: !!content });
      return NextResponse.json(
        { message: 'Missing required fields: userId, type, title, content' },
        { status: 400 }
      );
    }

    const aiResult = new AIResult({
      userId,
      patientId,
      type,
      title,
      content,
      rawData,
      aiModel,
      metadata,
    });

    await aiResult.save();
    console.log('AI result saved successfully:', { 
      id: aiResult._id, 
      savedPatientId: aiResult.patientId, 
      savedPatientIdType: typeof aiResult.patientId,
      type 
    });

    return NextResponse.json({ result: aiResult, message: 'AI result saved successfully' }, { status: 201 });
  } catch (error) {
    console.error('API Error saving AI result:', error);
    return NextResponse.json({ 
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete an AI result
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'AI result ID is required' }, { status: 400 });
    }

    const result = await AIResult.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json({ message: 'AI result not found' }, { status: 404 });
    }

    console.log('AI result deleted successfully:', { id });

    return NextResponse.json({ message: 'AI result deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('API Error deleting AI result:', error);
    return NextResponse.json({ 
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

