import { useMemo, useState } from 'react';
import type { Booking } from '../../types';

interface Props {
  tenantId: string;
  bookings: Booking[];
  primaryColor: string;
}

interface Customer {
  name: string;
  phone: string;
  totalBookings: number;
  totalSpend: number;
  lastService: string;
  lastDate: string;
  loyaltyPoints: number;
  status: 'active' | 'inactive';
  bookingIds: string[];
}

export default function CustomersTab({ tenantId, bookings, primaryColor }: Props) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const customers = useMemo<Customer[]>(() => {
    const myBookings = bookings.filter(b => b.tenantId === tenantId);
    const map = new Map<string, Customer>();

    for (const b of myBookings) {
      const key = b.customerPhone;
      const existing = map.get(key);
      if (existing) {
        existing.totalBookings++;
        existing.totalSpend += b.status === 'completed' ? b.priceDetails.total : 0;
        if (b.createdAt > existing.lastDate) {
          existing.lastDate = b.createdAt;
          existing.lastService = b.serviceName;
        }
        existing.bookingIds.push(b.id);
      } else {
        map.set(key, {
          name: b.customerName,
          phone: b.customerPhone,
          totalBookings: 1,
          totalSpend: b.status === 'completed' ? b.priceDetails.total : 0,
          lastService: b.serviceName,
          lastDate: b.createdAt,
          loyaltyPoints: Math.floor(Math.random() * 200) + 10,
          status: 'active',
          bookingIds: [b.id],
        });
      }
    }

    // Mark customers who haven't booked in 60+ days as inactive
    const now = new Date();
    return Array.from(map.values()).map(c => ({
      ...c,
      status: ((now.getTime() - new Date(c.lastDate).getTime()) > 60 * 24 * 60 * 60 * 1000 ? 'inactive' : 'active') as 'active' | 'inactive',
    })).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [bookings, tenantId]);

  const filtered = customers.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const customerBookings = selectedCustomer
    ? bookings.filter(b => selectedCustomer.bookingIds.includes(b.id))
    : [];

  const statusColors: Record<Booking['status'], string> = { requested: '#ca8a04', quotation: '#6366f1', approved: '#3b82f6', payment: '#0ea5e9', assigned: '#0ea5e9', on_the_way: '#f97316', started: '#a855f7', completed: '#22c55e', cancelled: '#ef4444', closed: '#64748b' };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-black text-white">Customer Management</h2>
          <p className="text-slate-500 text-sm mt-1">{customers.length} unique customers found from booking history.</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">Active: <strong className="text-emerald-400">{customers.filter(c => c.status === 'active').length}</strong></span>
          <span className="text-slate-500">Inactive: <strong className="text-slate-400">{customers.filter(c => c.status === 'inactive').length}</strong></span>
          <span className="text-slate-500">Total Spend: <strong style={{ color: primaryColor }}>₹{customers.reduce((s, c) => s + c.totalSpend, 0).toLocaleString()}</strong></span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <input className="form-input flex-1 max-w-xs" placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
        {(['all', 'active', 'inactive'] as const).map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${statusFilter === f ? 'text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`} style={statusFilter === f ? { background: primaryColor } : {}}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer list */}
        <div className="lg:col-span-2 admin-card overflow-hidden p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Bookings</th>
                <th>Total Spent</th>
                <th>Last Service</th>
                <th>Loyalty Pts</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i} className={selectedCustomer?.phone === c.phone ? 'bg-slate-800/50' : ''}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0" style={{ background: primaryColor }}>
                        {c.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{c.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{c.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="font-black text-white">{c.totalBookings}</td>
                  <td className="font-bold text-emerald-400">₹{c.totalSpend.toLocaleString()}</td>
                  <td>
                    <p className="text-xs text-slate-300 font-semibold">{c.lastService}</p>
                    <p className="text-[10px] text-slate-600">{new Date(c.lastDate).toLocaleDateString('en-IN')}</p>
                  </td>
                  <td className="font-bold text-amber-400">⭐ {c.loyaltyPoints}</td>
                  <td><span className={`badge badge-${c.status === 'active' ? 'completed' : 'cancelled'}`}>{c.status}</span></td>
                  <td>
                    <button onClick={() => setSelectedCustomer(c)} className="text-xs font-bold px-2 py-1 rounded-lg" style={{ color: primaryColor, background: primaryColor + '20' }}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center text-slate-500 py-8">No customers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Customer detail panel */}
        <div>
          {selectedCustomer ? (
            <div className="admin-card space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black text-white" style={{ background: primaryColor }}>
                  {selectedCustomer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p className="font-black text-white">{selectedCustomer.name}</p>
                  <p className="text-sm text-slate-500">{selectedCustomer.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-white">{selectedCustomer.totalBookings}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Total Bookings</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-emerald-400">₹{selectedCustomer.totalSpend.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Total Spent</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-3 text-center col-span-2">
                  <p className="text-xl font-black text-amber-400">⭐ {selectedCustomer.loyaltyPoints} pts</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Loyalty Points</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Booking History</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {customerBookings.map(b => (
                    <div key={b.id} className="bg-slate-800 rounded-lg p-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{b.serviceName}</p>
                        <p className="text-[10px] text-slate-500">{b.scheduledDate} · {b.id}</p>
                      </div>
                      <div className="text-right">
                        <span className="badge" style={{ color: statusColors[b.status], background: statusColors[b.status] + '20', border: `1px solid ${statusColors[b.status]}30` }}>{b.status}</span>
                        <p className="text-xs font-bold text-white mt-0.5">₹{b.priceDetails.total}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <a href={`tel:${selectedCustomer.phone}`} className="flex-1 btn-secondary text-center text-xs">📞 Call</a>
                <a href={`https://wa.me/91${selectedCustomer.phone}`} target="_blank" rel="noopener noreferrer" className="flex-1 text-xs font-bold py-2 rounded-xl text-center" style={{ background: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e40' }}>💬 WhatsApp</a>
              </div>
            </div>
          ) : (
            <div className="admin-card flex flex-col items-center justify-center h-48 text-center">
              <span className="text-4xl mb-3">👤</span>
              <p className="text-slate-400 font-bold">Select a customer</p>
              <p className="text-slate-600 text-xs mt-1">Click "View" to see full customer profile and booking history.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
