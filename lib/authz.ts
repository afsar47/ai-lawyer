import { getServerSession } from 'next-auth/next';
import type { NextRequest } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export type AppRole = 'admin' | 'doctor' | 'staff' | 'patient';

export function getRoleFromSession(session: any): AppRole {
  return (session?.user?.role || 'doctor') as AppRole;
}

export async function requireSession(request?: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { ok: false as const, session: null, role: null, error: 'Unauthorized' };
  }
  const role = getRoleFromSession(session);
  return { ok: true as const, session, role, error: null };
}

export function requireRole(role: AppRole, allowed: AppRole[]) {
  return allowed.includes(role);
}

export function getRequestIp(request?: NextRequest): string | undefined {
  if (!request) return undefined;
  // Standard proxy headers first
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim();
  const xrip = request.headers.get('x-real-ip');
  if (xrip) return xrip.trim();
  return undefined;
}

