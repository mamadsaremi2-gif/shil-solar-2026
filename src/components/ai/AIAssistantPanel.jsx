import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Sparkles, BrainCircuit, ShieldCheck } from "lucide-react";

import { runAIEngineeringAssistant } from "../../ai/engine/aiAssistantEngine.js";
import { useAIStore } from "../../ai/store/aiStore.js";

const sampleProject = {
  dailyEnergyWh: 12500,
  peakLoadW: 4800,
  backupHours: 8,
  panelPowerW: 585,
  batteryVoltage: 48,
};

export default function AIAssistantPanel() {
  const {
    loading,
    result,
    error,
    setLoading,
    setResult,
    setError,
  } = useAIStore();

  async function handleRunAI() {
    try {
      setLoading(true);

      const output =
        await runAIEngineeringAssistant(sampleProject);

      setResult(output);
    } catch (err) {
      setError(err?.message || "AI Error");
    }
  }

  return (
    <section className="ai-panel-v15">
      <div className="widget-head-v15">
        <div>
          <span>AI ENGINEERING LAYER</span>
          <h3>?????? ?????? ??????</h3>
        </div>

        <div className="ai-chip-v15">
          <Sparkles size={14} />
          AI READY
        </div>
      </div>

      <div className="ai-feature-grid-v15">
        <div>
          <BrainCircuit size={24} />
          <h4>AI Sizing</h4>
          <p>??????? ???? ???? ????? ? ???????</p>
        </div>

        <div>
          <ShieldCheck size={24} />
          <h4>Risk Check</h4>
          <p>????? ???????? ??? ? ??????</p>
        </div>

        <div>
          <Bot size={24} />
          <h4>Assistant</h4>
          <p>????? ????? ?? ???? ??????</p>
        </div>
      </div>

      <button
        type="button"
        className="ai-run-btn-v15"
        onClick={handleRunAI}
        disabled={loading}
      >
        {loading ? "?? ??? ?????..." : "????? ????? ??????"}
      </button>

      {error && (
        <div className="ai-error-v15">
          {error}
        </div>
      )}

      {result && (
        <div className="ai-result-v15">
          <div className="ai-result-head-v15">
            <span>{result.mode}</span>
            <strong>
              Confidence: {Math.round((result.confidence || 0) * 100)}%
            </strong>
          </div>

          {result.recommendation && (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {result.recommendation}
            </ReactMarkdown>
          )}

          {result.risks && (
            <ul>
              {result.risks.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
