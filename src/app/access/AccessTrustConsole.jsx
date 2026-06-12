import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  ShieldCheck, ShieldAlert, Clock, UserCheck, AlertTriangle, ChevronDown,
  ChevronRight, KeyRound, BadgeCheck, Ban, CalendarPlus, FileCheck2, Fingerprint,
  CreditCard, ScanFace, ScrollText, Activity, Dot,
} from "lucide-react";

/* ---------- Empreinte · Access Trust Console ----------
   A governance console for membership / access businesses.
   The hero is the Revocation Queue: clean, audited deprovisioning —
   the thing velvet-rope operators actually lose sleep over, and the
   thing no off-the-shelf tool builds for them.
-------------------------------------------------------- */

// Warm luxury-ops palette — brass + jade on espresso. Not acid-green-on-black.
const C = {
  bg: "#15110C",
  panel: "#1E1810",
  panelHi: "#27201600",
  surface: "#241D14",
  surfaceHi: "#2E2518",
  line: "#3A2F1F",
  brass: "#C9A24B",
  brassDim: "#8A7437",
  jade: "#5DB39E",
  jadeDim: "#2F5E55",
  amber: "#E0953C",
  red: "#CB5A41",
  redDim: "#4A2A22",
  text: "#F3ECDC",
  mute: "#A89B82",
  faint: "#6F6450",
};

const WEIGHTS = {
  idVerified: 24,
  paymentCurrent: 22,
  backgroundCheck: 20,
  agreementSigned: 18,
  noAnomalies: 16,
};
const FACTOR_META = {
  idVerified: { label: "Identity verified", Icon: ScanFace },
  paymentCurrent: { label: "Billing current", Icon: CreditCard },
  backgroundCheck: { label: "Background check", Icon: Fingerprint },
  agreementSigned: { label: "Access agreement signed", Icon: FileCheck2 },
  noAnomalies: { label: "No access anomalies", Icon: Activity },
};

function trustScore(f) {
  return Object.keys(WEIGHTS).reduce((s, k) => s + (f[k] ? WEIGHTS[k] : 0), 0);
}

const SEED = [
  { id: "AR-1042", name: "Marcus Vidal", tier: "Founder's Suite", state: "active",
    expires: "2026-11-30", lastAccess: "2026-06-11 19:42",
    f: { idVerified: true, paymentCurrent: true, backgroundCheck: true, agreementSigned: true, noAnomalies: true } },
  { id: "AR-1067", name: "Priya Anand", tier: "Season Box", state: "expiring",
    expires: "2026-06-18", lastAccess: "2026-06-09 20:15",
    f: { idVerified: true, paymentCurrent: false, backgroundCheck: true, agreementSigned: true, noAnomalies: true } },
  { id: "AR-1090", name: "Desmond Cole", tier: "Corporate", state: "expiring",
    expires: "2026-06-15", lastAccess: "2026-05-28 18:03",
    f: { idVerified: true, paymentCurrent: false, backgroundCheck: false, agreementSigned: true, noAnomalies: true } },
  { id: "AR-1103", name: "Lena Hoffmann", tier: "Founder's Suite", state: "active",
    expires: "2027-01-31", lastAccess: "2026-06-12 11:20",
    f: { idVerified: true, paymentCurrent: true, backgroundCheck: true, agreementSigned: true, noAnomalies: false } },
  { id: "AR-1121", name: "Theo Marsh", tier: "Season Box", state: "lapsed",
    expires: "2026-05-31", lastAccess: "2026-06-10 22:48",
    f: { idVerified: true, paymentCurrent: false, backgroundCheck: true, agreementSigned: false, noAnomalies: false } },
  { id: "AR-1135", name: "Sofia Ramos", tier: "Corporate", state: "active",
    expires: "2026-12-15", lastAccess: "2026-06-11 17:11",
    f: { idVerified: true, paymentCurrent: true, backgroundCheck: true, agreementSigned: true, noAnomalies: true } },
];

const PENDING_SEED = [
  { id: "GP-3308", name: "Jordan Bell", sponsor: "Marcus Vidal (AR-1042)", requested: "2026-06-12 09:04",
    f: { idVerified: true, paymentCurrent: true, backgroundCheck: false, agreementSigned: false, noAnomalies: true } },
  { id: "GP-3309", name: "Nia Okafor", sponsor: "Sofia Ramos (AR-1135)", requested: "2026-06-12 08:31",
    f: { idVerified: false, paymentCurrent: true, backgroundCheck: false, agreementSigned: false, noAnomalies: true } },
];

