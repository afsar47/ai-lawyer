import { NextRequest, NextResponse } from 'next/server';
import { requireSession, requireRole } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit';
import dbConnect from '../../../lib/mongodb';
import AIModel from '../../../models/AIModel';

// GET all AI models
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    if (!requireRole(auth.role, ['admin'])) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const models = await AIModel.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      // Do not return raw apiKey to the browser (even for admins).
      data: models.map((m: any) => {
        const obj = m.toObject ? m.toObject() : m;
        return { ...obj, apiKey: undefined, apiKeyConfigured: Boolean(obj.apiKey) };
      }),
      count: models.length
    });
  } catch (error) {
    console.error('Error fetching AI models:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch AI models',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST new AI model
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    if (!requireRole(auth.role, ['admin'])) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    console.log('POST /api/ai-models - Starting model creation...');
    await dbConnect();
    console.log('Database connected');
    
    const body = await request.json();
    console.log('Request body:', { ...body, apiKey: body.apiKey ? '[HIDDEN]' : 'MISSING' });

    // Validate required fields
    if (!body.name || !body.provider || !body.apiKey) {
      console.log('Validation failed:', { name: !!body.name, provider: !!body.provider, apiKey: !!body.apiKey });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: name, provider, and apiKey are required' 
        },
        { status: 400 }
      );
    }

    // Generate unique ID
    const id = Date.now().toString();
    console.log('Generated ID:', id);

    // Create new AI model
    const modelData = {
      ...body,
      id,
      isActive: body.isActive || false
    };
    console.log('Model data to save:', { ...modelData, apiKey: '[HIDDEN]' });

    const newModel = new AIModel(modelData);
    console.log('Model instance created');

    const savedModel = await newModel.save();
    console.log('Model saved successfully:', { id: savedModel.id, name: savedModel.name });

    await writeAuditLog({
      request,
      action: 'ai.model.create',
      actorId: String(auth.session.user.id || ''),
      actorEmail: String(auth.session.user.email || ''),
      actorRole: auth.role,
      resourceType: 'ai_model',
      resourceId: String(savedModel.id),
      message: 'AI model created',
    });

    return NextResponse.json({
      success: true,
      data: { ...(savedModel.toObject ? savedModel.toObject() : savedModel), apiKey: undefined, apiKeyConfigured: true },
      message: 'AI model created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating AI model:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create AI model',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT update AI model
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    if (!requireRole(auth.role, ['admin'])) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    console.log('PUT /api/ai-models - Starting model update...');
    await dbConnect();
    console.log('Database connected');
    
    const body = await request.json();
    console.log('Request body:', { ...body, apiKey: body.apiKey ? '[HIDDEN]' : 'MISSING' });

    if (!body.id) {
      console.log('Validation failed: Model ID is missing');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Model ID is required' 
        },
        { status: 400 }
      );
    }

    console.log('Looking for model with ID:', body.id);
    const existingModel = await AIModel.findOne({ id: body.id });
    console.log('Existing model found:', existingModel ? 'Yes' : 'No');

    // If apiKey is omitted/blank, preserve existing key in DB
    const updateBody = { ...body };
    if (updateBody.apiKey === undefined || updateBody.apiKey === null || String(updateBody.apiKey).trim() === '') {
      delete (updateBody as any).apiKey;
    }

    const updatedModel = await AIModel.findOneAndUpdate(
      { id: body.id },
      { $set: updateBody },
      { new: true, runValidators: true }
    );

    if (!updatedModel) {
      console.log('Model not found after update attempt');
      return NextResponse.json(
        { 
          success: false, 
          error: 'AI model not found' 
        },
        { status: 404 }
      );
    }

    console.log('Model updated successfully:', { id: updatedModel.id, name: updatedModel.name });

    await writeAuditLog({
      request,
      action: 'ai.model.update',
      actorId: String(auth.session.user.id || ''),
      actorEmail: String(auth.session.user.email || ''),
      actorRole: auth.role,
      resourceType: 'ai_model',
      resourceId: String(updatedModel.id),
      message: 'AI model updated',
    });

    return NextResponse.json({
      success: true,
      data: { ...(updatedModel.toObject ? updatedModel.toObject() : updatedModel), apiKey: undefined, apiKeyConfigured: Boolean(updatedModel.apiKey) },
      message: 'AI model updated successfully'
    });

  } catch (error) {
    console.error('Error updating AI model:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update AI model',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE AI model
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    if (!requireRole(auth.role, ['admin'])) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Model ID is required' 
        },
        { status: 400 }
      );
    }

    const deletedModel = await AIModel.findOneAndDelete({ id });

    if (!deletedModel) {
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
      action: 'ai.model.delete',
      actorId: String(auth.session.user.id || ''),
      actorEmail: String(auth.session.user.email || ''),
      actorRole: auth.role,
      resourceType: 'ai_model',
      resourceId: String(id),
      message: 'AI model deleted',
    });

    return NextResponse.json({
      success: true,
      message: 'AI model deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting AI model:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete AI model',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
