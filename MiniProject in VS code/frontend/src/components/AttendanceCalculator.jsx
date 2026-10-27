import React, { useState, useMemo } from "react";
import { Calculator, CheckCircle2, AlertTriangle, AlertCircle, TrendingUp, Sparkles } from "lucide-react";

export function AttendanceCalculator({
  totalClasses = 100,
  attendedClasses = 86,
  currentPercentage = 86,
  defaultTarget = 75,
}) {
  const [target, setTarget] = useState(defaultTarget);
  const [simAttend, setSimAttend] = useState(0);
  const [simMiss, setSimMiss] = useState(0);

  const total = Number(totalClasses) || 100;
  const attended = Number(attendedClasses) || 0;
  const missed = Math.max(0, total - attended);
  const currentPct = total > 0 ? (attended / total) * 100 : Number(currentPercentage) || 0;

  const analysis = useMemo(() => {
    const targetPct = Number(target) || 75;

    // Consecutive classes needed to reach target:
    // (attended + x) / (total + x) >= targetPct / 100
    // 100 * attended + 100 * x >= targetPct * total + targetPct * x
    // x * (100 - targetPct) >= targetPct * total - 100 * attended
    // x >= (targetPct * total - 100 * attended) / (100 - targetPct)
    let classesNeeded = 0;
    let safeToMiss = 0;
    let isReachable = true;

    if (currentPct < targetPct) {
      if (targetPct >= 100) {
        classesNeeded = Infinity;
        isReachable = false;
      } else {
        const numerator = targetPct * total - 100 * attended;
        const denominator = 100 - targetPct;
        classesNeeded = Math.max(1, Math.ceil(numerator / denominator));
        // If it requires more than 60 future classes (typical remaining classes per semester is 30-45)
        if (classesNeeded > 70) {
          isReachable = false;
        }
      }
    } else {
      // Safe to miss:
      // attended / (total + y) >= targetPct / 100
      // 100 * attended >= targetPct * (total + y)
      // y <= (100 * attended - targetPct * total) / targetPct
      if (targetPct > 0) {
        const maxMiss = Math.floor((100 * attended - targetPct * total) / targetPct);
        safeToMiss = Math.max(0, maxMiss);
      }
    }

    // Simulated calculation:
    const simTotal = total + Number(simAttend) + Number(simMiss);
    const simAtt = attended + Number(simAttend);
    const simulatedPct = simTotal > 0 ? ((simAtt / simTotal) * 100).toFixed(1) : currentPct.toFixed(1);

    return {
      targetPct,
      classesNeeded,
      safeToMiss,
      isReachable,
      simulatedPct: Number(simulatedPct),
    };
  }, [total, attended, currentPct, target, simAttend, simMiss]);

  return (
    <div className="attendance-calculator-card">
      <div className="calc-header">
        <div className="calc-title-box">
          <div className="calc-icon">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="calc-title">Attendance Eligibility & Target Planner</h3>
            <p className="calc-subtitle">
              Calculate future requirements based on official university threshold
            </p>
          </div>
        </div>
        <div className="calc-status-badge">
          {currentPct >= target ? (
            <span className="badge-safe">
              <CheckCircle2 size={14} /> Threshold Met
            </span>
          ) : (
            <span className="badge-warning">
              <AlertTriangle size={14} /> Action Required
            </span>
          )}
        </div>
      </div>

      <div className="calc-grid">
        {/* Left Column: Target Selector & Calculation */}
        <div className="calc-left">
          <div className="target-slider-group">
            <div className="slider-header">
              <label htmlFor="target-slider">Institutional Target Attendance:</label>
              <strong className="slider-value">{target}%</strong>
            </div>
            <input
              id="target-slider"
              type="range"
              min="65"
              max="90"
              step="1"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="calc-range-input"
            />
            <div className="slider-markers">
              <span>65% (Condonation)</span>
              <span className="target-marker">75% (Standard)</span>
              <span>85% (Distinction)</span>
            </div>
          </div>

          <div className="calc-result-box">
            {currentPct >= target ? (
              <div className="result-safe">
                <div className="result-header">
                  <CheckCircle2 size={24} className="text-emerald-500" />
                  <div>
                    <h4>You are currently in the safe zone!</h4>
                    <p>
                      Your attendance is <strong>{currentPct.toFixed(1)}%</strong>, which exceeds your target of{" "}
                      <strong>{target}%</strong>.
                    </p>
                  </div>
                </div>
                <div className="safe-miss-metric">
                  <span className="safe-miss-number">{analysis.safeToMiss}</span>
                  <span className="safe-miss-desc">
                    classes can be safely missed without dropping below {target}%
                  </span>
                </div>
              </div>
            ) : analysis.isReachable ? (
              <div className="result-needed">
                <div className="result-header">
                  <AlertTriangle size={24} className="text-amber-500" />
                  <div>
                    <h4>Target Recovery Requirement</h4>
                    <p>
                      To raise your attendance from <strong>{currentPct.toFixed(1)}%</strong> to{" "}
                      <strong>{target}%</strong>:
                    </p>
                  </div>
                </div>
                <div className="needed-metric">
                  <span className="needed-number">{analysis.classesNeeded}</span>
                  <span className="needed-desc">
                    consecutive upcoming classes must be attended without absence
                  </span>
                </div>
              </div>
            ) : (
              <div className="result-impossible">
                <div className="result-header">
                  <AlertCircle size={24} className="text-red-500" />
                  <div>
                    <h4>Target Statistically Difficult</h4>
                    <p>
                      Reaching <strong>{target}%</strong> would require over {analysis.classesNeeded} consecutive
                      classes. Consider consulting your academic advisor for condonation options.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive What-If Simulator */}
        <div className="calc-right">
          <div className="simulator-box">
            <div className="sim-header">
              <Sparkles size={16} />
              <h4>What-If Attendance Simulator</h4>
            </div>
            <p className="sim-help">
              Forecast your final percentage by predicting your next attendance pattern:
            </p>

            <div className="sim-inputs">
              <div className="sim-field">
                <label>Attend Next Classes:</label>
                <div className="number-stepper">
                  <button type="button" onClick={() => setSimAttend(Math.max(0, simAttend - 1))}>
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={simAttend}
                    onChange={(e) => setSimAttend(Math.max(0, Number(e.target.value)))}
                  />
                  <button type="button" onClick={() => setSimAttend(simAttend + 1)}>
                    +
                  </button>
                </div>
              </div>

              <div className="sim-field">
                <label>Miss Next Classes:</label>
                <div className="number-stepper">
                  <button type="button" onClick={() => setSimMiss(Math.max(0, simMiss - 1))}>
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={simMiss}
                    onChange={(e) => setSimMiss(Math.max(0, Number(e.target.value)))}
                  />
                  <button type="button" onClick={() => setSimMiss(simMiss + 1)}>
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="sim-outcome">
              <div className="sim-outcome-label">Projected Outcome:</div>
              <div className="sim-outcome-stat">
                <span className="sim-old">{currentPct.toFixed(1)}%</span>
                <span className="sim-arrow">→</span>
                <span
                  className={`sim-new ${
                    analysis.simulatedPct >= target ? "text-emerald-500" : "text-amber-500"
                  }`}
                >
                  {analysis.simulatedPct}%
                </span>
              </div>
              <div className="sim-summary">
                {simAttend > 0 || simMiss > 0 ? (
                  <span>
                    Simulating +{simAttend} attended, +{simMiss} missed classes ({total + simAttend + simMiss}{" "}
                    total classes)
                  </span>
                ) : (
                  <span>Use controls above to simulate future attendance changes</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
