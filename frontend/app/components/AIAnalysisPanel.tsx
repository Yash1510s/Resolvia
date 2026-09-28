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
  Binary,
  Fingerprint,
  CheckCheck,
  BarChart3,
  Layers,
  Scale,
} from 'lucide-react';
import { AIAnalysisReport } from '../types';

interface AIAnalysisPanelProps {
  report: AIAnalysisReport | null;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
}

export function AIAnalysisPanel({ report, onRunAnalysis, isAnalyzing }: AIAnalysisPanelProps) {
  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    if (!isAnalyzing) {
      setActiveStep(0);
      return;
    }
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 700);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  if (isAnalyzing) {
    const steps = [
      { label: 'OWASP LLM01 Defense', detail: 'Isolating untrusted party claims & sanitizing prompt injection vectors' },
      { label: 'Deterministic ML Champion Inference', detail: 'Evaluating XGBoost 119-feature statistical risk model' },
      { label: 'Cryptographic Cross-Reference', detail: 'Matching claim assertions with on-chain SHA-256 evidence digests' },
      { label: 'Contradiction Radar & Dual Consensus', detail: 'Cross-checking LLM advisory against ML model predictions' },
    ];

    return (
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl space-y-6 animate-fade-in relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-400 flex items-center justify-center animate-pulse">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                Resolvia AI Advisory Pipeline Active
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </h3>
              <p className="text-[11px] text-slate-400">Dual-engine evidence synthesis: LLM + ML Classifier</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-violet-400 bg-violet-950/80 border border-violet-800/60 px-2.5 py-1 rounded-full">
              STAGE {activeStep + 1} OF 4
            </span>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="space-y-3">
          {steps.map((st, idx) => {
            const isDone = activeStep > idx;
            const isCurrent = activeStep === idx;
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center gap-3 ${
                  isCurrent
                    ? 'bg-violet-950/40 border-violet-500/60 shadow-lg shadow-violet-950/50'
                    : isDone
                    ? 'bg-slate-800/40 border-slate-700/50 opacity-90'
                    : 'bg-slate-950/30 border-slate-800/30 opacity-40'
                }`}
              >
                <div className="shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : isCurrent ? (
                    <RefreshCw className="w-5 h-5 text-violet-400 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                      {idx + 1}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white">{st.label}</p>
                  <p className="text-[10px] text-slate-400 truncate">{st.detail}</p>
                </div>
                {isCurrent && (
                  <span className="text-[10px] font-bold text-violet-300 animate-pulse uppercase tracking-wider shrink-0">
                    Computing…
                  </span>
                )}
                {isDone && (
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider shrink-0">
                    Verified
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-violet-400" />
            OWASP LLM01 Sanitization Active
          </span>
          <span className="font-mono text-[10px] text-slate-500">Engines: Generative LLM + XGBoost ML</span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 mx-auto flex items-center justify-center">
          <Cpu className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">NeuralNLP + ML Advisory Not Yet Generated</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            The dual engine runs a trained 119-feature statistical ML classifier alongside generative LLM
            reasoning, maps claims to anchored evidence, and scans for prompt-injection attacks.
          </p>
        </div>
        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Run Dual-Engine Advisory</span>
        </button>
      </div>
    );
  }

  const consensus = report.modelConsensus;
  const ml = report.mlPrediction;

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

      {/* Dual-Engine Consensus Verification Banner */}
      {consensus && (
        <div
          className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between gap-4 ${
            consensus.consensusLevel === 'HIGH_CONSENSUS'
              ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-200'
              : 'bg-gradient-to-r from-amber-50 via-orange-50 to-white border-amber-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                consensus.consensusLevel === 'HIGH_CONSENSUS'
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-200'
                  : 'bg-amber-500/10 text-amber-600 border border-amber-200'
              }`}
            >
              {consensus.consensusLevel === 'HIGH_CONSENSUS' ? (
                <CheckCheck className="w-5 h-5" />
              ) : (
                <Scale className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full ${
                    consensus.consensusLevel === 'HIGH_CONSENSUS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {consensus.consensusLevel === 'HIGH_CONSENSUS' ? 'Dual-Engine Consensus' : 'Divergence Detected'}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Agreement Score: <strong className="text-slate-800">{consensus.consensusScore}%</strong>
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-1 leading-snug">{consensus.summary}</p>
            </div>
          </div>
          <div className="text-right shrink-0 hidden sm:block">
            <span className="text-[10px] font-mono text-slate-400 block">LLM vs ML Engine</span>
            <span className="text-xs font-bold font-mono text-slate-800">
              {consensus.llmFavoredParty} vs {consensus.mlFavoredParty}
            </span>
          </div>
        </div>
      )}

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

        {/* Right column: LLM Advisory + ML Classifier + Timeline + Defense */}
        <div className="lg:col-span-5 space-y-4">
          {/* Generative LLM Advisory recommendation */}
          <div className="p-5 rounded-2xl bg-[#0b132b] text-white shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Generative Advisory (LLM)
              </h4>
              <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                Non-Binding
              </span>
            </div>

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

          {/* Trained ML Model Prediction Card (XGBoost Champion) */}
          {ml && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white border border-indigo-800/40 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
                    <Binary className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      ML Classifier Prediction
                      <span className="text-[9px] font-mono font-bold bg-indigo-500/30 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/40">
                        {ml.modelInfo.name}
                      </span>
                    </h4>
                    <p className="text-[9px] text-slate-400 font-mono">
                      119 features • 4,000 cases trained
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                    {ml.confidence}% Conf.
                  </span>
                </div>
              </div>

              {/* Prediction outcome banner */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-mono block">Statistical Outcome</span>
                  <span className="text-sm font-black text-indigo-200">{ml.predictedOutcome}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 uppercase font-mono block">Favors Party</span>
                  <span className="text-xs font-bold text-white bg-indigo-600/50 px-2 py-0.5 rounded">
                    {ml.favoredParty}
                  </span>
                </div>
              </div>

              {/* Class Probability Distribution */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3 text-indigo-400" />
                  Probability Distribution
                </span>
                <div className="space-y-1">
                  {Object.entries(ml.probabilityBreakdown).map(([label, prob]) => (
                    <div key={label} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-300 truncate">{label}</span>
                        <span className="font-mono text-indigo-300">{prob}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-400"
                          style={{ width: `${prob}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explainability / Top Contributing Features */}
              {ml.topReasons && ml.topReasons.length > 0 && (
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-indigo-400" />
                    Key Decision Drivers (Explainability)
                  </span>
                  <div className="space-y-1">
                    {ml.topReasons.slice(0, 3).map((r, i) => (
                      <div
                        key={i}
                        className="p-1.5 rounded-lg bg-white/5 flex items-center justify-between text-[10px]"
                      >
                        <span className="text-slate-200">{r.displayName}</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          +{r.contribution}% weight
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* On-Chain SHA-256 Model Integrity Badge */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Fingerprint className="w-3 h-3 text-indigo-400" />
                  SHA-256: {ml.modelInfo.sha256 ? `${ml.modelInfo.sha256.slice(0, 12)}…` : 'Verified'}
                </span>
                <span className="text-indigo-300">On-Chain Verifiable</span>
              </div>
            </div>
          )}

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
        </div>
      </div>
    </div>
  );
}