const FILTERS = [
  { key: "all", label: "All access" },
  { key: "active", label: "Active" },
  { key: "expiring", label: "Expiring" },
  { key: "lapsed", label: "Lapsed" },
  { key: "exception", label: "Trust exceptions" },
];

const STATE_STYLE = {
  active: { label: "Active", color: C.jade, dim: C.jadeDim },
  expiring: { label: "Expiring", color: C.amber, dim: "#4A3A1E" },
  lapsed: { label: "Lapsed — access live", color: C.red, dim: C.redDim },
  revoked: { label: "Revoked", color: C.faint, dim: "#2A2418" },
};

const EXCEPTION_THRESHOLD = 78;

function Mono({ children, style }) {
  return (
    <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: "0.02em", ...style }}>
      {children}
    </span>
  );
}

function Eyebrow({ children, style }) {
  return (
    <div style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: C.faint, fontWeight: 600, ...style }}>
      {children}
    </div>
  );
}

function TrustMeter({ score }) {
  const tone = score >= 85 ? C.jade : score >= EXCEPTION_THRESHOLD ? C.brass : C.red;
  return (
    <div className="flex items-center gap-2" style={{ minWidth: 96 }}>
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: C.line }}>
        <div style={{ width: `${score}%`, height: "100%", background: tone, transition: "width .5s ease" }} />
      </div>
      <Mono style={{ fontSize: 13, fontWeight: 700, color: tone, width: 26, textAlign: "right" }}>{score}</Mono>
    </div>
  );
}

