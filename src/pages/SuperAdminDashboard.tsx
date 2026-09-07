import { useState, useEffect } from 'react';
import type { AuthSession, TicketReply } from '../types';
import type { SharedStore } from '../App';
import { INITIAL_AUDIT_LOGS } from '../initialData';
import { api } from '../utils/api';
import {
  Shield, LogOut, Building2, CheckCircle, XCircle, AlertTriangle, Clock, Activity,
  Server, Database, Network, LifeBuoy, FileCheck2
} from 'lucide-react';

interface Props {
  session: AuthSession;
  store: SharedStore;
  onLogout: () => void;
  navigateTo: (hash: string) => void;
}

export default function SuperAdminDashboard({ session, store, onLogout, navigateTo }: Props) {
  const { tenants, setTenants, bookings, leads, tickets, setTickets } = store;
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tenants' | 'pending' | 'health' | 'tickets' | 'logs'>(() => {
    try {
      const saved = sessionStorage.getItem('anarav_superadmin_tab') || localStorage.getItem('anarav_superadmin_tab');
      if (saved) return saved as any;
    } catch {}
    return 'dashboard';
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('anarav_superadmin_tab', activeTab);
      localStorage.setItem('anarav_superadmin_tab', activeTab);
    } catch {}
  }, [activeTab]);

  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [activeReply, setActiveReply] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Derived metrics
  const activeTenants = tenants.filter(t => t.status === 'active');
  const pendingTenants = tenants.filter(t => t.status === 'pending');

  const completedBookings = bookings.filter(b => b.status === 'completed');
  const totalRevenue = completedBookings.reduce((sum, b) => sum + b.priceDetails.total, 0);
  const activeBookings = bookings.filter(b => !['completed', 'cancelled', 'closed'].includes(b.status)).length;

  const handleApprove = (id: string) => {
    api.updateTenant(id, { status: 'active' }).catch(err => console.error('Error approving tenant in DB:', err));
    setTenants(prev => prev.map(t => t.id === id ? { ...t, status: 'active' } : t));
    showToast('Tenant approved & provisioned successfully!');
  };

  const handleReject = (id: string) => {
    setTenants(prev => prev.filter(t => t.id !== id));
    showToast('Registration application rejected.', 'error');
  };

  const handleSuspend = (id: string) => {
    api.updateTenant(id, { status: 'suspended' }).catch(err => console.error('Error suspending tenant in DB:', err));
    setTenants(prev => prev.map(t => t.id === id ? { ...t, status: 'suspended' } : t));
    showToast('Tenant suspended.', 'info');
  };

  const handleActivate = (id: string) => {
    api.updateTenant(id, { status: 'active' }).catch(err => console.error('Error activating tenant in DB:', err));
    setTenants(prev => prev.map(t => t.id === id ? { ...t, status: 'active' } : t));
    showToast('Tenant re-activated successfully.');
  };

  const handleReplyTicket = (ticketId: string) => {
    if (!activeReply.trim()) return;
    const newReply: TicketReply = {
      id: 'rep-' + Date.now(),
      sender: 'super_admin',
      senderName: 'Anarav Admin',
      message: activeReply,
      createdAt: new Date().toISOString()
    };
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'replied', replies: [...t.replies, newReply] } : t));
    setActiveReply('');
    showToast('Reply submitted successfully!');
  };

  const handleCloseTicket = (ticketId: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'closed' } : t));
    showToast('Ticket marked as closed.', 'info');
  };

  const handleReopenTicket = (ticketId: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'open' } : t));
    showToast('Ticket re-opened.', 'success');
  };


  const planColors: Record<string, string> = { starter: '#64748b', professional: '#2563eb', enterprise: '#7c3aed' };

  // Simulated MRR trend calculation
  const platformMRR = activeTenants.reduce((sum, t) => {
    const rate = t.plan === 'starter' ? 999 : t.plan === 'professional' ? 2499 : 9999;
    return sum + rate;
  }, 0);

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden text-slate-200" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ====== TOP NAV ====== */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-650 rounded-lg flex items-center justify-center shadow">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight">AevonOS</span>
              <span className="text-[10px] text-slate-500 ml-2 font-mono">/ Operator console</span>
            </div>
          </div>
          <div className="h-5 w-px bg-slate-700 mx-2" />
          <nav className="flex gap-1">
            {[
              { id: 'dashboard', label: 'Overview', icon: Activity },
              { id: 'tenants', label: `Active (${activeTenants.length})`, icon: Building2 },
              { id: 'pending', label: `Pending (${pendingTenants.length})`, icon: Clock, badge: pendingTenants.length || undefined },
              { id: 'health', label: 'Platform Health', icon: Server },
              { id: 'tickets', label: 'Support Tickets', icon: LifeBuoy },
              { id: 'logs', label: 'Audit Logs', icon: FileCheck2 }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600/15 text-blue-400 border border-blue-500/25' : 'text-slate-500 hover:text-slate-350'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="w-4 h-4 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ml-1">{tab.badge}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-white">{session.email}</p>
            <p className="text-[10px] text-slate-500">Platform Operator</p>
          </div>
          <button
            onClick={() => { onLogout(); navigateTo('#/'); }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-lg transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      {/* ====== MAIN CONTENT ====== */}
      <main className="flex-1 overflow-y-auto p-6 bg-slate-950">

        {/* ---- DASHBOARD TAB ---- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-black text-white">Platform Metrics</h1>
              <p className="text-slate-500 text-sm mt-1">Global SaaS dashboard monitoring all active customer sites & MRR settlements.</p>
            </div>

            {/* KPI Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 font-sans">
              <div className="kpi-card blue"><p className="kpi-label">Active Sites</p><p className="kpi-value">{activeTenants.length}</p><p className="kpi-sub">{pendingTenants.length} awaiting review</p></div>
              <div className="kpi-card green"><p className="kpi-label">Platform MRR</p><p className="kpi-value">₹{platformMRR.toLocaleString()}</p><p className="kpi-sub">SaaS license fees</p></div>
              <div className="kpi-card amber"><p className="kpi-label">Total Transactions</p><p className="kpi-value">₹{(totalRevenue / 1000).toFixed(0)}K</p><p className="kpi-sub">Across all checkouts</p></div>
              <div className="kpi-card purple"><p className="kpi-label">Bookings Count</p><p className="kpi-value">{bookings.length}</p><p className="kpi-sub">{activeBookings} active booking tracks</p></div>
              <div className="kpi-card rose"><p className="kpi-label">CRM Leads</p><p className="kpi-value">{leads.length}</p><p className="kpi-sub">Active marketing pipeline</p></div>
            </div>

            {/* Platform MRR Trend Visualizer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="admin-card space-y-4">
                <div>
                  <p className="section-title">Licensing Revenue Distribution</p>
                  <p className="section-subtitle">Monthly Subscription MRR breakdown by tier</p>
                </div>
                <div className="space-y-3 font-sans text-xs">
                  {['starter', 'professional', 'enterprise'].map(plan => {
                    const count = activeTenants.filter(t => t.plan === plan).length;
                    const value = count * (plan === 'starter' ? 999 : plan === 'professional' ? 2499 : 9999);
                    const pct = platformMRR > 0 ? Math.round((value / platformMRR) * 100) : 0;
                    return (
                      <div key={plan} className="space-y-1">
                        <div className="flex justify-between font-semibold">
                          <span className="capitalize">{plan} Plan ({count} tenants)</span>
                          <span className="text-white">₹{value.toLocaleString()} ({pct}%)</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${pct}%`, background: planColors[plan] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transactions list */}
              <div className="admin-card">
                <div className="section-header">
                  <p className="section-title">Recent Transactions</p>
                  <p className="section-subtitle">Gateway operations across active sites</p>
                </div>
                <div className="space-y-3 font-sans text-xs">
                  {completedBookings.slice(0, 5).map(b => {
                    const tenant = tenants.find(t => t.id === b.tenantId);
                    return (
                      <div key={b.id} className="flex justify-between py-2 border-b border-slate-800 last:border-0">
                        <div>
                          <p className="font-semibold text-slate-200">{b.customerName} → {b.serviceName}</p>
                          <p className="text-[10px] text-slate-500">{tenant?.name || b.tenantId}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-white">₹{b.priceDetails.total}</p>
                          <span className="badge badge-completed">Settled T+1</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---- TENANTS TAB ---- */}
        {activeTab === 'tenants' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="section-title text-xl">Active Registry</h1>
              <p className="section-subtitle">{activeTenants.length} approved workspaces running live.</p>
            </div>

            <div className="admin-card overflow-hidden p-0">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Business Name</th>
                    <th>Owner Contact</th>
                    <th>Provisioned Domain</th>
                    <th>Subscription Plan</th>
                    <th>Gateway Status</th>
                    <th>Action Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.filter(t => t.status !== 'pending').map(t => (
                    <tr key={t.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🏪</span>
                          <div>
                            <p className="font-bold text-white text-sm">{t.name}</p>
                            <p className="text-xs text-slate-500">{t.industries.join(', ')}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="font-bold text-slate-200">{t.ownerName}</p>
                        <p className="text-xs text-slate-500 font-mono">{t.ownerPhone} · {t.ownerEmail}</p>
                      </td>
                      <td>
                        <p className="font-mono text-xs text-blue-400">{t.defaultDomain || `${t.slug || t.subdomain}.vercel.app`}</p>
                        {t.customDomain && <p className="font-mono text-[10px] text-emerald-400 mt-0.5">🌐 {t.customDomain}</p>}
                      </td>
                      <td>
                        <span className="badge" style={{ background: planColors[t.plan] + '20', color: planColors[t.plan], border: `1px solid ${planColors[t.plan]}40` }}>{t.plan}</span>
                      </td>
                      <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                      <td>
                        {t.status === 'active' ? (
                          <button onClick={() => handleSuspend(t.id)} className="btn-danger py-1 px-3 text-[11px] font-bold">Suspend Site</button>
                        ) : (
                          <button onClick={() => handleActivate(t.id)} className="btn-success py-1 px-3 text-[11px] font-bold">Activate Site</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---- PENDING TAB ---- */}
        {activeTab === 'pending' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-xl font-black text-white font-mono">Workspace Provisioning Queue</h1>
              <p className="text-slate-500 text-sm mt-1">Review new registrations from the landing page before provisioning databases.</p>
            </div>

            {pendingTenants.length === 0 ? (
              <div className="admin-card text-center py-16">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <p className="text-white font-bold">Registry queue is empty</p>
                <p className="text-slate-500 text-xs mt-1">Submit the workspace registration from Landing page to test provisioning workflow.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTenants.map(t => (
                  <div key={t.id} className="admin-card border border-amber-900/40">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div>
                        <h3 className="font-black text-white text-base">🏪 {t.name}</h3>
                        <p className="text-xs text-slate-400 mt-1">Owner: {t.ownerName} · {t.ownerPhone} · {t.ownerEmail}</p>
                        <p className="text-[11px] text-slate-500 mt-1 font-mono">
                          Desired URL: <strong className="text-blue-400">{t.defaultDomain || `${t.slug || t.subdomain}.vercel.app`}</strong>
                          &nbsp;·&nbsp; Vertical Pack: <strong className="text-white">{t.industries.join(', ')}</strong>
                          &nbsp;·&nbsp; Subscription: <strong className="capitalize" style={{ color: planColors[t.plan] }}>{t.plan}</strong>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleReject(t.id)} className="btn-danger font-bold text-xs"><XCircle className="w-4 h-4" /> Reject</button>
                        <button onClick={() => handleApprove(t.id)} className="btn-success font-bold text-xs"><CheckCircle className="w-4 h-4" /> Approve & Provision</button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                        <p className="text-slate-500 uppercase font-black tracking-widest text-[9px] mb-1">Database Provision Details</p>
                        <p className="text-slate-300">Isolated schema prefix: <strong className="text-white font-mono">{t.subdomain}_schema</strong></p>
                        <p className="text-slate-300">Feature flags: <strong className="text-slate-400">CRM: OK, AI: {t.plan !== 'starter' ? 'YES' : 'NO'}</strong></p>
                      </div>
                      <div className="bg-amber-950/20 border border-amber-900/30 p-3 rounded-xl text-amber-400 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <span>Upon approval, the system triggers the multi-tenant resolver broker to mount features & deploy branded static customer booking page.</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---- PLATFORM HEALTH TAB ---- */}
        {activeTab === 'health' && (
          <div className="space-y-6 animate-fadeIn font-mono text-xs">
            <div>
              <h1 className="text-xl font-black text-white font-sans">Platform Uptime & Telemetry</h1>
              <p className="text-slate-500 text-sm mt-1 font-sans">Real-time health monitor of underlying Anarav Business OS clusters.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Core Engine Database', status: 'Healthy', details: 'PostgreSQL Vector Cluster · pgvector installed', latency: '4ms', color: '#22c55e', icon: Database },
                { name: 'Tenant Resolution Broker', status: 'Nominal', details: 'DNS routing & auto SSL gateway', latency: '12ms', color: '#22c55e', icon: Network },
                { name: 'Queue & Cache Broker', status: 'Online', details: 'Redis cache store & BullMQ queue worker logs', latency: '2ms', color: '#22c55e', icon: Server }
              ].map((h, i) => {
                const Icon = h.icon;
                return (
                  <div key={i} className="admin-card space-y-3" style={{ borderLeft: `3px solid ${h.color}` }}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-blue-400" /> <span className="font-bold text-white font-sans text-xs">{h.name}</span></div>
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-bold">{h.status}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] font-sans">{h.details}</p>
                    <p className="text-slate-400 font-bold">Latency: {h.latency}</p>
                  </div>
                );
              })}
            </div>

            <div className="admin-card space-y-4">
              <p className="section-title font-sans">System Resource Analytics</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Virtual CPU Usage</p>
                  <p className="text-lg font-black text-white">12.4% <span className="text-xs text-slate-500">/ 16 Cores</span></p>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: '12%', background: '#22c55e' }} /></div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Memory Pool Allocation</p>
                  <p className="text-lg font-black text-white">4.2 GB <span className="text-xs text-slate-500">/ 32 GB RAM</span></p>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: '13%', background: '#22c55e' }} /></div>
                </div>
              </div>
            </div>

            <div className="admin-card space-y-4 font-sans mt-6">
              <p className="section-title">Multi-Tenant Backup & Disaster Recovery</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                  <p className="text-white font-bold text-xs">Automated Snapshot Policies</p>
                  <p className="text-slate-500 text-[10px]">Daily vector db snapshots and schema backups scheduled (Retention: 30 days).</p>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => showToast('Starting global database backup...')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-3 py-1.5 rounded">Create Live Backup</button>
                    <button onClick={() => showToast('Exporting global audit telemetry...')} className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-[10px] px-3 py-1.5 border border-slate-700 rounded">Export Telemetry</button>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                  <p className="text-white font-bold text-xs">Tenant Schema Restoration logs</p>
                  <div className="space-y-1.5 text-[10px] font-mono text-slate-500">
                    <div className="flex justify-between"><span>voltfix_backup_20260715.sql</span> <button onClick={() => showToast('Restoring VoltFix database schema snapshot v1.0.2...')} className="text-blue-400 font-bold hover:underline">Restore</button></div>
                    <div className="flex justify-between"><span>royalpaint_backup_20260714.sql</span> <button onClick={() => showToast('Restoring Royal Brush database schema snapshot v1.0.1...')} className="text-blue-400 font-bold hover:underline">Restore</button></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---- SUPPORT TICKETS TAB ---- */}
        {activeTab === 'tickets' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-xl font-black text-white">SaaS Support Tickets</h1>
              <p className="text-slate-500 text-sm mt-1 font-sans">Manage and respond to support queries from business owner workspaces.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
              <div className="lg:col-span-2 admin-card overflow-hidden p-0">
                <table className="data-table text-xs">
                  <thead>
                    <tr><th>ID</th><th>Workspace</th><th>Subject</th><th>Status</th><th>Submitted</th><th></th></tr>
                  </thead>
                  <tbody>
                    {tickets.map(t => (
                      <tr key={t.id} className={selectedTicketId === t.id ? 'bg-slate-800/40' : ''}>
                        <td className="font-mono text-xs text-slate-500">{t.id}</td>
                        <td className="font-bold text-white">{t.tenantName}</td>
                        <td className="text-slate-350">{t.subject}</td>
                        <td><span className={`badge badge-${t.status === 'open' ? 'requested' : 'completed'}`}>{t.status}</span></td>
                        <td className="text-slate-500 text-[10px]">{t.createdAt}</td>
                        <td>
                          <button onClick={() => setSelectedTicketId(t.id)} className="text-xs font-bold text-blue-400 hover:underline">Open Ticket</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                {selectedTicketId ? (() => {
                  const ticket = tickets.find(t => t.id === selectedTicketId);
                  if (!ticket) return null;
                  return (
                    <div className="admin-card space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                        <div><p className="text-[10px] font-mono text-slate-500">{ticket.id}</p><h3 className="font-black text-white text-sm mt-0.5">{ticket.tenantName}</h3></div>
                        <span className={`badge badge-${ticket.status === 'open' ? 'requested' : 'completed'}`}>{ticket.status}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-bold text-slate-400">Subject:</span>
                          <span className="text-blue-400 capitalize bg-blue-950/40 px-1.5 py-0.5 rounded font-semibold font-mono text-[9px]">{ticket.category || 'other'}</span>
                        </div>
                        <p className="text-xs text-white font-semibold">{ticket.subject}</p>
                      </div>
                      <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl text-xs text-slate-400 leading-relaxed italic">
                        "{ticket.message}"
                      </div>

                      {ticket.replies.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-500 uppercase">Replies History</p>
                          {ticket.replies.map((rep, idx) => (
                            <div key={idx} className="bg-slate-800 p-2.5 rounded-xl text-xs text-slate-300 border border-slate-700/40">
                              <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold mb-1">
                                <span>{rep.sender === 'super_admin' ? 'Operator' : 'Tenant'} ({rep.senderName})</span>
                                <span>{new Date(rep.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="font-sans leading-relaxed">{rep.message}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {ticket.status !== 'closed' ? (
                        <div className="space-y-2 pt-2 border-t border-slate-800/40">
                          <label className="form-label text-[10px]">Draft Reply</label>
                          <textarea className="form-input text-xs resize-none" rows={3} placeholder="Type support answer here..." value={activeReply} onChange={e => setActiveReply(e.target.value)} />
                          <div className="flex gap-2">
                            <button onClick={() => handleReplyTicket(ticket.id)} className="flex-grow btn-primary py-2 text-xs font-bold">Submit Response</button>
                            <button onClick={() => handleCloseTicket(ticket.id)} className="btn-secondary py-2 px-3 text-xs font-bold text-red-400 border border-red-900/50 hover:bg-red-950/20">Close</button>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-slate-800/40">
                          <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl text-xs text-center text-slate-500 mb-2">
                            This support ticket is closed.
                          </div>
                          <button onClick={() => handleReopenTicket(ticket.id)} className="w-full btn-secondary py-2 text-xs font-bold text-emerald-400 border border-emerald-900/50 hover:bg-emerald-950/20">Re-open Ticket</button>
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <div className="admin-card flex flex-col items-center justify-center h-48 text-center">
                    <span className="text-3xl mb-2">💬</span>
                    <p className="text-slate-400 text-xs font-bold">Select a Ticket</p>
                    <p className="text-slate-600 text-[10px] mt-1">Select any ticket from list to reply.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---- AUDIT LOGS TAB ---- */}
        {activeTab === 'logs' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-xl font-black text-white font-mono">Platform Audit Logs</h1>
              <p className="text-slate-500 text-sm mt-1">Operator audit security events recorded across all isolated databases.</p>
            </div>

            <div className="admin-card overflow-hidden p-0">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Business Tenant ID</th>
                    <th>Trigger Username</th>
                    <th>Event Code</th>
                    <th>Details</th>
                    <th>Client IP</th>
                  </tr>
                </thead>
                <tbody>
                  {INITIAL_AUDIT_LOGS.map(log => {
                    const tenant = tenants.find(t => t.id === log.tenantId);
                    return (
                      <tr key={log.id}>
                        <td className="font-mono text-xs text-slate-500">{new Date(log.timestamp).toLocaleString('en-IN')}</td>
                        <td className="font-bold text-slate-350">{tenant?.name || log.tenantId}</td>
                        <td className="text-slate-400 font-semibold">{log.userName}</td>
                        <td><span className="font-mono text-xs bg-slate-900 text-blue-400 border border-blue-900/30 px-2 py-0.5 rounded">{log.action}</span></td>
                        <td className="text-slate-500 text-xs max-w-xs truncate">{log.details}</td>
                        <td className="font-mono text-xs text-slate-500">{log.ip}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ====== TOAST ====== */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
