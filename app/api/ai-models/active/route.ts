import { NextRequest, NextResponse } from 'next/server';
import { requireSession, requireRole } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit';
import dbConnect from '../../../../lib/mongodb';
import AIModel from '../../../../models/AIModel';

// GET active AI model
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    if (!requireRole(auth.role, ['admin', 'doctor', 'staff'])) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const activeModel = await AIModel.findOne({ isActive: true });
    
    return NextResponse.json({
      success: true,
      data: activeModel
        ? { ...(activeModel.toObject ? activeModel.toObject() : activeModel), apiKey: undefined, apiKeyConfigured: Boolean(activeModel.apiKey) }
        : null
    });
  } catch (error) {
    console.error('Error fetching active AI model:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch active AI model',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST set active AI model
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    if (!requireRole(auth.role, ['admin'])) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Model ID is required' 
        },
        { status: 400 }
      );
    }

    // First, set all models to inactive
    await AIModel.updateMany({}, { isActive: false });

    // Then, set the specified model as active
    const activeModel = await AIModel.findOneAndUpdate(
      { id: body.id },
      { isActive: true },
      { new: true }
    );

    if (!activeModel) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'AI model not found' 
        },
        { status: 404 }
      );
    }

    await writeAuditLog({
      request,
      action: 'ai.model.set_active',
      actorId: String(auth.session.user.id || ''),
      actorEmail: String(auth.session.user.email || ''),
      actorRole: auth.role,
      resourceType: 'ai_model',
      resourceId: String(activeModel.id),
      message: 'AI active model set',
    });

    return NextResponse.json({
      success: true,
      data: { ...(activeModel.toObject ? activeModel.toObject() : activeModel), apiKey: undefined, apiKeyConfigured: Boolean(activeModel.apiKey) },
      message: 'Active AI model set successfully'
    });

  } catch (error) {
    console.error('Error setting active AI model:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to set active AI model',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
