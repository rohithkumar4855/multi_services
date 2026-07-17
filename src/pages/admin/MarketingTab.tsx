import { useState, useMemo } from 'react';
import type { Coupon, Campaign, Booking } from '../../types';

interface Props {
  tenantId: string;
  coupons: Coupon[];
  setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>;
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  bookings: Booking[];
  showToast: (msg: string, type?: string) => void;
  primaryColor: string;
}

interface WaLog { phone: string; name: string; sentAt: string; }

const QUICK_TEMPLATES = [
  { name: '🎉 Festival Special', text: 'Hi {name}! 🎊 Celebrate the festive season with us! Get 20% off ALL services this week. Book now — limited slots available! Reply YES to book.' },
  { name: '💰 First Booking Offer', text: 'Hello {name}! Welcome to our family 🙏 Book your first service and get ₹100 off instantly. Use code: FIRST100. Offer valid this week only!' },
  { name: '🔁 Re-engagement', text: "Hi {name}, we miss you! 😊 It's been a while since your last service. Book today and get a FREE inspection + 10% off. Reply to this message to schedule." },
  { name: '⭐ Review Request', text: 'Hello {name}! Thank you for choosing us 🙏 We hope your recent service was excellent. Could you spare 1 minute to share your experience? Your feedback means everything to us!' },
  { name: '🛡️ Warranty Reminder', text: 'Hi {name}! This is a friendly reminder that your 30-day service warranty expires soon. If you have any issues, contact us NOW — we will fix it free of charge. Reply HELP to reach us.' },
  { name: '📣 New Service Launch', text: 'Exciting news {name}! 🚀 We just launched a new service in your area. Be among the first to book at our special launch price — 25% OFF! Limited period offer. Reply to know more.' },
  { name: '🎂 Birthday Offer', text: 'Happy Birthday {name}! 🎂🎈 On this special day, we would love to gift you ₹200 off your next service booking. Your gift code: BDAY200. Valid for 7 days — enjoy!' },
  { name: '💼 Referral Program', text: 'Hi {name}! Refer a friend and BOTH of you get ₹150 off your next booking! 🎁 Just ask them to mention your name or phone when booking. Start referring today!' },
];

