'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX } from 'lucide-react';
import { safeStorage } from '@/lib/safe-storage';

/**
 * The cover: real footage of a swing, real ballpark sound, then the print.
 *
 * Browsers refuse to start audio without a user gesture, so rather than nagging
 * with a "click for sound" banner we hang the audio off the one gesture the
 * visitor has to make anyway — the hold on the fingerprint. Touch it and the
 * crack and the crowd land in sync with the swing.
 */

const SEEN_KEY = 'empreinte_cover_seen';
const HOLD_MS = 1500;
const CONTACT_AT = 2.04;   // seconds into swing.mp4 where bat meets ball
const LEAD_IN = 1.15;      // start this far before contact when the hold begins

type Phase = 'idle' | 'swinging' | 'granted';

export function CoverGate({ children }: { children: React.ReactNode }) {
    const [active, setActive] = useState<boolean | null>(null);
    const [phase, setPhase] = useState<Phase>('idle');
    const [holding, setHolding] = useState(false);
    const [muted, setMuted] = useState(false);
    const [leaving, setLeaving] = useState(false);
    // Safari terminates the page process on the landing route when a <video>
    // is part of the first render. The poster carries the cover instead, and
    // the video element is only mounted once the visitor asks for the swing.
    const [showVideo, setShowVideo] = useState(false);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const crackRef = useRef<HTMLAudioElement | null>(null);
    const roarRef = useRef<HTMLAudioElement | null>(null);
    const ambienceRef = useRef<HTMLAudioElement | null>(null);
    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

    // sessionStorage is client-only, so this has to happen after mount —
    // reading it during render would break hydration.
    useEffect(() => {
        // ?cover forces a replay — a live demo needs a dependable way to run
        // the opening again without clearing storage or opening a new tab.
        const forced = new URLSearchParams(window.location.search).has('cover');
        if (forced) safeStorage.remove('session', SEEN_KEY);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActive(forced || !safeStorage.get('session', SEEN_KEY));
    }, []);

    // Audio is deliberately not preloaded — see the preload="none" note below.
    const primeAudio = useCallback(() => {
        [crackRef, roarRef, ambienceRef].forEach(r => r.current?.load());
    }, []);

    // Warm the video bytes in the HTTP cache without attaching a decoder, so
    // the swing starts instantly when the element does mount.
    useEffect(() => {
        if (!active) return;
        const t = setTimeout(() => { void fetch('/media/swing.mp4').catch(() => {}); }, 1200);
        return () => clearTimeout(t);
    }, [active]);

    const stopAll = useCallback(() => {
        [crackRef, roarRef, ambienceRef].forEach(r => {
            const a = r.current;
            if (a) { a.pause(); a.currentTime = 0; }
        });
    }, []);

    const finish = useCallback(() => {
        safeStorage.set('session', SEEN_KEY, '1');
        setPhase('granted');
        // The crowd carries the moment, so it rides at full strength through
        // "access granted" and only falls away as the cover itself leaves.
        // Fading it the instant the verdict appears made the roar sound cut off.
        const a = ambienceRef.current;
        if (a) a.pause();

        timers.current.push(setTimeout(() => {
            setLeaving(true);
            const r = roarRef.current;
            if (r) {
                // Where volume is writable, ride it down. Where it is not
                // (iOS), stop once the cover has visually gone instead of
                // spinning a fade that cannot take effect.
                r.volume = 0.99;
                const canFade = r.volume < 1;
                r.volume = 1;
                if (canFade) {
                    const fade = setInterval(() => {
                        if (r.volume > 0.05) r.volume = Math.max(0, r.volume - 0.05);
                        else { r.pause(); clearInterval(fade); }
                    }, 55);
                }
            }
        }, 1500));
        timers.current.push(setTimeout(() => { stopAll(); setActive(false); }, 2700));
    }, [stopAll]);

    const beginHold = useCallback(() => {
        if (phase !== 'idle') return;   // already running — never restart mid-swing
        setPhase('swinging');
        setHolding(true);
        setShowVideo(true);
        primeAudio();

        const v = videoRef.current;
        if (v) {
            const startPlay = () => { void v.play().catch(() => {}); };
            v.addEventListener('seeked', startPlay, { once: true });
            try { v.currentTime = Math.max(0, CONTACT_AT - LEAD_IN); } catch { /* ignore */ }
            startPlay();
        }
        // This gesture is what unlocks audio — start the bed under the swing.
        if (!muted) {
            const amb = ambienceRef.current;
            // Levels are baked into the files rather than set here: iOS treats
            // HTMLMediaElement.volume as read-only, so any mix applied in code
            // is silently ignored on iPhone and iPad.
            if (amb) { amb.currentTime = 0; void amb.play().catch(() => {}); }
        }

        // Crack lands where the bat meets the ball; the crowd comes up under it.
        timers.current.push(setTimeout(() => {
            if (muted) return;
            const c = crackRef.current;
            if (c) { c.currentTime = 0; void c.play().catch(() => {}); }
            const r = roarRef.current;
            if (r) { r.currentTime = 0; void r.play().catch(() => {}); }
        }, LEAD_IN * 1000));

        timers.current.push(setTimeout(() => { setHolding(false); finish(); }, HOLD_MS));
    }, [phase, muted, finish, primeAudio]);



    useEffect(() => {
        const pending = timers.current;
        return () => pending.forEach(clearTimeout);
    }, []);

    // Keyboard equivalent — a press-and-hold must never be the only way in.
    useEffect(() => {
        if (!active || phase === 'granted') return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                beginHold();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [active, phase, beginHold]);

    const skip = () => { stopAll(); safeStorage.set('session', SEEN_KEY, '1'); setActive(false); };

    if (active === null) return <>{children}</>;

    return (
        <>
            {children}
            {active && (
                    <div
                        className={cn(
                            'fixed inset-0 z-[200] overflow-hidden bg-black',
                            'transition-[opacity,transform] duration-700 ease-out',
                            leaving ? 'opacity-0 scale-[1.05] pointer-events-none' : 'opacity-100 scale-100'
                        )}
                    >
                        <img
                            src="/media/swing-poster.jpg"
                            alt=""
                            className={cn(
                                'absolute inset-0 w-full h-full object-cover transition-transform duration-[2200ms] ease-out',
                                phase === 'idle' ? 'scale-[1.06]' : 'scale-100'
                            )}
                        />

                        {showVideo && (
                            <video
                                src="/media/swing.mp4"
                                poster="/media/swing-poster.jpg"
                                autoPlay
                                loop
                                muted
                                playsInline
                                preload="auto"
                                disableRemotePlayback
                                ref={(el) => {
                                    videoRef.current = el;
                                    if (el && !el.hasAttribute('muted')) el.setAttribute('muted', '');
                                }}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        )}

                        {/* Audio, held until the gesture unlocks it */}
                        <audio ref={crackRef} src="/media/crack.mp3" preload="none" />
                        <audio ref={roarRef} src="/media/roar.mp3" preload="none" />
                        <audio ref={ambienceRef} src="/media/ambience.mp3" preload="none" />

                        {/* Grade the footage toward the brand and keep text legible */}
                        <div className="absolute inset-0 bg-[#05070C]/45" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#05070C] via-[#05070C]/20 to-[#05070C]/75" />
                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#05070C] to-transparent" />

                        {/* Contact flash */}
                        <AnimatePresence>
                            {holding && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 0.5, 0] }} exit={{ opacity: 0 }}
                                    transition={{ duration: LEAD_IN + 0.6, times: [0, LEAD_IN / (LEAD_IN + 0.6), (LEAD_IN + 0.08) / (LEAD_IN + 0.6), 1] }}
                                    className="absolute inset-0 bg-white pointer-events-none"
                                />
                            )}
                        </AnimatePresence>

                        {/* Controls */}
                        <div className="absolute top-4 right-4 sm:top-5 sm:right-5 flex items-center gap-3">
                            <button
                                onClick={() => {
                                    const next = !muted;
                                    setMuted(next);
                                    if (next) stopAll();
                                }}
                                aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
                                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                            </button>
                            {phase !== 'granted' && (
                                <button onClick={skip}
                                    className="text-[10px] font-mono uppercase tracking-widest text-white/40 hover:text-white/80 transition-colors">
                                    Skip
                                </button>
                            )}
                        </div>

                        {/* The gate */}
                        <div className="relative z-10 h-full flex flex-col items-center justify-between px-6 py-[10vh] sm:py-[12vh] text-center">
                            <motion.div
                                animate={{ opacity: phase === 'granted' ? 0 : 1, y: phase === 'granted' ? -12 : 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.35em] text-white/50">
                                    Empreinte · Arena Operations
                                </p>
                                <h1 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-white max-w-2xl">
                                    Some nights don&apos;t need a ticket.
                                </h1>
                                <p className="mt-3 text-sm sm:text-base text-white/55">They need a key.</p>
                            </motion.div>

                            <div className="flex flex-col items-center">
                                <button
                                    onPointerDown={beginHold}
                                    onClick={beginHold}
                                    onContextMenu={(e) => e.preventDefault()}
                                    disabled={phase === 'granted'}
                                    aria-label="Touch to verify and enter"
                                    className={cn(
                                        'relative size-24 sm:size-28 rounded-2xl border backdrop-blur-sm flex items-center justify-center transition-all touch-none select-none',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-cyan',
                                        phase === 'granted'
                                            ? 'border-signal-cyan/70 bg-signal-cyan/15'
                                            : 'border-white/20 bg-white/[0.06] hover:border-signal-cyan/50 hover:bg-white/[0.1]',

                                    )}
                                >
                                    <svg viewBox="0 0 64 64" className="size-12 sm:size-14">
                                        {[8, 15, 22, 28].map((r, i) => (
                                            <path key={r}
                                                d={`M ${32 - r * 0.72} ${32 - r * 0.69} A ${r} ${r} 0 1 1 ${32 - r * 0.72} ${32 + r * 0.69}`}
                                                fill="none"
                                                stroke={phase === 'granted' || holding ? '#5EE6C9' : 'rgba(255,255,255,0.6)'}
                                                strokeWidth="3" strokeLinecap="round"
                                                style={{ transition: `stroke 220ms ${i * 55}ms` }} />
                                        ))}
                                        <circle cx="34" cy="33" r="2.4"
                                            fill={phase === 'granted' || holding ? '#5EE6C9' : 'rgba(255,255,255,0.6)'} />
                                    </svg>

                                    {holding && (
                                        <span className="absolute inset-x-2 h-[2px] bg-signal-cyan/90 shadow-[0_0_12px_2px_rgba(94,230,201,0.6)] emp-scan" />
                                    )}

                                    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                                        <rect x="2" y="2" width="96" height="96" rx="14" fill="none"
                                            stroke="#5EE6C9" strokeWidth="2.5"
                                            strokeDasharray="384"
                                            strokeDashoffset={holding || phase === 'granted' ? 0 : 384}
                                            style={{ transition: `stroke-dashoffset ${holding ? HOLD_MS : 260}ms linear` }} />
                                    </svg>
                                </button>

                                <p className={cn('mt-5 text-[10px] font-mono uppercase tracking-[0.3em] transition-colors',
                                    phase === 'granted' ? 'text-signal-cyan' : 'text-white/50')}>
                                    {phase === 'granted' ? '✓ Access granted' : holding ? 'Verifying…' : 'Touch to enter'}
                                </p>
                                {phase !== 'granted' && (
                                    <p className="mt-2 text-[10px] text-white/30">or press enter</p>
                                )}
                            </div>
                        </div>

                        {/* Credit, small print */}
                        <p className="absolute bottom-3 left-0 right-0 text-center text-[9px] text-white/25 px-6 leading-relaxed">
                            Footage: Pexels (Pexels License). Audio: freesound.org contributors, CC0.
                        </p>

                        <style>{`
                            @keyframes empScanLine { 0% { top: 8%; } 100% { top: 92%; } }
                            .emp-scan { animation: empScanLine 700ms linear infinite; }
                            @media (prefers-reduced-motion: reduce) { .emp-scan { animation: none; } }
                        `}</style>
                    </div>
            )}
        </>
    );
}
