import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Settings from '@/models/Settings';

const ALLOWED_JURISDICTIONS = new Set(['global_generic', 'us', 'uk', 'eu_generic', 'eu']);

function normalizeJurisdiction(value: unknown): 'global_generic' | 'us' | 'uk' | 'eu_generic' | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  if (!ALLOWED_JURISDICTIONS.has(v)) return undefined;
  if (v === 'eu') return 'eu_generic';
  return v as 'global_generic' | 'us' | 'uk' | 'eu_generic';
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get or create settings
    let settings = await Settings.findOne();
    
    if (!settings) {
      // Create default settings if none exist
      settings = new Settings({});
      await settings.save();
    } else {
      // Backfill / normalize newly added fields for existing installs
      const normalized = normalizeJurisdiction(settings.jurisdiction);
      if (!normalized) {
        settings.jurisdiction = 'global_generic';
        await settings.save();
      } else if (normalized !== settings.jurisdiction) {
        settings.jurisdiction = normalized;
        await settings.save();
      }
    }

    // Non-admin users only get basic settings (systemTitle, systemDescription, etc.)
    // Admin users get full settings
    if (session.user.role !== 'admin') {
      return NextResponse.json({
        systemTitle: settings.systemTitle,
        systemDescription: settings.systemDescription,
        jurisdiction: settings.jurisdiction,
        currency: settings.currency,
        timezone: settings.timezone,
        dateFormat: settings.dateFormat,
        timeFormat: settings.timeFormat,
        language: settings.language,
        theme: settings.theme,
        workingHours: settings.workingHours,
      });
    }

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can update settings
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates = await request.json();

    await dbConnect();

    // Validate and normalize known fields that must be constrained
    if ('jurisdiction' in updates) {
      const normalized = normalizeJurisdiction(updates.jurisdiction);
      if (!normalized) {
        return NextResponse.json({ error: 'Invalid jurisdiction' }, { status: 400 });
      }
      updates.jurisdiction = normalized;
    }

    // Update or create settings
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: updates },
      { upsert: true, new: true }
    );

    return NextResponse.json({ 
      message: 'Settings updated successfully',
      settings 
    });

  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
