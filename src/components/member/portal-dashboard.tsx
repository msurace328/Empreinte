'use client';

import React, { useEffect, useState } from 'react';
import { useAuth, UserRole } from '@/hooks/use-auth';
import { dataService } from '@/lib/services/data-service';
import { Member, Booking } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, MapPin, CreditCard, Star, ChevronRight, LogOut, ArrowUpRight, History, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { GuestAndStanding } from './guest-and-standing';
import { useData } from '@/lib/providers/data-provider';

export function MemberPortalDashboard() {
    const { user, setRole } = useAuth();
    const { guests, openThread } = useData();
    const [contactOpen, setContactOpen] = useState(false);
    const [billingOpen, setBillingOpen] = useState(false);
    const [note, setNote] = useState('');
    const [sent, setSent] = useState(false);
    const [member, setMember] = useState<Member | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const myGuests = guests.filter(g => g.sponsorId === user?.id);
    // Season renewal lands on the anniversary of joining.
    const renewal = React.useMemo(() => {
        if (!member) return new Date();
        const d = new Date(member.joinDate);
        d.setFullYear(new Date().getFullYear() + 1);
        return d;
    }, [member]);
    const [newBooking, setNewBooking] = useState({
        suiteId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '19:00',
        duration: '4',
        partySize: '4'
    });

    useEffect(() => {
        if (user?.id) {
            dataService.getMember(user.id).then(m => {
                if (m) setMember(m);
            });
            dataService.getBookingsForMember(user.id).then(setBookings);
        }
    }, [user]);

    const handleCreateBooking = async () => {
        if (!member || !newBooking.suiteId) return;

        const booking: Booking = {
            id: `b-${Date.now()}`,
            memberId: member.id,
            suiteId: newBooking.suiteId,
            date: newBooking.date,
            startTime: newBooking.startTime,
            duration: parseInt(newBooking.duration),
            partySize: parseInt(newBooking.partySize),
            amount: 1500, // Mock amount
            status: 'Upcoming'
        };

        // In a real app we'd call dataService.createBooking(booking)
        // For demo, we just update local state and audit log
        setBookings([booking, ...bookings]);
        await dataService.addAuditEntry(
            `Member.${member.name.split(' ')[0]}`,
            'CREATE_BOOKING',
            booking.id,
            `Suite ${booking.suiteId} reserved for ${booking.date}.`
        );
        setIsBookingOpen(false);
    };

    if (!member) return null;

    return (
        <div className="min-h-screen bg-canvas-black text-foreground flex flex-col items-center p-6 md:p-12 animate-in fade-in duration-1000">
            <div className="max-w-5xl w-full space-y-12">
                {/* Portal Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="size-10 bg-signal-cyan rounded flex items-center justify-center text-canvas-black font-bold shadow-[0_0_15px_rgba(94,230,201,0.3)]">E</div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Welcome, {member.name.split(' ')[0]}</h1>
                            <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest">Arena Member Portal</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="glass border-border-muted h-12 px-5 gap-3 rounded-full hover:border-signal-cyan/30 transition-all">
                                    <Avatar className="size-7 border border-border-muted">
                                        <AvatarImage src={member.avatarUrl} />
                                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{member.name}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass border-border-muted w-56">
                                <DropdownMenuLabel>Account</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-border-muted" />
                                <DropdownMenuItem onClick={() => document.getElementById('member-standing')?.scrollIntoView({ behavior: 'smooth' })}>
                                    Your standing &amp; guests
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => document.getElementById('member-billing')?.scrollIntoView({ behavior: 'smooth' })}>
                                    Payments &amp; tier
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border-muted" />
                                <DropdownMenuItem onClick={() => setRole('Admin')}>Switch to staff console</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => setRole('Admin')}>
                                    <LogOut className="mr-2 size-4" /> Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Member Status Overview */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="glass border-border-muted md:col-span-2 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Star className="size-32 text-signal-cyan" />
                        </div>
                        <CardContent className="p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Badge className="bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90 font-mono text-[10px] uppercase tracking-widest py-1 px-3">
                                        {member.tier} Status
                                    </Badge>
                                    <p className="text-2xl font-bold tracking-tight mt-2">Active Membership</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Membership ID</p>
                                    <p className="text-sm font-mono font-bold text-signal-cyan">{member.id}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                                <div>
                                    <p className="text-[10px] font-mono text-muted-foreground uppercase">Member Since</p>
                                    <p className="text-sm font-bold">{format(new Date(member.joinDate), 'MMM yyyy')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-mono text-muted-foreground uppercase">Guest Credits</p>
                                    <p className="text-sm font-bold">
                                        {member.tier === 'Founder'
                                            ? 'Unlimited'
                                            : `${myGuests.filter(g => g.status !== 'Denied').length} / ${member.tier === 'Suite' ? 8 : 2}`}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-mono text-muted-foreground uppercase">Booking Limit</p>
                                    <p className="text-sm font-bold">Unlimited</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-mono text-muted-foreground uppercase">Renewal Date</p>
                                    <p className="text-sm font-bold">{format(renewal, 'MMM d, yyyy')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                        <DialogTrigger asChild>
                            <Card className="glass border-signal-cyan/20 bg-signal-cyan/5 flex flex-col justify-between overflow-hidden group cursor-pointer">
                                <CardContent className="p-8">
                                    <div className="size-12 rounded-full bg-signal-cyan flex items-center justify-center text-canvas-black mb-6 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(94,230,201,0.2)]">
                                        <Calendar className="size-6" />
                                    </div>
                                    <h3 className="text-xl font-bold tracking-tight mb-2">Book a Suite</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">Reserve your space for high-end hospitality and private events.</p>
                                </CardContent>
                                <div className="p-6 border-t border-signal-cyan/10">
                                    <Button className="w-full bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90 font-bold group">
                                        New Booking <ChevronRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </Card>
                        </DialogTrigger>
                        <DialogContent className="glass border-border-muted sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Reserve a Suite</DialogTitle>
                                <DialogDescription className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                                    Member Rate // 100% Trust Verified
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="suite" className="text-xs font-mono uppercase text-muted-foreground">Select Suite</Label>
                                    <Select
                                        onValueChange={(v: string) => setNewBooking({ ...newBooking, suiteId: v })}
                                        defaultValue={newBooking.suiteId}
                                    >
                                        <SelectTrigger className="glass border-border-muted">
                                            <SelectValue placeholder="Choose a suite..." />
                                        </SelectTrigger>
                                        <SelectContent className="glass border-border-muted">
                                            <SelectItem value="s-001">The Zenith Loft (12 Cap)</SelectItem>
                                            <SelectItem value="s-002">The Obsidian Room (6 Cap)</SelectItem>
                                            <SelectItem value="s-003">Skyline Terrace (25 Cap)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="date" className="text-xs font-mono uppercase text-muted-foreground">Date</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            className="glass border-border-muted"
                                            value={newBooking.date}
                                            onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="time" className="text-xs font-mono uppercase text-muted-foreground">Time</Label>
                                        <Input
                                            id="time"
                                            type="time"
                                            className="glass border-border-muted"
                                            value={newBooking.startTime}
                                            onChange={(e) => setNewBooking({ ...newBooking, startTime: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="guests" className="text-xs font-mono uppercase text-muted-foreground">Guests</Label>
                                        <Input
                                            id="guests"
                                            type="number"
                                            className="glass border-border-muted"
                                            value={newBooking.partySize}
                                            onChange={(e) => setNewBooking({ ...newBooking, partySize: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="duration" className="text-xs font-mono uppercase text-muted-foreground">Duration (Hours)</Label>
                                        <Input
                                            id="duration"
                                            type="number"
                                            className="glass border-border-muted"
                                            value={newBooking.duration}
                                            onChange={(e) => setNewBooking({ ...newBooking, duration: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    className="w-full bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90 font-bold"
                                    onClick={handleCreateBooking}
                                >
                                    Confirm Reservation
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </section>

                {/* Guests + trust standing */}
                <div id="member-standing">
                    <GuestAndStanding member={member} />
                </div>

                {/* History & Upcoming */}
                <section id="member-billing" className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <History className="size-3" /> Booking History
                            </h2>
                            <Button variant="link" onClick={() => {
                                const rows = [
                                    ['date', 'suite', 'party_size', 'hours', 'amount_usd', 'status'],
                                    ...bookings.map(b => [b.date.slice(0, 10), b.suiteId, b.partySize, b.duration, b.amount, b.status]),
                                ];
                                const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
                                const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                                const a = document.createElement('a');
                                a.href = url; a.download = `arena-invoices-${member.id}.csv`; a.click();
                                URL.revokeObjectURL(url);
                            }} className="text-signal-cyan p-0 h-auto text-[10px] font-mono uppercase tracking-widest">Download Invoices</Button>
                        </div>

                        <div className="space-y-4">
                            {bookings.map((booking) => (
                                <div key={booking.id} className="flex items-center justify-between p-5 bg-canvas-card border border-border-muted rounded-xl hover:border-signal-cyan/30 transition-all duration-300 group">
                                    <div className="flex items-start gap-4">
                                        <div className="size-12 rounded-lg bg-canvas-muted border border-border-muted flex items-center justify-center group-hover:bg-signal-cyan/10 transition-colors">
                                            <MapPin className="size-6 text-muted-foreground group-hover:text-signal-cyan" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-base font-bold">Suite {booking.suiteId.slice(-3)}</p>
                                                <Badge variant="outline" className="text-[9px] font-mono border-border-muted text-muted-foreground">{booking.status}</Badge>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground font-medium">
                                                <span className="flex items-center gap-1"><Calendar className="size-3" /> {format(new Date(booking.date), 'MMM d, yyyy')}</span>
                                                <span className="flex items-center gap-1"><Clock className="size-3" /> {booking.startTime}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold font-mono text-foreground">${booking.amount.toLocaleString()}</p>
                                        <span className="text-[10px] font-mono uppercase text-muted-foreground">
                                            {booking.duration}h · {booking.partySize} guests
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {bookings.length === 0 && <p className="text-sm italic text-muted-foreground p-12 text-center border border-dashed border-border-muted rounded-xl">No previous bookings found.</p>}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                            <CreditCard className="size-3" /> Payments & Tier
                        </h2>
                        <Card className="glass border-border-muted overflow-hidden">
                            <CardHeader className="bg-canvas-muted/50 border-b border-border-muted">
                                <CardTitle className="text-xs font-mono uppercase">Upcoming Dues</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Membership Fee</span>
                                    <span className="text-sm font-bold font-mono">$1,200.00</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-muted-foreground">
                                    <span>Next payment</span>
                                    <span>June 15, 2026</span>
                                </div>
                                <Separator className="bg-border-muted/50" />
                                <div className="flex items-center justify-between bg-canvas-muted p-2 rounded-md border border-border-muted">
                                    <div className="flex items-center gap-2">
                                        <div className="size-8 rounded bg-canvas-black flex items-center justify-center border border-border-muted">
                                            <span className="text-[10px] font-bold">VISA</span>
                                        </div>
                                        <span className="text-xs font-mono">•••• 4242</span>
                                    </div>
                                    <Badge variant="secondary" className="text-[8px] uppercase font-mono">Primary</Badge>
                                </div>
                                <Button variant="outline" onClick={() => setBillingOpen(true)} className="w-full glass text-[10px] font-mono uppercase tracking-widest border-border-muted">Manage Billing</Button>
                            </CardContent>
                        </Card>

                        <Card className="glass border-border-muted p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <ShieldAlert className="size-5 text-signal-cyan" />
                                <h4 className="text-sm font-bold">Support & Safety</h4>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed mb-6">Empreinte protects your identity and access. If you suspect any account compromise, contact your Membership Director immediately.</p>
                            <Button variant="ghost" onClick={() => setContactOpen(true)} className="w-full bg-canvas-muted/50 text-[10px] font-mono uppercase tracking-widest border border-border-muted">Contact Security</Button>
                        </Card>
                    </div>
                </section>
            </div>

            {/* Billing */}
            <Dialog open={billingOpen} onOpenChange={setBillingOpen}>
                <DialogContent className="glass border-border-muted bg-canvas-card">
                    <DialogHeader>
                        <DialogTitle>Payments &amp; tier</DialogTitle>
                        <DialogDescription className="text-xs">Your {member.tier} membership.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-1">
                        {[
                            { k: 'Membership', v: `${member.tier} · $${(member.tier === 'Founder' ? 400000 : member.tier === 'Suite' ? 165000 : 45000).toLocaleString()} per season` },
                            { k: 'Card on file', v: 'Visa ending 4417' },
                            { k: 'Next payment', v: format(renewal, 'MMM d, yyyy') },
                            { k: 'Bookings this season', v: `${bookings.length}` },
                            { k: 'Booking spend', v: `$${bookings.reduce((a, b) => a + b.amount, 0).toLocaleString()}` },
                        ].map(r => (
                            <div key={r.k} className="flex items-center justify-between border-b border-border-muted last:border-0 py-2">
                                <span className="text-xs text-muted-foreground">{r.k}</span>
                                <span className="text-sm font-mono">{r.v}</span>
                            </div>
                        ))}
                        <p className="text-[10px] text-muted-foreground/70 pt-1">
                            To change the card on file, message the membership team — we never take card details over chat.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Contact security — lands in the ops Inbox */}
            <Dialog open={contactOpen} onOpenChange={(o) => { setContactOpen(o); if (!o) { setSent(false); setNote(''); } }}>
                <DialogContent className="glass border-border-muted bg-canvas-card">
                    <DialogHeader>
                        <DialogTitle>Contact security</DialogTitle>
                        <DialogDescription className="text-xs">
                            Goes straight to the ARENA membership desk with your identity attached.
                        </DialogDescription>
                    </DialogHeader>
                    {sent ? (
                        <div className="py-6 text-center">
                            <p className="text-sm font-medium text-emerald-400">Message sent.</p>
                            <p className="text-xs text-muted-foreground mt-1.5">
                                The team sees it in their inbox with your standing attached.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="py-1">
                                <Input value={note} onChange={e => setNote(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && note.trim()) { openThread({ subject: 'Message from the member portal', body: note.trim(), memberId: member.id, memberName: member.name, avatarUrl: member.avatarUrl }); setSent(true); } }}
                                    placeholder="What do you need?" className="bg-canvas-muted" />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setContactOpen(false)}>Cancel</Button>
                                <Button disabled={!note.trim()}
                                    onClick={() => { openThread({ subject: 'Message from the member portal', body: note.trim(), memberId: member.id, memberName: member.name, avatarUrl: member.avatarUrl }); setSent(true); }}
                                    className="bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90">Send</Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
