// Language switching without URL changes
// We handle language switching through React Context, not URL routing

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DISABLED_ROUTES_PREFIXES: string[] = [
  // Medical-only modules (disabled for AI Lawyer)
  '/lab',
  '/radiology',
  '/inpatient',
  '/pharmacy',
  '/inventory',
  '/analytical-reports',

  // Medical AI tools (disabled for AI Lawyer)
  '/ai-treatment-recommendations',
  '/ai-drug-interaction',
  '/ai-medical-image',
  '/ai-health-trends',
  '/ai-health-analytics',
  '/ai-risk-assessment',
  '/ai-appointment-optimizer',
  '/ai-voice-input',
];

const LEGACY_REDIRECTS: Record<string, string> = {
  // Rebrand routes
  '/patients': '/clients',
  '/patients/new': '/clients/new',
  '/reports': '/documents',
  '/reports/new': '/documents/new',
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Canonicalize "doctors" => "lawyers" URLs (keep internal role name if needed)
  if (pathname === '/doctors' || pathname.startsWith('/doctors/')) {
    const target = pathname.replace('/doctors', '/lawyers');
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Simple legacy redirects (exact match only)
  const legacyTarget = LEGACY_REDIRECTS[pathname];
  if (legacyTarget) {
    return NextResponse.redirect(new URL(legacyTarget, request.url));
  }

  // Block disabled modules (keep platform routes intact)
  if (DISABLED_ROUTES_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except API and static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
