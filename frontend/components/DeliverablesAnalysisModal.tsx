import React from 'react';
import { ShieldCheck, CheckCircle2, Calendar, GitPullRequest } from 'lucide-react';

export const DeliverablesAnalysisModal: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Deliverables & Collaborator Safety Audit</h1>
            <p className="text-xs text-slate-300 mt-1">
              Zero breaking changes: existing FastAPI endpoints and models remain 100% backwards compatible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};