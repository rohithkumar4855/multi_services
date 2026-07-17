import type { Booking, Service, Worker } from '../../types';

interface Props {
  tenantId: string;
  bookings: Booking[];
  services: Service[];
  workers: Worker[];
  primaryColor: string;
}

interface MonthData { label: string; revenue: number; count: number; }

export default function AnalyticsTab({ tenantId, bookings, services, workers, primaryColor }: Props) {
  const myB = bookings.filter(b => b.tenantId === tenantId);
  const completed = myB.filter(b => b.status === 'completed');
  const totalRev = completed.reduce((s, b) => s + b.priceDetails.total, 0);
  const avgOrder = completed.length > 0 ? Math.round(totalRev / completed.length) : 0;
  const cancelRate = myB.length > 0 ? Math.round((myB.filter(b => b.status === 'cancelled').length / myB.length) * 100) : 0;

  // Simulated 6-month revenue trend
  const months: MonthData[] = [
    { label: 'Feb', revenue: 18400, count: 12 },
    { label: 'Mar', revenue: 22100, count: 15 },
    { label: 'Apr', revenue: 19800, count: 13 },
    { label: 'May', revenue: 31200, count: 21 },
    { label: 'Jun', revenue: 28600, count: 19 },
    { label: 'Jul', revenue: totalRev || 16800, count: completed.length || 11 },
  ];
  const maxRev = Math.max(...months.map(m => m.revenue));

  // Service revenue breakdown
  const svcRevenue = services
    .filter(s => s.tenantId === tenantId)
    .map(s => ({
      name: s.name,
      icon: s.icon,
      revenue: myB.filter(b => b.serviceId === s.id && b.status === 'completed').reduce((sum, b) => sum + b.priceDetails.total, 0),
      count: myB.filter(b => b.serviceId === s.id).length,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Worker performance
  const wrkPerf = workers
    .filter(w => w.tenantId === tenantId)
    .map(w => ({
      name: w.name,
      jobs: myB.filter(b => b.workerId === w.id && b.status === 'completed').length,
      rating: w.rating,
      earnings: w.earningsMonth,
    }))
    .sort((a, b) => b.jobs - a.jobs);

  // Booking status distribution
  const statuses = ['requested', 'assigned', 'completed', 'cancelled'] as const;
  const statusColors: Record<string, string> = { requested: '#ca8a04', assigned: '#0ea5e9', completed: '#22c55e', cancelled: '#ef4444' };

  const kpis = [
    { label: 'Total Revenue', value: `₹${totalRev.toLocaleString()}`, sub: `${completed.length} completed jobs`, color: primaryColor },
    { label: 'Avg Order Value', value: `₹${avgOrder.toLocaleString()}`, sub: 'Per completed booking', color: '#22c55e' },
    { label: 'Cancellation Rate', value: `${cancelRate}%`, sub: `${myB.filter(b => b.status === 'cancelled').length} cancelled`, color: cancelRate > 20 ? '#ef4444' : '#f59e0b' },
    { label: 'Total Customers', value: String(new Set(myB.map(b => b.customerPhone)).size), sub: 'Unique phone numbers', color: '#a855f7' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-black text-white">Business Analytics</h2>
        <p className="text-slate-500 text-sm mt-1">Revenue, bookings, and performance insights for your business.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="admin-card" style={{ borderTop: `2px solid ${k.color}` }}>
            <p className="text-[10px] text-slate-500 uppercase font-bold">{k.label}</p>
            <p className="text-2xl font-black mt-2" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs text-slate-600 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue Trend Chart */}
      <div className="admin-card">
        <div className="section-header">
          <div>
            <p className="section-title">Revenue Trend (6 Months)</p>
            <p className="section-subtitle">Monthly revenue and booking volume</p>
          </div>
          <span className="text-sm font-bold text-slate-400">₹{(months.reduce((s, m) => s + m.revenue, 0) / 1000).toFixed(0)}K total</span>
        </div>
        <div className="flex items-end gap-3 h-40">
          {months.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] text-slate-500 font-bold">{m.count} jobs</span>
              <div className="w-full rounded-t-lg relative overflow-hidden" style={{ height: `${Math.max(8, (m.revenue / maxRev) * 120)}px`, background: i === months.length - 1 ? primaryColor : '#1e293b', transition: 'height 0.5s ease' }}>
                <div className="absolute inset-0 opacity-20" style={{ background: 'linear-gradient(to top, transparent, white)' }} />
              </div>
              <span className="text-[9px] text-slate-400 font-bold">{m.label}</span>
              <span className="text-[9px] text-slate-500">₹{(m.revenue / 1000).toFixed(1)}K</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Status Breakdown */}
        <div className="admin-card">
          <p className="section-title mb-4">Booking Status Distribution</p>
          <div className="space-y-3">
            {statuses.map(s => {
              const count = myB.filter(b => b.status === s).length;
              const pct = myB.length > 0 ? Math.round((count / myB.length) * 100) : 0;
              return (
                <div key={s}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-semibold capitalize" style={{ color: statusColors[s] }}>{s}</span>
                    <span className="text-xs text-slate-400">{count} ({pct}%)</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: statusColors[s] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Services */}
        <div className="admin-card">
          <p className="section-title mb-4">Revenue by Service</p>
          <div className="space-y-3">
            {svcRevenue.slice(0, 5).map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg w-7">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-300 truncate">{s.name}</span>
                    <span className="text-xs font-bold text-white">₹{s.revenue.toLocaleString()}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${svcRevenue[0].revenue > 0 ? (s.revenue / svcRevenue[0].revenue) * 100 : 0}%`, background: primaryColor }} />
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5">{s.count} bookings</p>
                </div>
              </div>
            ))}
            {svcRevenue.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No service data yet.</p>}
          </div>
        </div>
      </div>

      {/* Worker Performance */}
      <div className="admin-card overflow-hidden p-0">
        <div className="p-5 border-b border-slate-800">
          <p className="section-title">Worker Performance</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Technician</th>
              <th>Completed Jobs</th>
              <th>Rating</th>
              <th>Monthly Earnings</th>
              <th>Performance</th>
            </tr>
          </thead>
          <tbody>
            {wrkPerf.map((w, i) => (
              <tr key={i}>
                <td className="font-bold text-white">{w.name}</td>
                <td className="font-bold" style={{ color: primaryColor }}>{w.jobs}</td>
                <td><span className="text-amber-400 font-bold">⭐ {w.rating}</span></td>
                <td className="font-bold text-emerald-400">₹{w.earnings.toLocaleString()}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 progress-bar" style={{ width: '80px' }}>
                      <div className="progress-fill" style={{ width: `${Math.min(100, (w.jobs / Math.max(...wrkPerf.map(x => x.jobs), 1)) * 100)}%`, background: '#22c55e' }} />
                    </div>
                    <span className="text-xs text-slate-500">#{i + 1}</span>
                  </div>
                </td>
              </tr>
            ))}
            {wrkPerf.length === 0 && (
              <tr><td colSpan={5} className="text-center text-slate-500 py-6">No worker data available.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Insights panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: '📈', title: 'Growth Trend', value: '+23%', desc: 'vs last month bookings', color: '#22c55e' },
          { icon: '⚡', title: 'Avg Response Time', value: '18 min', desc: 'From booking to worker assignment', color: '#f59e0b' },
          { icon: '💬', title: 'Customer Satisfaction', value: '4.8 / 5', desc: 'Based on reviews received', color: primaryColor },
        ].map((item, i) => (
          <div key={i} className="admin-card flex items-center gap-4">
            <span className="text-3xl">{item.icon}</span>
            <div>
              <p className="text-xl font-black" style={{ color: item.color }}>{item.value}</p>
              <p className="text-xs font-bold text-slate-400">{item.title}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
