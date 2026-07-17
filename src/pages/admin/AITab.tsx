import { useState, useRef, useEffect } from 'react';
import type { Tenant, Service } from '../../types';

interface Props {
  tenant: Tenant;
  services: Service[];
  primaryColor: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  level?: 1 | 2 | 3;
}

// Intent patterns → handler
interface Intent {
  patterns: RegExp[];
  level: 1 | 2 | 3;
  respond: (tenant: Tenant, services: Service[], query: string) => string;
}

const INTENTS: Intent[] = [
  {
    patterns: [/book|schedule|appointment|reserve/i],
    level: 1,
    respond: (t, services) => {
      const names = services.filter(s => s.tenantId === t.id && s.isActive).map(s => `• ${s.icon} ${s.name} — ₹${s.basePrice}`).join('\n');
      return `I can help you book a service! 🎯\n\nAvailable services:\n${names || '• No services configured yet'}\n\nPlease tell me which service you need, or call us at ${t.config.phone}.`;
    },
  },
  {
    patterns: [/cancel|cancellation|refund/i],
    level: 2,
    respond: (t) => `📋 **Cancellation Policy**\n\n${t.config.cancellationPolicy}\n\n**Refund Policy**\n${t.config.refundPolicy}`,
  },
  {
    patterns: [/hours|timing|open|close|working|time/i],
    level: 1,
    respond: (t) => `🕐 **Business Hours**\n\n${t.name} is open:\n${t.config.businessHours}\n\nFor emergency services, call ${t.config.phone} anytime.`,
  },
  {
    patterns: [/price|cost|rate|charge|fee|how much/i],
    level: 1,
    respond: (t, services) => {
      const active = services.filter(s => s.tenantId === t.id && s.isActive);
      const list = active.map(s => `${s.icon} ${s.name}: starts at ₹${s.basePrice}`).join('\n');
      return `💰 **Our Service Pricing**\n\n${list || 'Please contact us for pricing.'}\n\nFinal price may vary based on complexity and materials.`;
    },
  },
  {
    patterns: [/emergency|urgent|immediate|asap|fast|quick/i],
    level: 1,
    respond: (t) => `🚨 **Emergency Booking**\n\nYes! We offer emergency same-day service.\n\n📞 Call immediately: ${t.config.phone}\n💬 WhatsApp: +${t.config.whatsAppNumber}\n\nEmergency surcharge of ₹150–₹200 applies for priority slots.`,
  },
  {
    patterns: [/warranty|guarantee|quality/i],
    level: 2,
    respond: (t) => `🛡️ **Warranty & Quality Guarantee**\n\n${t.config.warrantyPolicy}\n\nAll our technicians are background-verified and professionally trained.`,
  },
  {
    patterns: [/contact|phone|whatsapp|call|address|location/i],
    level: 1,
    respond: (t) => `📞 **Contact ${t.name}**\n\n📱 Phone: ${t.config.phone}\n💬 WhatsApp: +${t.config.whatsAppNumber}\n📧 Email: ${t.config.email}\n📍 Address: ${t.config.address}, ${t.config.city}\n\n⏰ Hours: ${t.config.businessHours}`,
  },
  {
    patterns: [/recommend|suggest|which service|what service|best/i],
    level: 3,
    respond: (t, services) => {
      const popular = services.filter(s => s.tenantId === t.id && s.isActive).slice(0, 3);
      return `✨ **AI Recommendation**\n\nBased on our most booked services, I recommend:\n\n${popular.map((s, i) => `${i + 1}. ${s.icon} **${s.name}** — ₹${s.basePrice}\n   ${s.description}`).join('\n\n')}\n\nShall I help you book one of these?`;
    },
  },
  {
    patterns: [/quotation|quote|estimate|how to quote/i],
    level: 3,
    respond: (t, services) => {
      const s = services.find(sv => sv.tenantId === t.id && sv.isActive);
      return `📄 **Generate Quotation**\n\nI can draft a quotation for you! Here's a sample:\n\n**Customer**: [Name]\n**Service**: ${s?.name || 'Service Name'}\n**Base Price**: ₹${s?.basePrice || 0}\n**Labour**: ₹200–₹500\n**Material**: As applicable\n**GST (18%)**: Included\n\nGo to the Quotations section to create a formal PDF quotation for your customer.`;
    },
  },
  {
    patterns: [/gst|invoice|tax|bill/i],
    level: 2,
    respond: (t) => `🧾 **GST & Billing**\n\n${t.config.gstNumber ? `GST Registration: ${t.config.gstNumber}\nTax Rate: 18% GST applicable on all services.` : 'GST registration not configured yet. Go to Settings → Payments & Bank to add your GST number.'}\n\nInvoices are auto-generated after each completed booking.`,
  },
];

const DEFAULT_RESPONSE = (tenant: Tenant) =>
  `I'm the AI assistant for ${tenant.name} 🤖\n\nI can help you with:\n• 📅 Booking services\n• 💰 Pricing information\n• 🕐 Business hours\n• 🚨 Emergency services\n• 📋 Cancellation policy\n• 🛡️ Warranty information\n• 📞 Contact details\n• 💡 Service recommendations\n\nJust type your question!`;

