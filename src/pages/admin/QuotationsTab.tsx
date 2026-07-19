import { useState } from 'react';
import type { Quotation, QuotationItem, Booking } from '../../types';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

interface Props {
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  tenantGst?: string;
  quotations: Quotation[];
  setQuotations: React.Dispatch<React.SetStateAction<Quotation[]>>;
  bookings: Booking[];
  showToast: (msg: string, type?: string) => void;
  primaryColor: string;
}

const emptyItem = (): QuotationItem => ({ description: '', quantity: 1, unitPrice: 0, amount: 0 });

export default function QuotationsTab({ tenantId, tenantName, tenantPhone, tenantGst, quotations, setQuotations, bookings, showToast, primaryColor }: Props) {
  const myQuotations = quotations.filter(q => q.tenantId === tenantId);
  const [previewQ, setPreviewQ]   = useState<Quotation | null>(null);
  const [showForm, setShowForm]   = useState(false);

  // Form fields
  const [custName,    setCustName]    = useState('');
  const [custPhone,   setCustPhone]   = useState('');
  const [linkedBkId,  setLinkedBkId]  = useState('');
  const [notes,       setNotes]       = useState('30-day warranty on all work. GST applicable.');
  const [validDays,   setValidDays]   = useState(7);
  const [taxPct,      setTaxPct]      = useState(18);
  const [discountVal, setDiscountVal] = useState(0);
  const [items,       setItems]       = useState<QuotationItem[]>([emptyItem()]);

  const myBookings = bookings.filter(b => b.tenantId === tenantId && ['requested', 'quotation', 'approved'].includes(b.status));

  const updateItem = (i: number, key: keyof QuotationItem, val: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      (updated[i] as any)[key] = val;
      updated[i].amount = updated[i].quantity * updated[i].unitPrice;
      return updated;
    });
  };

  const subtotal  = items.reduce((s, it) => s + it.amount, 0);
  const taxAmount = Math.round(subtotal * taxPct / 100);
  const total     = subtotal + taxAmount - discountVal;

  const handleCreate = (e: React.FormEvent, asDraft: boolean) => {
    e.preventDefault();
    if (!custName || items.every(i => !i.description)) return;
    const nq: Quotation = {
      id: `QT-${String(Date.now()).slice(-4)}`,
      tenantId,
      bookingId: linkedBkId || undefined,
      customerName: custName,
      customerPhone: custPhone,
      items: items.filter(i => i.description),
      notes,
      validDays,
      status: asDraft ? 'draft' : 'sent',
      createdAt: new Date().toISOString(),
      subtotal, tax: taxAmount, discount: discountVal, total,
    };
    setQuotations(prev => [...prev, nq]);
    if (linkedBkId) {
      // nothing to change in bookings state here (parent handles)
    }
    setCustName(''); setCustPhone(''); setItems([emptyItem()]); setLinkedBkId(''); setDiscountVal(0);
    setShowForm(false);
    showToast(asDraft ? 'Quotation saved as draft.' : `Quotation ${nq.id} sent to ${nq.customerName}!`);
  };

  const handleUpdateStatus = (id: string, status: Quotation['status']) => {
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    showToast('Quotation status updated.');
  };

  const statusColors: Record<Quotation['status'], string> = {
    draft: '#64748b', sent: '#2563eb', accepted: '#22c55e', rejected: '#ef4444', expired: '#6b7280',
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-black text-white">Quotations</h2>
          <p className="text-slate-500 text-sm mt-1">Generate professional quotes for customers before booking confirmation.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? '✕ Close' : '+ New Quotation'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['draft', 'sent', 'accepted', 'rejected'].map(s => {
          const count = myQuotations.filter(q => q.status === s).length;
          const value = myQuotations.filter(q => q.status === s).reduce((sum, q) => sum + q.total, 0);
          return (
            <div key={s} className="admin-card" style={{ borderTop: `2px solid ${statusColors[s as Quotation['status']]}` }}>
              <p className="text-[10px] text-slate-500 uppercase font-bold capitalize">{s}</p>
              <p className="text-2xl font-black mt-1" style={{ color: statusColors[s as Quotation['status']] }}>{count}</p>
              <p className="text-xs text-slate-600 mt-1">₹{value.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      {/* Create form */}
      {showForm && (
        <form className="admin-card space-y-5" onSubmit={e => handleCreate(e, false)}>
          <p className="section-title">New Quotation</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Customer Name *</label>
              <input className="form-input" value={custName} onChange={e => setCustName(e.target.value)} required placeholder="Ravi Kumar" />
            </div>
            <div>
              <label className="form-label">Customer Phone</label>
              <input className="form-input" value={custPhone} onChange={e => setCustPhone(e.target.value)} placeholder="9876543210" />
            </div>
            <div>
              <label className="form-label">Link to Booking (optional)</label>
              <select className="form-input" value={linkedBkId} onChange={e => {
                setLinkedBkId(e.target.value);
                const bk = myBookings.find(b => b.id === e.target.value);
                if (bk) setCustName(bk.customerName);
              }}>
                <option value="">None</option>
                {myBookings.map(b => <option key={b.id} value={b.id}>{b.id} — {b.customerName}</option>)}
              </select>
            </div>
          </div>

          {/* Predefined Switchgear Templates Selector */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">⚡ Predefined Switchgear Presets</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'APFC Capacitor Panel (100 kVAr)', desc: '100 kVAr steel automatic capacitor panel with harmonized controller', price: 65000 },
                { label: '11KV Vacuum Circuit Breaker (VCB)', desc: '630A VCB switchgear engineering supply & testing', price: 45000 },
                { label: '250 KVA Copper Transformer', desc: 'Outdoor copper wound distribution transformer fitting & oil filtration', price: 180000 },
                { label: 'Substation Pole Fitting & Assembly', desc: '11KV pole structures assembly, lightning arresters & cable termination', price: 250000 },
                { label: '95 sq.mm Aluminium Armoured Cable (100m)', desc: 'Cable trench laying, glands termination and trial tests', price: 12000 }
              ].map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const newItem = { description: tpl.label, quantity: 1, unitPrice: tpl.price, amount: tpl.price };
                    setItems(prev => {
                      const list = prev.filter(it => it.description || it.unitPrice > 0);
                      return [...list, newItem];
                    });
                    setNotes(prev => `${prev}\n- Includes: ${tpl.desc}.`);
                    showToast(`Loaded Preset: ${tpl.label}`);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] font-bold text-slate-300 bg-slate-950 hover:bg-slate-900 hover:border-slate-700 transition-all"
                >
                  ➕ {tpl.label} (₹{tpl.price.toLocaleString()})
                </button>
              ))}
            </div>
          </div>

          {/* Line items */}
          <div>
            <p className="form-label mb-2">Line Items</p>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[10px] text-slate-500 uppercase font-bold px-1">
                <span className="col-span-5">Description</span>
                <span className="col-span-2">Qty</span>
                <span className="col-span-2">Unit Price (₹)</span>
                <span className="col-span-2">Amount (₹)</span>
                <span className="col-span-1"></span>
              </div>
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input className="form-input col-span-5" placeholder="e.g. Labour charges" value={it.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                  <input className="form-input col-span-2" type="number" min={1} value={it.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} />
                  <input className="form-input col-span-2" type="number" min={0} value={it.unitPrice} onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))} />
                  <div className="col-span-2 text-right font-bold text-white">₹{it.amount.toLocaleString()}</div>
                  <button type="button" onClick={() => setItems(prev => prev.filter((_, j) => j !== i))} className="col-span-1 text-slate-600 hover:text-red-400 transition-colors text-lg leading-none">×</button>
                </div>
              ))}
              <button type="button" onClick={() => setItems(prev => [...prev, emptyItem()])} className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ color: primaryColor, background: primaryColor + '15' }}>
                + Add Line Item
              </button>
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="form-label">GST Rate (%)</label>
                <select className="form-input" value={taxPct} onChange={e => setTaxPct(Number(e.target.value))}>
                  {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Discount (₹)</label>
                <input className="form-input" type="number" value={discountVal} onChange={e => setDiscountVal(Number(e.target.value))} />
              </div>
              <div>
                <label className="form-label">Valid for (days)</label>
                <input className="form-input" type="number" value={validDays} onChange={e => setValidDays(Number(e.target.value))} />
              </div>
              <div>
                <label className="form-label">Notes</label>
                <textarea className="form-input resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-5 space-y-3">
              <p className="section-title">Summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-slate-400"><span>GST ({taxPct}%)</span><span>₹{taxAmount.toLocaleString()}</span></div>
                {discountVal > 0 && <div className="flex justify-between text-emerald-400"><span>Discount</span><span>-₹{discountVal.toLocaleString()}</span></div>}
                <div className="border-t border-slate-700 pt-2 flex justify-between font-black text-white text-lg">
                  <span>Total</span><span style={{ color: primaryColor }}>₹{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary">📤 Create & Send Quotation</button>
            <button type="button" onClick={e => handleCreate(e, true)} className="btn-secondary">💾 Save as Draft</button>
          </div>
        </form>
      )}

      {/* Quotations list */}
      <div className="admin-card overflow-hidden p-0">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <p className="section-title">All Quotations ({myQuotations.length})</p>
          <p className="text-sm text-slate-500">Total value: <strong className="text-white">₹{myQuotations.filter(q => q.status === 'accepted').reduce((s, q) => s + q.total, 0).toLocaleString()}</strong> accepted</p>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Valid (days)</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {myQuotations.map(q => (
              <tr key={q.id}>
                <td className="font-mono text-xs text-slate-500">{q.id}</td>
                <td>
                  <p className="font-bold text-white">{q.customerName}</p>
                  <p className="text-xs text-slate-500">{q.customerPhone}</p>
                </td>
                <td className="text-slate-400 text-xs">{q.items.length} item{q.items.length !== 1 ? 's' : ''}</td>
                <td className="font-black text-white">₹{q.total.toLocaleString()}</td>
                <td className="text-slate-400">{q.validDays} days</td>
                <td>
                  <span className="badge" style={{ color: statusColors[q.status], background: statusColors[q.status] + '20', border: `1px solid ${statusColors[q.status]}40` }}>{q.status}</span>
                </td>
                <td className="flex gap-2">
                  <button onClick={() => setPreviewQ(q)} className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded" style={{ color: primaryColor, background: primaryColor + '20' }}>
                    <Eye className="w-3 h-3" /> View
                  </button>
                  {q.status === 'sent' && (
                    <>
                      <button onClick={() => handleUpdateStatus(q.id, 'accepted')} className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        <CheckCircle className="w-3 h-3" /> Accept
                      </button>
                      <button onClick={() => handleUpdateStatus(q.id, 'rejected')} className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-red-950 text-red-400 border border-red-800">
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    </>
                  )}
                  {q.status === 'draft' && (
                    <button onClick={() => handleUpdateStatus(q.id, 'sent')} className="text-xs font-bold px-2 py-1 rounded bg-blue-950 text-blue-400 border border-blue-800">
                      📤 Send
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {myQuotations.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-8">No quotations yet. Click "+ New Quotation" to create one.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Preview modal */}
      {previewQ && (
        <div className="modal-overlay" onClick={() => setPreviewQ(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-8 space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-900">{tenantName}</p>
                  <p className="text-slate-500 text-sm mt-0.5">{tenantPhone}</p>
                  {tenantGst && <p className="text-slate-400 text-xs mt-0.5">GST: {tenantGst}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase font-bold">Quotation</p>
                  <p className="text-2xl font-black" style={{ color: primaryColor }}>{previewQ.id}</p>
                  <p className="text-xs text-slate-500">Valid for {previewQ.validDays} days</p>
                </div>
              </div>

              <div className="border-t border-b border-slate-200 py-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">Bill To</p>
                  <p className="font-bold text-slate-900 mt-1">{previewQ.customerName}</p>
                  <p className="text-slate-500 text-sm">{previewQ.customerPhone}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase font-bold">Date</p>
                  <p className="font-semibold text-slate-700 mt-1">{new Date(previewQ.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 text-slate-500 font-bold text-xs uppercase">Description</th>
                    <th className="text-center py-2 text-slate-500 font-bold text-xs uppercase">Qty</th>
                    <th className="text-right py-2 text-slate-500 font-bold text-xs uppercase">Unit Price</th>
                    <th className="text-right py-2 text-slate-500 font-bold text-xs uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {previewQ.items.map((it, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-3 text-slate-800 font-semibold">{it.description}</td>
                      <td className="py-3 text-center text-slate-600">{it.quantity}</td>
                      <td className="py-3 text-right text-slate-600">₹{it.unitPrice.toLocaleString()}</td>
                      <td className="py-3 text-right font-bold text-slate-900">₹{it.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="space-y-2 w-56 text-sm">
                  <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>₹{previewQ.subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-500"><span>GST (18%)</span><span>₹{previewQ.tax.toLocaleString()}</span></div>
                  {previewQ.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-₹{previewQ.discount.toLocaleString()}</span></div>}
                  <div className="flex justify-between font-black text-lg border-t border-slate-200 pt-2" style={{ color: primaryColor }}>
                    <span>Total</span><span>₹{previewQ.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {previewQ.notes && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Terms & Notes</p>
                  <p className="text-sm text-slate-600">{previewQ.notes}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2 print:hidden">
                <button className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-blue-600" onClick={() => window.print()}>
                  🖨️ Print / Save PDF
                </button>
                <button className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ background: primaryColor }} onClick={() => { showToast('Quotation sent via WhatsApp!'); setPreviewQ(null); }}>
                  📱 Send via WhatsApp
                </button>
                <button className="btn-secondary flex-1 text-sm" onClick={() => setPreviewQ(null)}>Close</button>
              </div>

              {/* Print Media style blocks overrides */}
              <style>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  .modal-overlay, .modal-overlay * {
                    visibility: visible;
                  }
                  .modal-overlay {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    background: white !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    border: none !important;
                  }
                  .print\\:hidden {
                    display: none !important;
                  }
                }
              `}</style>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
