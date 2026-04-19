import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AuditLog, { type AuditAction } from '@/models/AuditLog';
import { getRequestIp } from '@/lib/authz';

export async function writeAuditLog(args: {
  request?: NextRequest;
  action: AuditAction;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  resourceType?: string;
  resourceId?: string;
  message?: string;
  metadata?: Record<string, any>;
}) {
  try {
    await dbConnect();
    const ip = getRequestIp(args.request);
    const userAgent = args.request?.headers.get('user-agent') || undefined;
    await AuditLog.create({
      action: args.action,
      actorId: args.actorId,
      actorEmail: args.actorEmail,
      actorRole: args.actorRole,
      ip,
      userAgent,
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      message: args.message,
      metadata: args.metadata,
    });
  } catch {
    // never block the request on audit failures
  }
}

