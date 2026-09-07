import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Filter,
  RefreshCw,
  FileText,
  Printer
} from 'lucide-react';
import { api } from '../../utils/api';

interface InvoicesLedgerTabProps {
  tenantId: string;
  tenantName: string;
  tenantGst?: string;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  primaryColor: string;
}

export const InvoicesLedgerTab: React.FC<InvoicesLedgerTabProps> = ({
  tenantId,
  tenantName,
  tenantGst,
  showToast,
  primaryColor
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [_totalCount, setTotalCount] = useState<number>(0);
  const [stats, setStats] = useState<any>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Selected Invoice for Modal View
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Fetch Invoices & Stats
  const fetchLedger = async () => {
    try {
      setLoading(true);

      const [invoicesRes, statsRes] = await Promise.all([
        api.getInvoicesLedger({
          search: searchTerm.trim() || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          paymentMethod: methodFilter !== 'all' ? methodFilter : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        }),
        api.getPaymentStats()
      ]);

      if (invoicesRes && invoicesRes.data) {
        setInvoices(invoicesRes.data.invoices || []);
        setTotalCount(invoicesRes.data.totalCount || 0);
      }
      if (statsRes && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err: any) {
      console.error('Error loading invoices ledger:', err);
      showToast('Failed to load invoices ledger', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [tenantId, statusFilter, methodFilter, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLedger();
  };

  // Helper: Print or Download Invoice
  const handlePrintInvoice = (inv: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Please allow popups to print invoices', 'error');
      return;
    }

    const items = inv.metadata?.items || [
      { name: 'Professional Service Fulfillment', price: inv.amount - (inv.tax || 0), quantity: 1 }
    ];

    const subtotal = inv.amount - (inv.tax || 0);
    const tax = inv.tax || 0;
    const total = inv.amount;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tax Invoice - ${inv.invoiceNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 40px; margin: 0; }
            .invoice-box { max-width: 800px; margin: auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 12px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
            .company { font-size: 24px; font-weight: 900; color: #0f172a; }
            .inv-meta { text-align: right; }
            .inv-title { font-size: 20px; font-weight: 800; color: #2563eb; }
            .details { display: flex; justify-content: space-between; margin: 30px 0; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th { background: #f1f5f9; padding: 10px; text-align: left; font-size: 12px; font-weight: bold; border-bottom: 1px solid #cbd5e1; }
            .table td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .totals { float: right; width: 300px; margin-top: 20px; }
            .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
            .total-final { font-size: 16px; font-weight: 900; color: #0f172a; border-top: 2px solid #e2e8f0; padding-top: 10px; }
            .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            @media print { body { padding: 0; } .invoice-box { border: none; } }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div>
                <div class="company">${tenantName}</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Official Tax Invoice</div>
                ${tenantGst ? `<div style="font-size: 11px; color: #64748b;">GSTIN: ${tenantGst}</div>` : ''}
              </div>
              <div class="inv-meta">
                <div class="inv-title">TAX INVOICE</div>
                <div style="font-size: 12px; font-weight: bold; margin-top: 4px;">#${inv.invoiceNumber}</div>
                <div style="font-size: 11px; color: #64748b;">Date: ${new Date(inv.createdAt).toLocaleDateString()}</div>
                <div style="font-size: 11px; color: #16a34a; font-weight: bold; margin-top: 4px;">STATUS: PAID (Razorpay)</div>
              </div>
            </div>

            <div class="details">
              <div>
                <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">Billed To:</div>
                <div style="font-weight: bold; font-size: 14px; margin-top: 4px;">${inv.customerName}</div>
                ${inv.customerEmail ? `<div style="font-size: 12px; color: #64748b;">${inv.customerEmail}</div>` : ''}
                ${inv.customerPhone ? `<div style="font-size: 12px; color: #64748b;">${inv.customerPhone}</div>` : ''}
              </div>
              <div style="text-align: right;">
                <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">Payment Details:</div>
                <div style="font-size: 12px; margin-top: 4px;">Gateway: <strong>Razorpay</strong></div>
                <div style="font-size: 12px;">Method: <strong>${inv.paymentMethod || 'UPI / Online'}</strong></div>
                <div style="font-size: 11px; color: #64748b; font-family: monospace;">Payment ID: ${inv.payment?.razorpayPaymentId || inv.paymentId || 'N/A'}</div>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item: any) => `
                  <tr>
                    <td><strong>${item.name}</strong></td>
                    <td style="text-align: center;">${item.quantity || 1}</td>
                    <td style="text-align: right;">₹${Number(item.price).toLocaleString()}</td>
                    <td style="text-align: right;">₹${(Number(item.price) * (item.quantity || 1)).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals">
              <div class="totals-row"><span>Subtotal:</span><span>₹${subtotal.toLocaleString()}</span></div>
              <div class="totals-row"><span>GST Tax (18%):</span><span>₹${tax.toLocaleString()}</span></div>
              <div class="totals-row total-final"><span>Total Paid:</span><span>₹${total.toLocaleString()}</span></div>
            </div>
            <div style="clear: both;"></div>

            <div class="footer">
              <p>Thank you for your business! This is a computer-generated tax invoice verified via Razorpay.</p>
              <p>© ${new Date().getFullYear()} ${tenantName}. All rights reserved.</p>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-slate-200">
      {/* ── Financial Stats Header ───────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="admin-card p-4 space-y-1 bg-slate-900 border-slate-800">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Today's Revenue</p>
          <p className="text-base font-black text-emerald-400">₹{(stats?.todayRevenue || 0).toLocaleString()}</p>
          <span className="text-[9px] text-slate-500 font-medium">Real-time daily total</span>
        </div>

        <div className="admin-card p-4 space-y-1 bg-slate-900 border-slate-800">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Revenue</p>
          <p className="text-base font-black text-white">₹{(stats?.totalRevenue || 0).toLocaleString()}</p>
          <span className="text-[9px] text-slate-500 font-medium">All verified checkouts</span>
        </div>

        <div className="admin-card p-4 space-y-1 bg-slate-900 border-slate-800">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Successful</p>
          <p className="text-base font-black text-blue-400">{stats?.successfulPayments || 0}</p>
          <span className="text-[9px] text-emerald-400 font-medium">Captured payments</span>
        </div>

        <div className="admin-card p-4 space-y-1 bg-slate-900 border-slate-800">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending</p>
          <p className="text-base font-black text-amber-400">{stats?.pendingPayments || 0}</p>
          <span className="text-[9px] text-slate-500 font-medium">Awaiting checkout</span>
        </div>

        <div className="admin-card p-4 space-y-1 bg-slate-900 border-slate-800">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Failed</p>
          <p className="text-base font-black text-rose-400">{stats?.failedPayments || 0}</p>
          <span className="text-[9px] text-slate-500 font-medium">Declined / Timeout</span>
        </div>

        <div className="admin-card p-4 space-y-1 bg-slate-900 border-slate-800">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Refunds</p>
          <p className="text-base font-black text-purple-400">₹{(stats?.refundedAmount || 0).toLocaleString()}</p>
          <span className="text-[9px] text-slate-500 font-medium">{stats?.refundsCount || 0} refunds</span>
        </div>
      </div>

      {/* ── Search & Filter Controls ─────────────────────── */}
      <div className="admin-card p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              className="form-input text-xs pl-9"
              placeholder="Search by invoice #, customer name, phone, order number, or payment ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="form-input text-xs py-2 w-auto"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Payment Statuses</option>
              <option value="success">Paid / Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            <select
              className="form-input text-xs py-2 w-auto"
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
            >
              <option value="all">All Methods</option>
              <option value="upi">UPI / QR</option>
              <option value="card">Card</option>
              <option value="netbanking">Net Banking</option>
              <option value="wallet">Wallet</option>
            </select>

            <button
              type="submit"
              className="btn btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
              style={{ background: primaryColor }}
            >
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>

            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setMethodFilter('all');
                setStartDate('');
                setEndDate('');
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold"
              title="Reset Filters"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* ── Invoices Ledger Table ────────────────────────── */}
      <div className="admin-card overflow-hidden p-0 border border-slate-800">
        <div className="overflow-x-auto">
          <table className="data-table text-xs w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4">Order / Payment ID</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Gateway</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-400 mb-2" />
                    Loading invoices ledger...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-bold text-white text-xs">No invoices found</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Invoices are automatically generated when customers complete checkout via Razorpay.
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.map(inv => {
                  const isPaid = inv.paymentStatus === 'SUCCESS';
                  const isPending = inv.paymentStatus === 'PENDING';
                  const isFailed = inv.paymentStatus === 'FAILED';
                  const isRefunded = inv.paymentStatus === 'REFUNDED';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-900/50 transition-colors">
                      {/* Invoice Prefix */}
                      <td className="py-3 px-4 font-mono font-bold text-blue-400 text-xs">
                        {inv.invoiceNumber}
                      </td>

                      {/* Customer Details */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-white text-xs">{inv.customerName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {inv.customerPhone || inv.customerEmail || 'Direct Checkout'}
                        </p>
                      </td>

                      {/* Order & Payment ID */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <p className="text-slate-300 font-bold">
                          {inv.order?.orderNumber ? `#${inv.order.orderNumber}` : 'N/A'}
                        </p>
                        <p className="text-slate-500 text-[10px] truncate max-w-[140px]">
                          {inv.payment?.razorpayPaymentId || inv.paymentId || 'Pending ID'}
                        </p>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4">
                        <p className="font-black text-white text-xs">₹{inv.amount.toLocaleString()}</p>
                        {inv.tax > 0 && (
                          <p className="text-[9px] text-slate-500">Incl. ₹{inv.tax.toLocaleString()} GST</p>
                        )}
                      </td>

                      {/* Gateway */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                          Razorpay
                        </span>
                      </td>

                      {/* Method */}
                      <td className="py-3 px-4">
                        <span className="text-xs font-medium text-slate-300">
                          {inv.paymentMethod || 'UPI'}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-4">
                        {isPaid && <span className="badge badge-completed">PAID</span>}
                        {isPending && <span className="badge badge-pending">PENDING</span>}
                        {isFailed && <span className="badge badge-cancelled">FAILED</span>}
                        {isRefunded && <span className="badge badge-cancelled">REFUNDED</span>}
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(inv)}
                            className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-700"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrintInvoice(inv)}
                            className="text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-950/40 hover:bg-blue-900/50 px-2.5 py-1.5 rounded-lg border border-blue-800/60 flex items-center gap-1"
                            title="Print / Save PDF"
                          >
                            <Download className="w-3 h-3" /> PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── View Invoice Modal ────────────────────────────── */}
      {selectedInvoice && (
        <div className="modal-overlay z-50 p-4" onClick={() => setSelectedInvoice(null)}>
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[#0f172a] rounded-3xl w-full max-w-xl p-6 sm:p-7 border border-slate-700/80 text-white shadow-2xl animate-scaleIn font-sans text-left space-y-5"
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Verified Payment Receipt
                </span>
                <h3 className="text-lg font-black text-white mt-1.5">Invoice #{selectedInvoice.invoiceNumber}</h3>
                <p className="text-xs text-slate-400">
                  Generated on {new Date(selectedInvoice.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Customer & Payment Meta */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-850 text-xs">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Customer</p>
                <p className="font-bold text-white mt-0.5">{selectedInvoice.customerName}</p>
                <p className="text-slate-400 text-[11px]">{selectedInvoice.customerPhone}</p>
                <p className="text-slate-400 text-[11px]">{selectedInvoice.customerEmail}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Transaction Info</p>
                <p className="text-slate-300 mt-0.5">Gateway: <strong>Razorpay</strong></p>
                <p className="text-slate-300">Method: <strong>{selectedInvoice.paymentMethod || 'UPI'}</strong></p>
                <p className="text-slate-500 text-[10px] font-mono mt-0.5 truncate">
                  Payment ID: {selectedInvoice.payment?.razorpayPaymentId || selectedInvoice.paymentId}
                </p>
              </div>
            </div>

            {/* Price Summary */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>₹{(selectedInvoice.amount - (selectedInvoice.tax || 0)).toLocaleString()}</span>
              </div>
              {selectedInvoice.tax > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>GST Tax (18%)</span>
                  <span>₹{selectedInvoice.tax.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-white border-t border-slate-800 pt-2">
                <span>Total Amount Paid</span>
                <span className="text-emerald-400 font-mono">₹{selectedInvoice.amount.toLocaleString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handlePrintInvoice(selectedInvoice)}
                className="btn btn-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5 shadow-lg"
                style={{ background: primaryColor }}
              >
                <Printer className="w-3.5 h-3.5" /> Print / Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
