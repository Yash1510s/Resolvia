'use client';

import React from 'react';
import {
  Cpu,
  Shield,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  GitBranch,
} from 'lucide-react';
import { AIAnalysisReport } from '../types';

interface AIAnalysisPanelProps {
  report: AIAnalysisReport | null;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
}

export function AIAnalysisPanel({ report, onRunAnalysis, isAnalyzing }: AIAnalysisPanelProps) {
  if (!report) {
    return (
      <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 mx-auto flex items-center justify-center">
          <Cpu className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">NeuralNLP Advisory Not Yet Generated</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            The engine maps each party’s assertions to anchored evidence, syncs a chronological
            timeline, detects contradictions, and scans every payload for prompt-injection.
          </p>
        </div>
        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 inline-flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing Evidence…</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Run Advisory Analysis</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Advisory banner: non-binding disclaimer */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] font-bold text-amber-800">{report.advisoryDisclaimer}</p>
          <p className="text-[10px] text-amber-700/70 mt-1 font-mono">
            {report.modelIdentifier} • Generated {new Date(report.generatedAt).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left column: claim mappings + contradictions */}
        <div className="lg:col-span-7 space-y-4">
          {/* Claim-to-Evidence Mappings */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-blue-600" />
              Claim → Evidence Mapping
            </h4>

            {report.claimMappings.map((clm) => (
              <div key={clm.claimId} className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                      {clm.claimId}
                    </span>
                    <span className="text-[11px] font-bold text-slate-800">{clm.party}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Credibility</span>
                    <span
                      className={`text-[11px] font-black font-mono ${
                        clm.credibilityScore >= 90 ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {clm.credibilityScore}%
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">{clm.assertion}</p>

                <div className="flex flex-wrap gap-1.5">
                  {clm.evidenceIds.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 text-[10px] font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-600"
                    >
                      <FileText className="w-3 h-3 text-slate-400" />
                      {id}
                    </span>
                  ))}
                </div>

                <p className="text-[11px] text-slate-500 italic flex items-start gap-1.5">
                  <Cpu className="w-3 h-3 shrink-0 mt-0.5 text-purple-500" />
                  {clm.aiObservation}
                </p>
              </div>
            ))}
          </div>

          {/* Contradictions */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Detected Contradictions ({report.contradictions.length})
            </h4>

            {report.contradictions.length === 0 ? (
              <p className="text-xs text-slate-500">No cross-evidence contradictions detected.</p>
            ) : (
              report.contradictions.map((c) => (
                <div
                  key={c.id}
                  className={`p-4 rounded-xl border ${
                    c.severity === 'CRITICAL'
                      ? 'bg-rose-50 border-rose-200'
                      : 'bg-amber-50 border-amber-200'
                  } space-y-1.5`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800">{c.title}</span>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        c.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {c.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{c.description}</p>
                  <p className="text-[10px] font-mono text-slate-400">refs: {c.evidenceRefs.join(', ')}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: timeline + injection defense + recommendation */}
        <div className="lg:col-span-5 space-y-4">
          {/* Timeline */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Synchronized Timeline
            </h4>
            <div className="space-y-0">
              {report.timeline.map((t, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-blue-100 shrink-0 mt-1"></div>
                    {i < report.timeline.length - 1 && <div className="w-px flex-1 bg-slate-200"></div>}
                  </div>
                  <div className="pb-4">
                    <p className="text-[10px] font-mono text-slate-400">{t.time}</p>
                    <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{t.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prompt injection defense */}
          <div
            className={`p-5 rounded-2xl border shadow-xs space-y-2 ${
              report.promptInjectionDefense.status === 'SECURE_CLEARED'
                ? 'bg-emerald-50/50 border-emerald-200'
                : 'bg-rose-50/50 border-rose-200'
            }`}
          >
            <h4
              className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                report.promptInjectionDefense.status === 'SECURE_CLEARED'
                  ? 'text-emerald-700'
                  : 'text-rose-700'
              }`}
            >
              <Shield
                className={`w-4 h-4 ${
                  report.promptInjectionDefense.status === 'SECURE_CLEARED' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              />
              Prompt-Injection Defense
            </h4>
            <div className="flex items-center gap-2">
              {report.promptInjectionDefense.status === 'SECURE_CLEARED' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600" />
              )}
              <span
                className={`text-xs font-black ${
                  report.promptInjectionDefense.status === 'SECURE_CLEARED'
                    ? 'text-emerald-700'
                    : 'text-rose-700'
                }`}
              >
                {report.promptInjectionDefense.status}
              </span>
              <span className="text-[10px] text-slate-500">
                {report.promptInjectionDefense.threatsDetected} threats
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {report.promptInjectionDefense.notes}
            </p>
          </div>

          {/* Advisory recommendation */}
          <div className="p-5 rounded-2xl bg-[#0b132b] text-white shadow-md space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Advisory Recommendation (Non-Binding)
            </h4>

            <div className="flex items-center justify-between">
              <span className="text-lg font-black">
                Favour: <span className="text-blue-400">{report.advisoryRecommendation.favoredParty}</span>
              </span>
              <span className="text-2xl font-black font-mono text-blue-400">
                {report.advisoryRecommendation.confidence}%
              </span>
            </div>

            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                style={{ width: `${report.advisoryRecommendation.confidence}%` }}
              ></div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              {report.advisoryRecommendation.rationale}
            </p>

            {report.advisoryRecommendation.uncertaintyFactors.length > 0 && (
              <div className="pt-2 border-t border-white/10">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Uncertainty Factors
                </p>
                <ul className="space-y-1">
                  {report.advisoryRecommendation.uncertaintyFactors.map((f, i) => (
                    <li key={i} className="text-[10px] text-slate-400 flex items-start gap-1.5">
                      <span className="text-amber-400 mt-0.5">•</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