function Kpi({ Icon, value, label, tone, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-xl p-4 transition-colors"
      style={{
        background: active ? C.surfaceHi : C.surface,
        border: `1px solid ${active ? tone : C.line}`,
        outline: "none", cursor: "pointer", flex: 1, minWidth: 150,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} style={{ color: tone }} />
        <Eyebrow>{label}</Eyebrow>
      </div>
      <Mono style={{ fontSize: 30, fontWeight: 700, color: C.text, lineHeight: 1 }}>{value}</Mono>
    </button>
  );
}

export default function AccessTrustConsole() {
  const [members, setMembers] = useState(SEED);
  const [pending, setPending] = useState(PENDING_SEED);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [log, setLog] = useState([
    { t: "2026-06-12 09:18", actor: "you", kind: "info", text: "Session opened · ARENA Premium Suites" },
  ]);
  const logEnd = useRef(null);

  const now = "2026-06-12";

  const enriched = useMemo(
    () => members.map((m) => ({ ...m, score: trustScore(m.f) })),
    [members]
  );

  const kpis = useMemo(() => {
    const active = enriched.filter((m) => m.state === "active").length;
    const expiring = enriched.filter((m) => m.state === "expiring").length;
    const exceptions = enriched.filter((m) => m.state !== "revoked" && m.score < EXCEPTION_THRESHOLD).length;
    return { active, expiring, exceptions, pending: pending.length };
  }, [enriched, pending]);

  const visible = useMemo(() => {
    let list = enriched;
    if (filter === "exception") list = list.filter((m) => m.state !== "revoked" && m.score < EXCEPTION_THRESHOLD);
    else if (filter !== "all") list = list.filter((m) => m.state === filter);
    const order = { lapsed: 0, expiring: 1, active: 2, revoked: 3 };
    return [...list].sort((a, b) => (order[a.state] - order[b.state]) || a.score - b.score);
  }, [enriched, filter]);

  function addLog(kind, text) {
    const t = new Date().toISOString().slice(0, 16).replace("T", " ");
    setLog((l) => [...l, { t, actor: "you", kind, text }]);
  }

  useEffect(() => {
    logEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [log]);

  function revoke(m) {
    setMembers((ms) => ms.map((x) => (x.id === m.id ? { ...x, state: "revoked" } : x)));
    addLog("revoke", `Access revoked · ${m.name} (${m.id}) · ${m.tier} · all credentials deactivated`);
  }
  function extend(m) {
    setMembers((ms) =>
      ms.map((x) => (x.id === m.id ? { ...x, state: "active", expires: "2026-12-31", f: { ...x.f, paymentCurrent: true } } : x))
    );
    addLog("extend", `Access extended 30 days · ${m.name} (${m.id}) · billing reconciled`);
  }
  function approveGuest(g) {
    setPending((p) => p.filter((x) => x.id !== g.id));
    addLog("approve", `Guest pass issued · ${g.name} (${g.id}) · sponsor ${g.sponsor}`);
  }
  function denyGuest(g) {
    setPending((p) => p.filter((x) => x.id !== g.id));
    addLog("deny", `Guest request denied · ${g.name} (${g.id}) · failed vetting`);
  }

  const LOG_TONE = {
    revoke: C.red, deny: C.red, approve: C.jade, extend: C.brass, info: C.faint,
  };

  return (
    <div
      style={{
        background: C.bg, color: C.text, minHeight: "100%",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
      }}
    >
      <style>{`
        @media (prefers-reduced-motion: reduce){ *{ transition:none!important; animation:none!important; } }
        .atc-row:hover{ background:${C.surfaceHi}; }
        .atc-btn:focus-visible{ outline:2px solid ${C.brass}; outline-offset:2px; }
        .atc-fade{ animation:atcFade .35s ease; }
        @keyframes atcFade{ from{opacity:0; transform:translateY(3px);} to{opacity:1; transform:none;} }
      `}</style>

      <div className="mx-auto px-5 py-6" style={{ maxWidth: 1180 }}>
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-4 mb-7">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="rounded-md flex items-center justify-center"
                   style={{ width: 30, height: 30, background: C.brass }}>
                <KeyRound size={17} style={{ color: C.bg }} />
              </div>
              <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em" }}>Empreinte</span>
              <span style={{ color: C.faint, fontSize: 19, fontWeight: 300 }}>/</span>
              <span style={{ fontSize: 19, fontWeight: 500, color: C.mute }}>Access Trust Console</span>
            </div>
            <Eyebrow style={{ marginLeft: 40 }}>ARENA · Premium Suites · live governance</Eyebrow>
          </div>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2"
               style={{ background: C.surface, border: `1px solid ${C.line}` }}>
            <div className="rounded-full" style={{ width: 7, height: 7, background: C.jade }} />
            <Mono style={{ fontSize: 12, color: C.mute }}>operator · you · {now}</Mono>
          </div>
        </header>

        {/* KPI strip */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Kpi Icon={ShieldCheck} value={kpis.active} label="Active access" tone={C.jade}
               active={filter === "active"} onClick={() => setFilter(filter === "active" ? "all" : "active")} />
          <Kpi Icon={Clock} value={kpis.expiring} label="Expiring · 7d" tone={C.amber}
               active={filter === "expiring"} onClick={() => setFilter(filter === "expiring" ? "all" : "expiring")} />
          <Kpi Icon={UserCheck} value={kpis.pending} label="Guests to vet" tone={C.brass}
               active={false} onClick={() => document.getElementById("atc-vet")?.scrollIntoView({ behavior: "smooth" })} />
          <Kpi Icon={ShieldAlert} value={kpis.exceptions} label="Trust exceptions" tone={C.red}
               active={filter === "exception"} onClick={() => setFilter(filter === "exception" ? "all" : "exception")} />
        </div>

        <div className="grid gap-5" style={{ gridTemplateColumns: "minmax(0,1fr)" }}>
          <div className="grid gap-5" style={{ gridTemplateColumns: "minmax(0,1.65fr) minmax(0,1fr)" }}>
            {/* Roster */}
            <section className="rounded-2xl overflow-hidden" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
              <div className="flex items-center gap-2 px-5 pt-4 pb-3 flex-wrap">
                <ScrollText size={15} style={{ color: C.brass }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Access roster</span>
                <span style={{ color: C.faint, fontSize: 12, marginLeft: 2 }}>· {visible.length} of {enriched.length}</span>
                <div className="flex gap-1.5 ml-auto flex-wrap">
                  {FILTERS.map((f) => (
                    <button key={f.key} onClick={() => setFilter(f.key)} className="atc-btn rounded-full px-2.5 py-1"
                      style={{
                        fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                        background: filter === f.key ? C.brass : "transparent",
                        color: filter === f.key ? C.bg : C.mute,
                        border: `1px solid ${filter === f.key ? C.brass : C.line}`,
                      }}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${C.line}` }}>
                {visible.length === 0 && (
                  <div className="px-5 py-10 text-center" style={{ color: C.mute, fontSize: 13 }}>
                    Nothing in this view. Every credential here is accounted for — switch filters to inspect another slice.
                  </div>
                )}
                {visible.map((m) => {
                  const ss = STATE_STYLE[m.state];
                  const open = expanded === m.id;
                  const isExc = m.state !== "revoked" && m.score < EXCEPTION_THRESHOLD;
                  return (
                    <div key={m.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                      <div className="atc-row flex items-center gap-3 px-5 py-3" style={{ transition: "background .15s" }}>
                        <button className="atc-btn rounded" onClick={() => setExpanded(open ? null : m.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, padding: 2 }}
                          aria-label="Toggle trust detail">
                          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        <div style={{ minWidth: 0, flex: "1.4 1 0" }}>
                          <div className="flex items-center gap-2">
                            <span style={{ fontWeight: 600, fontSize: 13.5 }}>{m.name}</span>
                            {isExc && <AlertTriangle size={13} style={{ color: C.red }} />}
                          </div>
                          <Mono style={{ fontSize: 11, color: C.faint }}>{m.id} · {m.tier}</Mono>
                        </div>
                        <div style={{ flex: "0 0 auto" }}>
                          <span className="rounded-full px-2 py-0.5" style={{
                            fontSize: 11, fontWeight: 600, color: ss.color, background: ss.dim,
                            border: `1px solid ${ss.color}33`,
                          }}>{ss.label}</span>
                        </div>
                        <div style={{ flex: "0 0 auto" }} className="hidden sm:block">
                          <TrustMeter score={m.score} />
                        </div>
                        <div style={{ flex: "0 0 auto", minWidth: 86 }} className="hidden md:block">
                          <Eyebrow style={{ fontSize: 9 }}>Expires</Eyebrow>
                          <Mono style={{ fontSize: 11.5, color: m.expires < now ? C.red : C.mute }}>{m.expires}</Mono>
                        </div>
                        <div className="flex gap-1.5" style={{ flex: "0 0 auto" }}>
                          {(m.state === "expiring" || m.state === "lapsed") && (
                            <button className="atc-btn rounded-lg px-2.5 py-1.5 flex items-center gap-1" onClick={() => revoke(m)}
                              style={{ fontSize: 11.5, fontWeight: 600, cursor: "pointer", color: C.red, background: C.redDim, border: `1px solid ${C.red}55` }}>
                              <Ban size={13} /> Revoke
                            </button>
                          )}
                          {(m.state === "expiring" || m.state === "lapsed") && (
                            <button className="atc-btn rounded-lg px-2.5 py-1.5 flex items-center gap-1" onClick={() => extend(m)}
                              style={{ fontSize: 11.5, fontWeight: 600, cursor: "pointer", color: C.brass, background: "transparent", border: `1px solid ${C.brassDim}` }}>
                              <CalendarPlus size={13} /> Extend
                            </button>
                          )}
                          {m.state === "active" && (
                            <span className="flex items-center gap-1" style={{ fontSize: 11.5, color: C.jade }}>
                              <BadgeCheck size={14} /> Cleared
                            </span>
                          )}
                          {m.state === "revoked" && (
                            <span style={{ fontSize: 11.5, color: C.faint }}>Closed</span>
                          )}
                        </div>
                      </div>

                      {open && (
                        <div className="atc-fade px-5 pb-4 pt-1" style={{ paddingLeft: 46 }}>
                          <Eyebrow style={{ marginBottom: 8 }}>Trust factors · weighted</Eyebrow>
                          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))" }}>
                            {Object.keys(WEIGHTS).map((k) => {
                              const meta = FACTOR_META[k]; const ok = m.f[k];
                              return (
                                <div key={k} className="flex items-center gap-2 rounded-lg px-2.5 py-2"
                                  style={{ background: C.surface, border: `1px solid ${ok ? C.jadeDim : C.redDim}` }}>
                                  <meta.Icon size={14} style={{ color: ok ? C.jade : C.red }} />
                                  <span style={{ fontSize: 12, color: ok ? C.text : C.mute, flex: 1 }}>{meta.label}</span>
                                  <Mono style={{ fontSize: 11, color: ok ? C.jade : C.red }}>
                                    {ok ? `+${WEIGHTS[k]}` : "0"}
                                  </Mono>
                                </div>
                              );
                            })}
                          </div>
                          <Mono style={{ fontSize: 11, color: C.faint, display: "block", marginTop: 8 }}>
                            last access {m.lastAccess}{m.state === "lapsed" && " · credential still live after lapse — revoke recommended"}
                          </Mono>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Audit trail */}
            <section className="rounded-2xl overflow-hidden flex flex-col" style={{ background: C.panel, border: `1px solid ${C.line}`, maxHeight: 520 }}>
              <div className="flex items-center gap-2 px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${C.line}` }}>
                <Activity size={15} style={{ color: C.jade }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Audit trail</span>
                <span style={{ color: C.faint, fontSize: 11.5, marginLeft: "auto" }}>append-only</span>
              </div>
              <div className="px-4 py-3 overflow-y-auto" style={{ flex: 1 }}>
                {log.map((e, i) => (
                  <div key={i} className={i === log.length - 1 ? "atc-fade" : ""}
                       style={{ display: "flex", gap: 8, padding: "7px 0", borderBottom: i < log.length - 1 ? `1px solid ${C.line}` : "none" }}>
                    <Dot size={16} style={{ color: LOG_TONE[e.kind], marginTop: 1, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.4 }}>{e.text}</div>
                      <Mono style={{ fontSize: 10.5, color: C.faint }}>{e.t} · {e.actor}</Mono>
                    </div>
                  </div>
                ))}
                <div ref={logEnd} />
              </div>
            </section>
          </div>

          {/* Guest vetting queue */}
          <section id="atc-vet" className="rounded-2xl overflow-hidden" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <div className="flex items-center gap-2 px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${C.line}` }}>
              <UserCheck size={15} style={{ color: C.brass }} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Guest vetting queue</span>
              <span style={{ color: C.faint, fontSize: 12, marginLeft: 2 }}>· {pending.length} awaiting decision</span>
            </div>
            {pending.length === 0 ? (
              <div className="px-5 py-8 text-center" style={{ color: C.mute, fontSize: 13 }}>
                Queue clear. New guest requests from sponsoring members land here for a vetting decision before any pass is issued.
              </div>
            ) : (
              <div className="grid gap-3 p-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
                {pending.map((g) => {
                  const score = trustScore(g.f);
                  return (
                    <div key={g.id} className="rounded-xl p-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{g.name}</span>
                        <Mono style={{ fontSize: 11, color: C.faint }}>{g.id}</Mono>
                      </div>
                      <Mono style={{ fontSize: 11, color: C.mute, display: "block", marginBottom: 10 }}>
                        sponsor · {g.sponsor}
                      </Mono>
                      <div className="mb-3"><TrustMeter score={score} /></div>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {Object.keys(WEIGHTS).map((k) => (
                          <span key={k} className="rounded px-1.5 py-0.5" style={{
                            fontSize: 10, color: g.f[k] ? C.jade : C.red,
                            background: g.f[k] ? C.jadeDim : C.redDim,
                          }}>{FACTOR_META[k].label.split(" ")[0]}</span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button className="atc-btn rounded-lg px-3 py-1.5 flex items-center gap-1.5" onClick={() => approveGuest(g)}
                          style={{ fontSize: 12, fontWeight: 600, cursor: "pointer", color: C.bg, background: C.jade, border: "none", flex: 1, justifyContent: "center" }}>
                          <BadgeCheck size={14} /> Issue pass
                        </button>
                        <button className="atc-btn rounded-lg px-3 py-1.5 flex items-center gap-1.5" onClick={() => denyGuest(g)}
                          style={{ fontSize: 12, fontWeight: 600, cursor: "pointer", color: C.red, background: "transparent", border: `1px solid ${C.red}55` }}>
                          <Ban size={14} /> Deny
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <footer className="mt-6 flex items-center gap-2" style={{ color: C.faint, fontSize: 11.5 }}>
          <ShieldCheck size={13} />
          Every revoke, extend, and vetting decision writes an immutable audit entry — the record your insurer and your members both ask for.
        </footer>
      </div>
    </div>
  );
}
