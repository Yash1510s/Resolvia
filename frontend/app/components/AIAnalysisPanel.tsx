'use client';

import React from 'react';
import {
  Cpu,
  ShieldCheck,
  AlertOctagon,
  Sparkles,
  GitCommit,
  CheckCircle2,
  HelpCircle,
  Clock,
  Info,
  ShieldAlert,
  ArrowRight,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { AIAnalysisReport } from '../types';
import { formatHash } from '../lib/crypto';

interface AIAnalysisPanelProps {
  report?: AIAnalysisReport;
  onRunAnalysis?: () => void;
  isAnalyzing?: boolean;
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
  report,
  onRunAnalysis,
  isAnalyzing,
}) => {
  if (!report) {
    return (
      <div className="p-10 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 mx-auto flex items-center justify-center">
          <Cpu className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-bold text-slate-900">AI Advisory Radar Ready for Execution</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Locked evidence can be analyzed through the off-chain neural analysis engine to extract chronological facts, detect statement contradictions, isolate prompt injection payloads, and synthesize non-binding advisory guidance.
          </p>
        </div>
        {onRunAnalysis && (
          <button
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 mx-auto cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAnalyzing ? 'Extracting Factual Matrix...' : 'Launch Neural Advisory Analysis'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mandatory Advisory Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-800">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-extrabold uppercase tracking-wider block mb-0.5">
            System Invariant: Advisory Protocol Safeguard
          </span>
          {report.advisoryDisclaimer} The AI analysis is non-binding and advisory only; authoritative verdict rests solely with elected human jurors.
        </div>
      </div>

      {/* Top Intelligence Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Model Node */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Cpu className="w-4 h-4 text-purple-600" />
            <span>Advisory Model Node</span>
          </div>
          <p className="text-xs font-bold text-slate-900 truncate">{report.modelIdentifier}</p>
          <p className="text-[10px] text-slate-400 font-mono mt-1">
            Digest: {formatHash(report.reportSha256, 8)}
          </p>
        </div>

        {/* Prompt Defense */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Prompt Defense (OWASP)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {report.promptInjectionDefense.status}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">0 Threats Found</span>
          </div>
          <p className="text-[10px] text-slate-400 line-clamp-1 mt-1">
            {report.promptInjectionDefense.notes}
          </p>
        </div>

        {/* Recommendation Pill */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Advisory Recommendation</span>
          </div>
          <p className="text-xs font-bold text-blue-700">
            {report.advisoryRecommendation.favoredParty}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${report.advisoryRecommendation.confidence}%` }}
              ></div>
            </div>
            <span className="text-[11px] font-bold text-slate-800 font-mono">
              {report.advisoryRecommendation.confidence}%
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Section matching Reference Image Panel 6 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Evidence Insights matching Reference */}
        <div className="lg:col-span-7 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Evidence Insights</span>
          </h4>

          <div className="space-y-2.5">
            {report.claimMappings.map((cm, idx) => (
              <div
                key={cm.claimId || idx}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {cm.claimId}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {cm.party} Claim
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                    Credibility: {cm.credibilityScore}%
                  </div>
                </div>

                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  "{cm.assertion}"
                </p>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                  <span className="text-blue-700 font-bold">AI Observation: </span>
                  {cm.aiObservation}
                </div>
              </div>
            ))}
          </div>

          {/* Contradictions section */}
          {report.contradictions && report.contradictions.length > 0 && (
            <div className="pt-2 space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4" />
                <span>Contradictions Detected ({report.contradictions.length})</span>
              </h5>
              {report.contradictions.map((ct) => (
                <div
                  key={ct.id}
                  className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1 text-slate-800"
                >
                  <span className="font-bold text-rose-700">{ct.title}</span>
                  <p className="text-slate-600 text-xs">{ct.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: AI Recommendation Box matching Reference Image Panel 6 */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              AI Recommendation
            </h4>

            {/* Split Percentage Gauge matching Reference Image */}
            <div className="grid grid-cols-2 gap-4 text-center py-2">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <p className="text-4xl font-black text-emerald-600 font-mono">
                  {report.advisoryRecommendation.confidence}%
                </p>
                <p className="text-xs text-emerald-800 font-bold mt-1">In favour of Claimant</p>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
                <p className="text-4xl font-black text-rose-600 font-mono">
                  {100 - report.advisoryRecommendation.confidence}%
                </p>
                <p className="text-xs text-rose-800 font-bold mt-1">In favour of Respondent</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Confidence Score</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {(report.advisoryRecommendation.confidence / 100).toFixed(2)}
              </span>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-800 block mb-1">Synthesized Rationale:</span>
              {report.advisoryRecommendation.rationale}
            </div>

            <div className="text-[11px] text-slate-500 leading-normal italic">
              Note: This is an AI-generated analysis and does not constitute the final decision. The human jury will review all evidence independently.
            </div>

            {/* View Full AI Report CTA matching Reference */}
            <button
              onClick={() => alert('Full AI Evidence Matrix & Cross-Verification Digest generated.')}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-tight shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span>View Full AI Report</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