export default function MarketingTab({ tenantId, coupons, setCoupons, campaigns, setCampaigns, bookings, showToast, primaryColor }: Props) {
  const [subTab, setSubTab] = useState<'whatsapp' | 'coupons' | 'campaigns'>('whatsapp');

  /* ── Customer contact list from booking history ── */
  const contactMap = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; bookingCount: number; lastService: string; lastDate: string }>();
    bookings.filter(b => b.tenantId === tenantId).forEach(b => {
      if (!map.has(b.customerPhone)) {
        map.set(b.customerPhone, { name: b.customerName, phone: b.customerPhone, bookingCount: 0, lastService: b.serviceName, lastDate: b.scheduledDate });
      }
      const existing = map.get(b.customerPhone)!;
      existing.bookingCount++;
      if (b.scheduledDate > existing.lastDate) { existing.lastService = b.serviceName; existing.lastDate = b.scheduledDate; }
    });
    return Array.from(map.values());
  }, [bookings, tenantId]);

  /* ── WhatsApp Blast state ── */
  const [waMessage,    setWaMessage]    = useState('Hi {name}! We have a special offer for you. Book any service this week and get 10% off! Reply to schedule. 🙏');
  const [waSegment,    setWaSegment]    = useState<'all' | 'active' | 'inactive' | 'high_value'>('all');
  const [waLog,        setWaLog]        = useState<WaLog[]>([]);
  const [waSelected,   setWaSelected]   = useState<Set<string>>(new Set());
  const [previewPhone, setPreviewPhone] = useState<string | null>(null);
  const [campName,     setCampName]     = useState('');
  const [blastSent,    setBlastSent]    = useState(false);

  const segmented = useMemo(() => {
    if (waSegment === 'active')     return contactMap.filter(c => c.bookingCount >= 2);
    if (waSegment === 'inactive')   return contactMap.filter(c => c.bookingCount === 1);
    if (waSegment === 'high_value') return contactMap.filter(c => c.bookingCount >= 3);
    return contactMap;
  }, [contactMap, waSegment]);

  const allSelected = waSelected.size === segmented.length && segmented.length > 0;

  const toggleSelect = (phone: string) => {
    setWaSelected(prev => {
      const n = new Set(prev);
      n.has(phone) ? n.delete(phone) : n.add(phone);
      return n;
    });
  };

  const toggleAll = () => {
    if (allSelected) setWaSelected(new Set());
    else setWaSelected(new Set(segmented.map(c => c.phone)));
  };

  const buildMessage = (name: string) => waMessage.replace(/\{name\}/gi, name.split(' ')[0]);

  const buildWaUrl = (phone: string, name: string) => {
    const encoded = encodeURIComponent(buildMessage(name));
    const cleanPhone = phone.replace(/\D/g, '');
    const withCC = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    return `https://wa.me/${withCC}?text=${encoded}`;
  };

  const sendToAll = () => {
    const targets = segmented.filter(c => waSelected.size === 0 || waSelected.has(c.phone));
    if (targets.length === 0) { showToast('No contacts selected.', 'error'); return; }
    if (!campName.trim()) { showToast('Please enter a Campaign Name before sending.', 'error'); return; }

    targets.forEach((c, i) => {
      setTimeout(() => window.open(buildWaUrl(c.phone, c.name), '_blank'), i * 600);
    });

    const newLog: WaLog[] = targets.map(c => ({
      phone: c.phone, name: c.name, sentAt: new Date().toLocaleTimeString('en-IN'),
    }));
    setWaLog(prev => [...newLog, ...prev]);

    const nc: Campaign = {
      id: `camp-${Date.now()}`, tenantId, name: campName, type: 'whatsapp',
      message: waMessage, targetSegment: waSegment, status: 'sent',
      sentCount: targets.length, createdAt: new Date().toISOString(),
    };
    setCampaigns(prev => [...prev, nc]);
    setBlastSent(true);
    showToast(`📱 WhatsApp blast sent to ${targets.length} contacts!`);
    setCampName('');
  };

  /* ── Coupon state ── */
  const myCoupons   = coupons.filter(c => c.tenantId === tenantId);
  const myCampaigns = campaigns.filter(c => c.tenantId === tenantId);
  const [cCode,      setCCode]      = useState('');
  const [cType,      setCType]      = useState<'percent' | 'flat'>('flat');
  const [cValue,     setCValue]     = useState(50);
  const [cMinOrder,  setCMinOrder]  = useState(300);
  const [cMaxUses,   setCMaxUses]   = useState(100);
  const [cValidTill, setCValidTill] = useState('2026-09-30');

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cCode) return;
    const nc: Coupon = {
      id: `coup-${Date.now()}`, tenantId, code: cCode.toUpperCase(), type: cType,
      value: cValue, minOrderAmount: cMinOrder, maxUses: cMaxUses, usedCount: 0,
      validTill: cValidTill, applicableServices: [], status: 'active',
      createdAt: new Date().toISOString(),
    };
    setCoupons(prev => [...prev, nc]);
    setCCode(''); setCValue(50); setCMinOrder(300);
    showToast(`Coupon "${nc.code}" created!`);
  };

  const handleToggleCoupon = (id: string, status: Coupon['status']) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    showToast('Coupon status updated.');
  };

  const statusColors: Record<Campaign['status'], string> = {
    draft: '#64748b', scheduled: '#f59e0b', sent: '#22c55e', failed: '#ef4444',
  };

  const segmentLabel: Record<string, string> = {
    all:        `All Customers (${contactMap.length})`,
    active:     `Repeat Customers 2+ bookings (${contactMap.filter(c => c.bookingCount >= 2).length})`,
    inactive:   `First-time / Inactive (${contactMap.filter(c => c.bookingCount === 1).length})`,
    high_value: `High-Value 3+ bookings (${contactMap.filter(c => c.bookingCount >= 3).length})`,
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-black text-white">Marketing Hub</h2>
        <p className="text-slate-500 text-sm mt-1">Bulk WhatsApp blasts, coupons, and customer campaigns to grow your business.</p>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Contacts', value: String(contactMap.length), icon: '👥', color: primaryColor },
          { label: 'Active Coupons', value: String(myCoupons.filter(c => c.status === 'active').length), icon: '🎟️', color: '#22c55e' },
          { label: 'Campaigns Sent', value: String(myCampaigns.filter(c => c.status === 'sent').length), icon: '📣', color: '#a855f7' },
          { label: 'WhatsApp Sent', value: String(waLog.length), icon: '📱', color: '#25D366' },
        ].map((t, i) => (
          <div key={i} className="admin-card text-center">
            <p className="text-2xl">{t.icon}</p>
            <p className="text-2xl font-black mt-1" style={{ color: t.color }}>{t.value}</p>
            <p className="text-xs text-slate-500 font-semibold mt-1">{t.label}</p>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { id: 'whatsapp',  label: '📱 Bulk WhatsApp Blast' },
          { id: 'coupons',   label: '🎟️ Coupons & Offers' },
          { id: 'campaigns', label: '📣 Campaign History' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className="px-5 py-2 rounded-xl text-xs font-bold transition-all"
            style={subTab === t.id ? { background: primaryColor, color: '#fff' } : { background: '#1e293b', color: '#94a3b8' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== BULK WHATSAPP BLAST ===== */}
      {subTab === 'whatsapp' && (
        <div className="space-y-6">

          {/* How it works banner */}
          <div className="admin-card border border-green-900/40 bg-green-950/20 space-y-2">
            <p className="text-xs font-black text-green-400 uppercase tracking-wider">📱 How Bulk WhatsApp Blast Works</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compose your message below, select customer contacts from the list, then click <strong className="text-white">"Send WhatsApp Blast"</strong>. Each customer's WhatsApp chat will open with your personalised message pre-filled — you confirm send from your WhatsApp. Uses your existing WhatsApp Business number. Zero API cost.
            </p>
            <p className="text-[10px] text-green-500 font-bold">✓ Zero API cost &nbsp; ✓ Uses your Business number &nbsp; ✓ Personalized per contact &nbsp; ✓ Works with WhatsApp Web &amp; App</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT: Compose */}
            <div className="admin-card space-y-4">
              <p className="section-title">📝 Compose Message</p>

              <div>
                <label className="form-label">Campaign Name *</label>
                <input className="form-input" placeholder="e.g. Monsoon Special Offer Jul 2026"
                  value={campName} onChange={e => setCampName(e.target.value)} />
              </div>

              <div>
                <label className="form-label">Target Segment</label>
                <select className="form-input" value={waSegment} onChange={e => setWaSegment(e.target.value as typeof waSegment)}>
                  {Object.entries(segmentLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">
                  Message &nbsp;
                  <span className="text-slate-500 font-normal">— use {'{name}'} for personalisation</span>
                </label>
                <textarea
                  className="form-input resize-none text-xs leading-relaxed"
                  rows={6}
                  value={waMessage}
                  onChange={e => { setWaMessage(e.target.value); setBlastSent(false); }}
                  placeholder="Hi {name}! ..."
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-slate-600">{waMessage.length} characters</p>
                  <p className="text-[10px] text-slate-600">
                    Will blast to <strong className="text-white">{waSelected.size > 0 ? waSelected.size : segmented.length}</strong> contacts
                  </p>
                </div>
              </div>

              {/* Quick Templates */}
              <div>
                <p className="text-[10px] uppercase font-black text-slate-500 tracking-wider mb-2">⚡ Quick Templates — click to use</p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_TEMPLATES.map((tmpl, i) => (
                    <button key={i}
                      onClick={() => { setWaMessage(tmpl.text); setCampName(tmpl.name.replace(/^\W+\s*/, '')); setBlastSent(false); }}
                      className="text-left text-[10px] font-bold px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white transition-all"
                    >
                      {tmpl.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live message preview */}
              {previewPhone && (() => {
                const c = segmented.find(x => x.phone === previewPhone);
                if (!c) return null;
                return (
                  <div className="rounded-xl border border-green-900/40 bg-green-950/10 p-4">
                    <p className="text-[10px] uppercase font-black text-green-400 tracking-wider mb-2">Preview for {c.name}</p>
                    <div className="bg-[#075E54] text-white text-xs p-3 rounded-xl rounded-tl-none leading-relaxed whitespace-pre-wrap">
                      {buildMessage(c.name)}
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={sendToAll}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 text-white font-black"
                  style={{ background: '#25D366', border: 'none' }}
                >
                  📤 Send WhatsApp Blast ({waSelected.size > 0 ? waSelected.size : segmented.length} contacts)
                </button>
              </div>

              {blastSent && (
                <div className="text-xs text-green-400 font-bold flex items-center gap-2 animate-fadeIn">
                  ✅ Blast initiated! WhatsApp tabs opened for each contact. Confirm send from your WhatsApp.
                </div>
              )}
            </div>

            {/* RIGHT: Contact List */}
            <div className="admin-card space-y-3">
              <div className="flex items-center justify-between">
                <p className="section-title">👥 Contact List ({segmented.length})</p>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-400 select-none">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-green-500 w-4 h-4 rounded" />
                  Select All
                </label>
              </div>

              {segmented.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-sm">
                  <p className="text-3xl mb-3">📋</p>
                  No contacts in this segment yet.<br />
                  Contacts are built automatically from your booking history.
                </div>
              )}

              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {segmented.map(c => (
                  <div
                    key={c.phone}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${waSelected.has(c.phone) ? 'border-green-700/50 bg-green-950/20' : 'border-slate-800 bg-slate-900/40'}`}
                  >
                    <input type="checkbox" checked={waSelected.has(c.phone)} onChange={() => toggleSelect(c.phone)} className="accent-green-500 w-4 h-4 rounded shrink-0" />
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0" style={{ background: primaryColor + '30', color: primaryColor }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{c.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{c.phone} · {c.bookingCount} booking{c.bookingCount !== 1 ? 's' : ''}</p>
                      <p className="text-[10px] text-slate-600 truncate">Last: {c.lastService}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => setPreviewPhone(prev => prev === c.phone ? null : c.phone)}
                        className="text-[9px] px-2 py-1 rounded-lg border border-slate-700 text-slate-400 hover:text-white transition-all"
                      >
                        Preview
                      </button>
                      <a
                        href={buildWaUrl(c.phone, c.name)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setWaLog(prev => [{ phone: c.phone, name: c.name, sentAt: new Date().toLocaleTimeString('en-IN') }, ...prev])}
                        className="text-[9px] px-2 py-1 rounded-lg font-bold transition-all text-white"
                        style={{ background: '#25D366' }}
                      >
                        Send
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Delivery Log */}
          {waLog.length > 0 && (
            <div className="admin-card overflow-hidden p-0">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <p className="section-title">📋 Send Log ({waLog.length})</p>
                <button onClick={() => setWaLog([])} className="text-[10px] text-slate-500 hover:text-red-400 font-bold">Clear Log</button>
              </div>
              <table className="data-table">
                <thead><tr><th>Customer</th><th>Phone</th><th>Sent At</th><th>Status</th></tr></thead>
                <tbody>
                  {waLog.map((l, i) => (
                    <tr key={i}>
                      <td className="font-bold text-white text-xs">{l.name}</td>
                      <td className="font-mono text-slate-400 text-xs">{l.phone}</td>
                      <td className="text-slate-400 text-xs">{l.sentAt}</td>
                      <td><span className="badge badge-active text-[9px]">✅ Opened</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== COUPONS ===== */}
      {subTab === 'coupons' && (
        <div className="space-y-6">
          <form onSubmit={handleAddCoupon} className="admin-card">
            <p className="section-title mb-4">Create New Coupon</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div><label className="form-label">Coupon Code *</label><input className="form-input uppercase" placeholder="SAVE100" value={cCode} onChange={e => setCCode(e.target.value)} required /></div>
              <div>
                <label className="form-label">Discount Type</label>
                <select className="form-input" value={cType} onChange={e => setCType(e.target.value as 'percent' | 'flat')}>
                  <option value="flat">Flat (₹ Amount)</option>
                  <option value="percent">Percentage (%)</option>
                </select>
              </div>
              <div><label className="form-label">Discount Value</label><input className="form-input" type="number" value={cValue} onChange={e => setCValue(Number(e.target.value))} /></div>
              <div><label className="form-label">Min Order (₹)</label><input className="form-input" type="number" value={cMinOrder} onChange={e => setCMinOrder(Number(e.target.value))} /></div>
              <div><label className="form-label">Max Uses</label><input className="form-input" type="number" value={cMaxUses} onChange={e => setCMaxUses(Number(e.target.value))} /></div>
              <div><label className="form-label">Valid Till</label><input className="form-input" type="date" value={cValidTill} onChange={e => setCValidTill(e.target.value)} /></div>
            </div>
            <button type="submit" className="btn-primary mt-4">+ Create Coupon</button>
          </form>

          <div className="admin-card overflow-hidden p-0">
            <div className="p-5 border-b border-slate-800"><p className="section-title">Coupons ({myCoupons.length})</p></div>
            <table className="data-table">
              <thead><tr><th>Code</th><th>Discount</th><th>Min Order</th><th>Used / Max</th><th>Valid Till</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {myCoupons.map(c => (
                  <tr key={c.id}>
                    <td><span className="font-mono font-black text-white bg-slate-800 px-2 py-1 rounded">{c.code}</span></td>
                    <td className="font-bold" style={{ color: primaryColor }}>{c.type === 'flat' ? `₹${c.value}` : `${c.value}%`} off</td>
                    <td className="text-slate-400">Min ₹{c.minOrderAmount}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{c.usedCount}</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-slate-400">{c.maxUses}</span>
                      </div>
                      <div className="progress-bar mt-1" style={{ width: '80px' }}>
                        <div className="progress-fill" style={{ width: `${(c.usedCount / c.maxUses) * 100}%`, background: primaryColor }} />
                      </div>
                    </td>
                    <td className="text-slate-400 text-xs">{c.validTill}</td>
                    <td><span className={`badge badge-${c.status === 'active' ? 'completed' : c.status === 'paused' ? 'assigned' : 'cancelled'}`}>{c.status}</span></td>
                    <td>
                      {c.status === 'active'
                        ? <button onClick={() => handleToggleCoupon(c.id, 'paused')} className="btn-danger text-[10px] py-1 px-2">Pause</button>
                        : <button onClick={() => handleToggleCoupon(c.id, 'active')} className="btn-success text-[10px] py-1 px-2">Activate</button>}
                    </td>
                  </tr>
                ))}
                {myCoupons.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-6">No coupons yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== CAMPAIGN HISTORY ===== */}
      {subTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="admin-card overflow-hidden p-0">
            <div className="p-5 border-b border-slate-800"><p className="section-title">Campaign History ({myCampaigns.length})</p></div>
            <table className="data-table">
              <thead><tr><th>Campaign</th><th>Type</th><th>Segment</th><th>Sent To</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {myCampaigns.map(c => (
                  <tr key={c.id}>
                    <td className="font-bold text-white">{c.name}</td>
                    <td>
                      <span className="text-sm">{c.type === 'whatsapp' ? '📱' : c.type === 'email' ? '📧' : '🎉'}</span>
                      {' '}<span className="text-xs text-slate-400 capitalize">{c.type}</span>
                    </td>
                    <td className="text-slate-400 text-xs capitalize">{c.targetSegment.replace('_', ' ')}</td>
                    <td className="font-bold text-white">{c.sentCount.toLocaleString()}</td>
                    <td><span className="badge" style={{ color: statusColors[c.status], background: statusColors[c.status] + '20', border: `1px solid ${statusColors[c.status]}40` }}>{c.status}</span></td>
                    <td className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
                {myCampaigns.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-6">No campaigns yet. Send your first WhatsApp Blast!</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
