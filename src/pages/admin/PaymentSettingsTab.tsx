import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Power,
  Layers,
  ExternalLink
} from 'lucide-react';
import { api } from '../../utils/api';

interface PaymentSettingsTabProps {
  tenantId: string;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  primaryColor: string;
}

export const PaymentSettingsTab: React.FC<PaymentSettingsTabProps> = ({
  tenantId,
  showToast,
  primaryColor
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [gatewayConfig, setGatewayConfig] = useState<any>(null);

  // Connect Modal States
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [envMode, setEnvMode] = useState<'test' | 'live'>('test');
  const [keyId, setKeyId] = useState<string>('');
  const [keySecret, setKeySecret] = useState<string>('');
  const [webhookSecret, setWebhookSecret] = useState<string>('');
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [isRoute, setIsRoute] = useState<boolean>(false);
  const [accountId, setAccountId] = useState<string>('');

  // Testing & Saving States
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [savingGateway, setSavingGateway] = useState<boolean>(false);

  // Live Mode Warning Modal
  const [showLiveWarningModal, setShowLiveWarningModal] = useState<boolean>(false);
  const [switchingMode, setSwitchingMode] = useState<boolean>(false);
  const [togglingGateway, setTogglingGateway] = useState<boolean>(false);

  // Fetch Gateway Configuration
  const loadGatewayConfig = async () => {
    try {
      setLoading(true);
      const res = await api.getPaymentGatewayConfig('razorpay');
      if (res && res.data) {
        setGatewayConfig(res.data);
        setEnvMode(res.data.mode || 'test');
        setIsRoute(res.data.accountType === 'route');
        setAccountId(res.data.accountId || '');
      }
    } catch (err: any) {
      console.error('Error loading payment gateway config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGatewayConfig();
  }, [tenantId]);

  // Handle Test Connection
  const handleTestConnection = async () => {
    if (!keyId.trim() || !keySecret.trim()) {
      showToast('Please enter both Key ID and Key Secret', 'error');
      return;
    }

    try {
      setTestingConnection(true);
      setTestStatus('idle');
      setTestMessage('');

      const res = await api.testRazorpayConnection({
        keyId: keyId.trim(),
        keySecret: keySecret.trim(),
        mode: envMode
      });

      if (res && res.data && res.data.success) {
        setTestStatus('success');
        setTestMessage(res.data.message || 'Razorpay connected successfully');
        showToast('✓ Razorpay connection verified successfully!', 'success');
      } else {
        setTestStatus('failed');
        setTestMessage(res?.data?.message || 'Connection validation failed');
        showToast(res?.data?.message || 'Connection failed', 'error');
      }
    } catch (err: any) {
      setTestStatus('failed');
      const msg = err.response?.data?.message || err.message || 'Connection test failed';
      setTestMessage(msg);
      showToast(msg, 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  // Handle Save & Connect
  const handleSaveAndConnect = async () => {
    if (testStatus !== 'success') {
      showToast('Please validate connection successfully before saving', 'error');
      return;
    }

    try {
      setSavingGateway(true);
      const res = await api.connectRazorpayGateway({
        mode: envMode,
        keyId: keyId.trim(),
        keySecret: keySecret.trim(),
        webhookSecret: webhookSecret.trim() || undefined,
        accountType: isRoute ? 'route' : 'standard',
        accountId: isRoute && accountId.trim() ? accountId.trim() : undefined
      });

      if (res && res.data) {
        setGatewayConfig(res.data);
        setShowConnectModal(false);
        setKeySecret('');
        showToast('🎉 Razorpay Payment Gateway connected & enabled!', 'success');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save gateway';
      showToast(msg, 'error');
    } finally {
      setSavingGateway(false);
    }
  };

  // Handle Mode Switch (Test <-> Live)
  const handleSwitchMode = async (targetMode: 'test' | 'live') => {
    if (targetMode === 'live' && !showLiveWarningModal) {
      setShowLiveWarningModal(true);
      return;
    }

    try {
      setSwitchingMode(true);
      const res = await api.switchPaymentGatewayMode(targetMode);
      if (res && res.data) {
        setGatewayConfig(res.data);
        setShowLiveWarningModal(false);
        showToast(`Gateway switched to ${targetMode.toUpperCase()} mode!`, 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to switch mode', 'error');
    } finally {
      setSwitchingMode(false);
    }
  };

  // Handle Enable / Disable Toggle
  const handleToggleGateway = async () => {
    if (!gatewayConfig) return;
    const newEnabled = !gatewayConfig.enabled;

    try {
      setTogglingGateway(true);
      const res = await api.togglePaymentGateway(newEnabled);
      if (res && res.data) {
        setGatewayConfig(res.data);
        showToast(`Razorpay gateway ${newEnabled ? 'enabled' : 'disabled'}!`, 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update gateway status', 'error');
    } finally {
      setTogglingGateway(false);
    }
  };

  const isConnected = gatewayConfig?.connectionStatus === 'connected';
  const isFailed = gatewayConfig?.connectionStatus === 'failed';
  const isLive = gatewayConfig?.mode === 'live';
  const isEnabled = gatewayConfig?.enabled;

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-slate-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-white">Payment Settlement Configuration</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure automated customer checkout, UPI, cards, and direct merchant settlements.
          </p>
        </div>

        {/* Global Webhook Endpoint Info */}
        <div className="text-right bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Production Webhook URL</p>
          <p className="text-xs font-mono font-bold text-blue-400 mt-0.5">/api/webhooks/razorpay</p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
          <p className="text-xs font-medium">Loading payment gateway credentials...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Razorpay Gateway Card */}
          <div className="lg:col-span-2 admin-card space-y-6 relative overflow-hidden">
            {/* Background Glow */}
            <div
              className="absolute -top-24 -right-24 w-60 h-60 rounded-full opacity-10 blur-3xl pointer-events-none"
              style={{ backgroundColor: primaryColor }}
            />

            {/* Card Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-5 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 font-black text-white text-lg">
                  R
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">Razorpay Payment Gateway</h3>
                    {isConnected ? (
                      <span className="badge badge-completed flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> CONNECTED
                      </span>
                    ) : isFailed ? (
                      <span className="badge badge-cancelled flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> CONNECTION FAILED
                      </span>
                    ) : (
                      <span className="badge badge-pending">NOT CONNECTED</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Accept UPI, Credit/Debit Cards, Net Banking, and Mobile Wallets
                  </p>
                </div>
              </div>

              {/* Mode Badges */}
              {isConnected && (
                <div className="flex items-center gap-2">
                  {isLive ? (
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      LIVE PAYMENTS ENABLED
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      TEST MODE
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Gateway Details & Credentials State */}
            {!isConnected ? (
              <div className="bg-slate-900/60 border border-dashed border-slate-800 p-6 rounded-2xl text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Razorpay is not yet connected</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Connect your Razorpay API Key ID and Key Secret to enable customer payments on your website. Test mode keys are free and instant.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTestStatus('idle');
                    setTestMessage('');
                    setShowConnectModal(true);
                  }}
                  className="btn btn-primary px-6 py-2.5 text-xs font-bold inline-flex items-center gap-2 shadow-lg"
                  style={{ background: primaryColor }}
                >
                  <Zap className="w-4 h-4" /> Connect Razorpay
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Credentials Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-850">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Key ID</span>
                    <p className="font-mono text-xs font-bold text-slate-200 mt-0.5">{gatewayConfig.maskedKeyId}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Key Secret</span>
                    <p className="font-mono text-xs font-bold text-slate-400 mt-0.5">{gatewayConfig.maskedSecret}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Webhook Status</span>
                    <p className="text-xs font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {gatewayConfig.hasWebhookSecret ? 'HMAC Verified Active' : 'Active (Standard)'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Settlement Route</span>
                    <p className="text-xs font-bold text-slate-200 mt-0.5">
                      {gatewayConfig.accountType === 'route'
                        ? `Marketplace Route (${gatewayConfig.accountId || 'Linked'})`
                        : 'Direct Merchant Settlement'}
                    </p>
                  </div>
                </div>

                {/* Gateway Control Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    {/* Mode Toggle Button */}
                    {isLive ? (
                      <button
                        type="button"
                        onClick={() => handleSwitchMode('test')}
                        disabled={switchingMode}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700 flex items-center gap-1.5"
                      >
                        Switch to Test Mode
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSwitchMode('live')}
                        disabled={switchingMode}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 transition-all border border-rose-800/60 flex items-center gap-1.5"
                      >
                        🔴 Switch to Live Mode
                      </button>
                    )}

                    {/* Enable / Disable Gateway Toggle */}
                    <button
                      type="button"
                      onClick={handleToggleGateway}
                      disabled={togglingGateway}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                        isEnabled
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/60'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      {isEnabled ? 'Disable Gateway' : 'Enable Gateway'}
                    </button>
                  </div>

                  {/* Reconfigure Credentials */}
                  <button
                    type="button"
                    onClick={() => {
                      setTestStatus('idle');
                      setTestMessage('');
                      setShowConnectModal(true);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition-all border border-blue-500/30 flex items-center gap-1.5"
                  >
                    Configure Credentials
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Payment Settlement Guide & Features */}
          <div className="admin-card space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" /> Supported Settlement Rails
            </h3>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-850">
                <span className="text-lg">📱</span>
                <div>
                  <p className="font-bold text-white">UPI QR & Apps</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Google Pay, PhonePe, Paytm, and BHIM QR codes.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-850">
                <span className="text-lg">💳</span>
                <div>
                  <p className="font-bold text-white">Cards & EMI</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Visa, Mastercard, RuPay, Amex, and Cardless EMI.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-850">
                <span className="text-lg">🏦</span>
                <div>
                  <p className="font-bold text-white">Net Banking & Wallets</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">50+ Indian banks, Amazon Pay, Mobikwik, and Freecharge.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <a
                href="https://dashboard.razorpay.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 font-bold inline-flex items-center gap-1.5 hover:underline"
              >
                Open Razorpay Merchant Dashboard <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONNECT RAZORPAY MODAL
          ========================================================================= */}
      {showConnectModal && (
        <div className="modal-overlay z-50 p-4" onClick={() => setShowConnectModal(false)}>
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[#0f172a] rounded-3xl w-full max-w-lg p-6 sm:p-7 border border-slate-700/80 text-white shadow-2xl animate-scaleIn font-sans text-left space-y-5"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Payment Gateway Setup
                </span>
                <h3 className="text-lg font-black text-white mt-1.5">Connect Razorpay</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter your API credentials from your Razorpay Dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Environment Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Environment</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEnvMode('test')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    envMode === 'test'
                      ? 'border-blue-500 bg-blue-950/30 text-white'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={envMode === 'test'}
                      onChange={() => setEnvMode('test')}
                      className="accent-blue-500"
                    />
                    <span className="text-xs font-bold text-white">Test Mode</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 pl-5">For staging & mock transactions (rzp_test_...)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setEnvMode('live')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    envMode === 'live'
                      ? 'border-rose-500 bg-rose-950/30 text-white'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={envMode === 'live'}
                      onChange={() => setEnvMode('live')}
                      className="accent-rose-500"
                    />
                    <span className="text-xs font-bold text-white">Live Mode</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 pl-5">Real customer settlements (rzp_live_...)</p>
                </button>
              </div>
            </div>

            {/* Credential Inputs */}
            <div className="space-y-3.5">
              <div>
                <label className="form-label text-xs">
                  Razorpay Key ID <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  className="form-input text-xs font-mono"
                  placeholder={envMode === 'test' ? 'rzp_test_1DP5mmOlF5G5ag' : 'rzp_live_xxxxxxxxxxxxxx'}
                  value={keyId}
                  onChange={e => {
                    setKeyId(e.target.value);
                    setTestStatus('idle');
                  }}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="form-label text-xs mb-0">
                    Razorpay Key Secret <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-bold"
                  >
                    {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showSecret ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showSecret ? 'text' : 'password'}
                  className="form-input text-xs font-mono"
                  placeholder="Enter your secret key"
                  value={keySecret}
                  onChange={e => {
                    setKeySecret(e.target.value);
                    setTestStatus('idle');
                  }}
                />
              </div>

              <div>
                <label className="form-label text-xs">
                  Webhook Secret <span className="text-slate-500">(Optional for raw HMAC validation)</span>
                </label>
                <input
                  type="password"
                  className="form-input text-xs font-mono"
                  placeholder="Enter webhook secret token"
                  value={webhookSecret}
                  onChange={e => setWebhookSecret(e.target.value)}
                />
              </div>

              {/* Razorpay Route / Linked Account Option */}
              <div className="pt-2 border-t border-slate-800/80">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRoute}
                    onChange={e => setIsRoute(e.target.checked)}
                    className="accent-blue-500 rounded"
                  />
                  <span className="text-xs font-bold text-slate-300">
                    Marketplace Settlement (Razorpay Route / Linked Account)
                  </span>
                </label>

                {isRoute && (
                  <div className="mt-2 pl-6">
                    <label className="form-label text-xs">Linked Account ID</label>
                    <input
                      type="text"
                      className="form-input text-xs font-mono"
                      placeholder="acc_xxxxxxxxxxxxxx"
                      value={accountId}
                      onChange={e => setAccountId(e.target.value)}
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Customer payments will automatically transfer to this merchant account upon capture.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Test Connection Feedback Banner */}
            {testStatus === 'success' && (
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>✓ {testMessage || 'Razorpay connected successfully'}</span>
              </div>
            )}

            {testStatus === 'failed' && (
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-bold flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{testMessage}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection || !keyId.trim() || !keySecret.trim()}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all border border-slate-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {testingConnection ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    Testing Connection...
                  </>
                ) : (
                  'Test Connection'
                )}
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndConnect}
                  disabled={savingGateway || testStatus !== 'success'}
                  className="w-full sm:w-auto btn btn-primary px-5 py-2.5 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                  style={{ background: primaryColor }}
                >
                  {savingGateway ? 'Saving...' : 'Save & Enable'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          LIVE MODE CONFIRMATION WARNING MODAL
          ========================================================================= */}
      {showLiveWarningModal && (
        <div className="modal-overlay z-50 p-4" onClick={() => setShowLiveWarningModal(false)}>
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[#0f172a] rounded-3xl w-full max-w-md p-6 sm:p-7 border border-rose-700/80 text-white shadow-2xl animate-scaleIn font-sans text-left space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-white">Enable Live Payments Mode?</h3>
              <p className="text-xs text-rose-300 font-bold mt-2 bg-rose-950/50 p-3 rounded-xl border border-rose-900/80">
                ⚠️ You are using Live Razorpay payments. Real money will be processed from customer bank accounts.
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Make sure you have entered valid production (rzp_live_) credentials before switching.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowLiveWarningModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode('live')}
                disabled={switchingMode}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-lg shadow-rose-600/30"
              >
                {switchingMode ? 'Switching...' : 'Confirm & Enable Live Mode'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