export default function AITab({ tenant, services, primaryColor }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      text: DEFAULT_RESPONSE(tenant),
      timestamp: new Date(),
      level: 1,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: String(Date.now()), role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const query = input;
    setTimeout(() => {
      // Find matching intent
      let response = '';
      let level: 1 | 2 | 3 = 1;
      const matched = INTENTS.find(intent => intent.patterns.some(p => p.test(query)));

      if (matched) {
        response = matched.respond(tenant, services, query);
        level = matched.level;
      } else {
        // Search FAQ
        const faqMatch = tenant.config.faqs.find(f =>
          query.toLowerCase().split(' ').some(word => word.length > 3 && f.question.toLowerCase().includes(word))
        );
        if (faqMatch) {
          response = `📚 **From your FAQ:**\n\n**Q: ${faqMatch.question}**\n\nA: ${faqMatch.answer}`;
          level = 2;
        } else {
          response = `I didn't quite understand that. Here are some things you can ask me:\n\n• "What are your working hours?"\n• "What services do you offer?"\n• "What is your cancellation policy?"\n• "I need emergency service"\n• "Give me a price quote"\n\nOr call us directly at ${tenant.config.phone}.`;
          level = 1;
        }
      }

      const botMsg: ChatMessage = { id: String(Date.now() + 1), role: 'assistant', text: response, timestamp: new Date(), level };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 800);
  };

  const levelLabel: Record<number, { label: string; color: string }> = {
    1: { label: 'Intent Engine', color: '#64748b' },
    2: { label: 'RAG', color: '#2563eb' },
    3: { label: 'AI Premium', color: '#7c3aed' },
  };

  const quickReplies = ['What services do you offer?', 'What are your working hours?', 'I need emergency service', 'What is your cancellation policy?', 'Give me a price estimate', 'Recommend a service for me'];

  return (
    <div className="space-y-4 animate-fadeIn h-full">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-black text-white">AI Assistant</h2>
          <p className="text-slate-500 text-sm mt-1">3-tier hybrid AI: Intent Engine → RAG → Premium AI</p>
        </div>
        <div className="flex gap-2 text-xs">
          {[1, 2, 3].map(l => (
            <span key={l} className="flex items-center gap-1 px-2 py-1 rounded-full font-bold" style={{ background: levelLabel[l].color + '20', color: levelLabel[l].color }}>
              L{l} {levelLabel[l].label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { icon: '⚡', label: 'Level 1', title: 'Offline Intent', desc: 'Hours, pricing, booking, emergency — no API call', color: '#64748b' },
          { icon: '📚', label: 'Level 2', title: 'RAG Engine', desc: 'Searches your policies, FAQs, and documents', color: '#2563eb' },
          { icon: '🤖', label: 'Level 3', title: 'Premium AI', desc: 'Recommendations, quotes, campaigns via LLM', color: '#7c3aed' },
        ].map((item, i) => (
          <div key={i} className="admin-card-sm" style={{ borderTop: `2px solid ${item.color}` }}>
            <span className="text-xl">{item.icon}</span>
            <p className="text-xs font-black text-white mt-1">{item.label}: {item.title}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Chat window */}
      <div className="admin-card flex flex-col" style={{ height: '400px' }}>
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg" style={{ background: primaryColor + '25' }}>🤖</div>
          <div>
            <p className="text-sm font-bold text-white">{tenant.name} — AI Assistant</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold">Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0" style={{ background: primaryColor }}>🤖</div>
              )}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                <div
                  className="rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line"
                  style={msg.role === 'user'
                    ? { background: primaryColor, color: 'white', borderBottomRightRadius: '4px' }
                    : { background: '#1e293b', color: '#e2e8f0', borderBottomLeftRadius: '4px' }
                  }
                >
                  {msg.text}
                </div>
                <div className="flex items-center gap-2 mt-1 px-1">
                  <span className="text-[9px] text-slate-600">{msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.level && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: levelLabel[msg.level].color + '20', color: levelLabel[msg.level].color }}>
                      L{msg.level}
                    </span>
                  )}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-sm shrink-0">👤</div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-2 items-center">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ background: primaryColor }}>🤖</div>
              <div className="bg-slate-800 rounded-2xl px-4 py-3 flex gap-1.5">
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-slate-800 mt-3">
          <input className="form-input flex-1" placeholder="Ask anything about your business..." value={input} onChange={e => setInput(e.target.value)} />
          <button type="submit" className="btn-primary px-4" style={{ background: primaryColor }}>Send</button>
        </form>
      </div>

      {/* Quick replies */}
      <div>
        <p className="text-xs text-slate-500 font-bold mb-2 uppercase tracking-widest">Quick Test Queries</p>
        <div className="flex flex-wrap gap-2">
          {quickReplies.map((q, i) => (
            <button key={i} onClick={() => { setInput(q); }} className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700">
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
