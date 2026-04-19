'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Scale,
  ArrowRight,
  Gavel,
  Bot,
  ShieldCheck,
  FileText,
  CalendarClock,
  Wallet,
  Database,
  Network,
  MessagesSquare,
  Sparkles,
} from 'lucide-react';
import DashboardPage from './dashboard/page';

export default function HomePage() {
  const { status } = useSession();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const revealRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY || 0);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const frameTexts = [
    'Capture client intake, contacts, and new matters in one flow.',
    'Draft motions, contract reviews, and letter packs with AI.',
    'Manage hearings, deadlines, tasks, and calendar events.',
    'Finalize billing, payments, documents, and activity logs.',
  ];

  const revealProgress = useMemo(() => {
    if (!revealRef.current) return 0;
    const rect = revealRef.current.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const start = vh * 0.85;
    const end = -rect.height * 0.2;
    const raw = (start - rect.top) / (start - end);
    return Math.max(0, Math.min(1, raw));
  }, [scrollY]);

  const frameIndex = Math.min(frameTexts.length - 1, Math.floor(revealProgress * frameTexts.length));

  const workflow = [
    { title: 'Client Intake', desc: 'Register clients, collect details, and open a matter.' },
    { title: 'Case Workspace', desc: 'Organize cases, contacts, notes, and related documents.' },
    { title: 'AI Drafting', desc: 'Create motions, timelines, and legal letters with AI tools.' },
    { title: 'Contract Review', desc: 'Run AI contract analysis and legal risk checks.' },
    { title: 'Hearing + Deadlines', desc: 'Track court events, deadlines, and team tasks.' },
    { title: 'Billing + Payments', desc: 'Issue invoices, service items, and payment tracking.' },
  ];

  const integrations = [
    { title: 'Documents + Templates', desc: 'Upload, version, and reuse legal templates by matter.', icon: FileText, span: 'md:col-span-2' },
    { title: 'Calendar + Hearings', desc: 'Court schedule, consultations, and event planning.', icon: CalendarClock, span: '' },
    { title: 'Invoices + Payments', desc: 'Service items, invoices, collections, and receipts.', icon: Wallet, span: '' },
    { title: 'Case Intelligence', desc: 'AI timeline, knowledge search, and drafting context.', icon: Network, span: '' },
    { title: 'Client Portal', desc: 'Share updates, documents, and billing visibility.', icon: MessagesSquare, span: '' },
    { title: 'MongoDB Data Layer', desc: 'Secure single-tenant persistence for legal operations.', icon: Database, span: 'md:col-span-2' },
  ];

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Keep original behavior for logged-in users: root shows dashboard.
  if (status === 'authenticated') {
    return <DashboardPage />;
  }

  // Public home page with login button.
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-900 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(250,204,21,0.08),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(148,163,184,0.22),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(250,204,21,0.08),transparent_45%)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <header className="mb-10 flex items-center justify-between rounded-2xl border border-slate-700/80 bg-slate-800/60 px-4 py-3 backdrop-blur sm:px-6">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Scale className="h-4 w-4 text-amber-300" />
            AI Legal OS
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-400/35 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/20"
          >
            Login
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <section className="grid items-center gap-12 lg:grid-cols-2">
          <div style={{ transform: `translateY(${Math.min(scrollY * 0.06, 42)}px)` }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800/70 px-4 py-2 text-sm text-slate-300">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Built for the AI Lawyer management platform
            </div>

            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Precision legal management,
              <span className="block bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-200 bg-clip-text text-transparent">
                powered by AI.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base text-slate-300 sm:text-lg">
              Manage clients, cases, hearings, documents, reports, tasks, billing, and AI legal workflows from one dashboard.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 font-semibold text-slate-900 transition hover:bg-amber-300"
              >
                Enter Workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/70 px-4 py-3 text-sm text-slate-300">
                <ShieldCheck className="h-4 w-4 text-amber-300" />
                White-label, single-tenant, audit-friendly
              </div>
            </div>
          </div>

          <div
            onMouseMove={(e) => {
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width - 0.5;
              const y = (e.clientY - rect.top) / rect.height - 0.5;
              setMouse({ x, y });
            }}
            onMouseLeave={() => setMouse({ x: 0, y: 0 })}
            className="relative h-[420px] rounded-3xl border border-slate-700 bg-slate-800/70 p-6 backdrop-blur"
          >
            <div className="absolute inset-6 rounded-2xl border border-slate-700/80 bg-slate-900/70" />
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ perspective: '1000px' }}
            >
              <div
                className="relative h-52 w-52"
                style={{
                  transform: `rotateX(${mouse.y * -18}deg) rotateY(${mouse.x * 24}deg)`,
                  transformStyle: 'preserve-3d',
                  transition: 'transform 120ms linear',
                }}
              >
                <div className="absolute inset-0 rounded-[2rem] border border-amber-300/50 bg-gradient-to-br from-amber-300/20 to-amber-500/10 shadow-[0_0_80px_rgba(250,204,21,0.2)]" />
                <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-200/60 bg-slate-900/80" />
                <div className="absolute left-1/2 top-5 h-20 w-2 -translate-x-1/2 rounded-full bg-amber-300/90" />
                <div className="absolute left-1/2 top-24 h-2 w-28 -translate-x-1/2 rounded-full bg-amber-300/80" />
                <div className="absolute left-6 top-28 h-10 w-10 rounded-full border border-amber-200/70 bg-slate-900/90" />
                <div className="absolute right-6 top-28 h-10 w-10 rounded-full border border-amber-200/70 bg-slate-900/90" />
              </div>
            </div>
            <div className="absolute bottom-6 left-6 rounded-lg border border-slate-700 bg-slate-800/85 px-3 py-2 text-xs text-slate-300">
              3D legal symbol reacts to pointer movement
            </div>
          </div>
        </section>

        <section ref={revealRef} className="mt-20 rounded-3xl border border-slate-700 bg-slate-800/50 p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-300/80">Frame Sequence</p>
          <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">How the legal OS orchestrates every case</h2>
          <div className="mt-6 space-y-3">
            {frameTexts.map((text, idx) => (
              <p
                key={text}
                className={`text-base transition-all duration-500 sm:text-lg ${
                  frameIndex === idx ? 'translate-x-0 text-white opacity-100' : 'translate-x-2 text-slate-400 opacity-35'
                }`}
              >
                {text}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Legal Workflow Vertical Timeline</h2>
            <span className="text-xs text-slate-400">Scroll down</span>
          </div>
          <div className="relative rounded-2xl border border-slate-700 bg-slate-800/50 p-3">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-slate-900 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900 to-transparent" />
            <div className="max-h-[380px] space-y-3 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {workflow.map((item, idx) => (
                <article
                  key={item.title}
                  className="group rounded-xl border border-slate-700 bg-slate-900/75 p-4 transition hover:-translate-y-0.5 hover:border-amber-300/50"
                >
                  <p className="text-xs uppercase tracking-wide text-amber-300/80">Step {idx + 1}</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-300">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-300">
            <Bot className="h-4 w-4 text-amber-300" />
            Platform Modules Bento
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {integrations.map((card) => (
              <article
                key={card.title}
                className={`group rounded-2xl border border-slate-700 bg-slate-800/60 p-5 transition duration-200 hover:-translate-y-1 hover:border-amber-300/50 hover:bg-slate-800 ${card.span}`}
              >
                <div className="mb-3 inline-flex rounded-lg border border-slate-600 bg-slate-900/80 p-2 text-amber-300 transition group-hover:scale-105 group-hover:border-amber-300/60">
                  <card.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{card.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-14 flex items-center justify-center gap-2 text-slate-400">
          <Scale className="h-4 w-4 text-amber-300" />
          <span className="text-sm">AI Legal Management Operating System</span>
        </footer>
      </div>
    </main>
  );
}
