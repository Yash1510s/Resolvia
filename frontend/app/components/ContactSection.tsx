'use client';

import React, { useState } from 'react';
import {
  Mail,
  MessageSquare,
  Globe,
  MapPin,
  Send,
  CheckCircle,
  HelpCircle,
  FileText,
} from 'lucide-react';

export const ContactSection: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Dispute Arbitration Inquiry',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: '',
        email: '',
        subject: 'Dispute Arbitration Inquiry',
        message: '',
      });
    }, 4000);
  };

  return (
    <div className="w-full text-slate-900 animate-fade-in selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <section className="bg-[#070d1d] text-white py-14 px-6 border-b border-white/[0.08]">
        <div className="max-w-[1400px] mx-auto text-center space-y-4">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-blue-400 block">
            GET IN TOUCH
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Contact the Resolvia Foundation
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Have questions about institutional dispute onboarding, smart contract integration, or becoming an elected juror? We are here to help.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="bg-[#f8fafc] py-16 px-6">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Contact Info */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Connect With Us
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Reach out directly or join our community discussions.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Email Support</h4>
                  <p className="text-xs text-slate-500 mt-0.5">arbitration@resolvia.network</p>
                  <p className="text-[10px] text-blue-600 font-semibold mt-1">Response within 24 hours</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Community & Governance</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Discord & Telegram Governance Channel</p>
                  <p className="text-[10px] text-purple-600 font-semibold mt-1">Over 2,400 active panelists</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Decentralized Protocol</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Ethereum Sepolia & Arbitrum Orbit</p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">Open-source & Verifiable</p>
                </div>
              </div>
            </div>

            {/* Quick Note */}
            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-900 space-y-1.5">
              <h4 className="text-xs font-bold flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Confidential Evidence Submissions</span>
              </h4>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Please do not submit sensitive evidence files through this public contact form. Use the encrypted <strong>Dispute Wizard</strong> inside the platform to anchor files on IPFS.
              </p>
            </div>
          </div>

          {/* Right: Message Form */}
          <div className="lg:col-span-7">
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Send an Inquiry</h3>
                <p className="text-xs text-slate-500 mt-0.5">Our team typically replies within 1 business day.</p>
              </div>

              {submitted ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2 animate-fade-in">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-emerald-900">Message Transmitted</h4>
                  <p className="text-xs text-emerald-700">Thank you for contacting Resolvia. We will review your inquiry shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Yash"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="yash@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Inquiry Topic</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                    >
                      <option value="Dispute Arbitration Inquiry">Dispute Arbitration Inquiry</option>
                      <option value="Institutional Integration">Institutional / University Integration</option>
                      <option value="Juror Program">Juror Staking & Panelist Application</option>
                      <option value="Technical Partnership">Smart Contract / AI Bug Report</option>
                      <option value="General Question">General Question</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Message Details</label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Describe your inquiry or dispute requirements..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
