'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// One-line theme change: swap emerald for your accent (e.g. amber, sky, violet)
const ACCENT_BTN = 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950';
const ACCENT_DONE = 'border-emerald-400 bg-emerald-400/20 text-emerald-300';

const STEPS = [
  {
    href: '/admin',
    title: 'Command Center',
    look: 'The whole membership at a glance: trust posture, pending reviews, and flagged activity in one view.',
  },
  {
    href: '/admin/applications',
    title: 'Run the Application Copilot',
    look: 'Click the Copilot button on a pending application. The agent investigates the records live (identity reuse, referral proximity, domain intelligence), recommends a disposition with cited evidence, and drafts the response. You decide; your decision is written to the audit chain.',
  },
  {
    href: '/admin/graph',
    title: 'Member Graph',
    look: 'Trust and referral relationships, mapped. Notice the circular cluster: a manufactured referral ring, flagged automatically.',
  },
  {
    href: '/admin/members',
    title: 'A Defensible Restriction',
    look: 'Open the restricted member. Every decision is recorded with operator, reason, and timestamp.',
  },
  {
    href: '/admin/revenue',
    title: 'Opportunity Engine',
    look: 'Where the platform finds money: a midweek suite optimization worth about $45k, surfaced from utilization data.',
  },
  {
    href: '/admin/audit',
    title: 'Hash-Chained Audit Trail',
    look: 'The evidence layer. Each entry is cryptographically chained to the one before it, so edits, deletions, and reordering are detectable.',
  },
];

const KEY = 'empreinte-demo-guide';

export default function DemoGuide() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<number[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setDone(JSON.parse(saved));
    } catch {}
  }, []);

  const toggle = (i: number) => {
    const next = done.includes(i) ? done.filter((n) => n !== i) : [...done, i];
    setDone(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  return (
    <div className="fixed bottom-5 left-5 z-50 font-sans">
      {open && (
        <div className="mb-3 max-h-[70vh] w-80 overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Guided Tour</p>
            <span className="text-xs text-zinc-400">
              {done.length}/{STEPS.length} viewed
            </span>
          </div>
          <p className="mb-3 text-xs text-zinc-400">
            Six stops. Catch the risk, find the upside.
          </p>
          <ol className="space-y-2">
            {STEPS.map((s, i) => (
              <li
                key={s.href}
                className="rounded-xl border border-white/5 bg-white/5 p-3"
              >
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => toggle(i)}
                    aria-label="Mark step viewed"
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                      done.includes(i)
                        ? ACCENT_DONE
                        : 'border-zinc-600 text-zinc-500'
                    }`}
                  >
                    {done.includes(i) ? '✓' : i + 1}
                  </button>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white">{s.title}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-zinc-400">
                      {s.look}
                    </p>
                    <Link
                      href={s.href}
                      onClick={() => toggle(i)}
                      className="mt-1.5 inline-block rounded-lg bg-white/10 px-2 py-1 text-[11px] font-medium text-white hover:bg-white/20"
                    >
                      Take me there →
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className={`rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg ${ACCENT_BTN}`}
      >
        {open ? 'Close' : 'Guided Tour'}
      </button>
    </div>
  );
}
