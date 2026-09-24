export default function ResearchPanel({ research }) {
  if (!research) return null;
  const { substituted, weights, codingSkillWeights, evaluationWindow, timeBenchmarkSeconds } = research;

  return (
    <div className="card">
      <div className="card-title">Research Panel</div>

      <div className="mb-5">
        <p className="text-sm text-muted mb-2">Formula</p>
        <p className="font-mono text-sm bg-accentSoft px-3 py-2 rounded-sm border border-line inline-block">
          ADS = {weights.H}H + {weights.I}I + {weights.R}R + {weights.T}T
        </p>
      </div>

      <div className="mb-5">
        <p className="text-sm text-muted mb-2">Substituted values (current student)</p>
        <p className="font-mono text-sm bg-accentSoft px-3 py-2 rounded-sm border border-line inline-block">
          ADS = {weights.H}({substituted.H}) + {weights.I}({substituted.I}) + {weights.R}
          ({substituted.R}) + {weights.T}({substituted.T}) = {substituted.ADS}
        </p>
      </div>

      <div className="mb-5">
        <p className="text-sm text-muted mb-2">Coding Skill formula (configurable)</p>
        <p className="font-mono text-sm bg-accentSoft px-3 py-2 rounded-sm border border-line inline-block">
          Skill = {codingSkillWeights.independentSolveRate}×IndependentSolve% +{" "}
          {codingSkillWeights.lowHintUsage}×(100−H) + {codingSkillWeights.lowAiReliance}×(100−I)
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-y-2 text-sm border-t border-line pt-4 mt-2">
        <dt className="text-muted">Assistance Framework</dt>
        <dd>L1 → L2 → L3 → L4 → L5 → L6</dd>
        <dt className="text-muted">Model</dt>
        <dd>Qwen (local, default) · Gemini / Grok optional</dd>
        <dt className="text-muted">Evaluation Window</dt>
        <dd>Last {evaluationWindow} Problems</dd>
        <dt className="text-muted">Time Benchmark</dt>
        <dd>{Math.round(timeBenchmarkSeconds / 60)} min</dd>
      </dl>
    </div>
  );
}
