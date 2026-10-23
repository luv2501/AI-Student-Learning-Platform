import { useState } from 'react';
import Card, { CardHeader } from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';

/**
 * High-utility, zero-vibecode SVG Score Over Time visualizer.
 * Strictly adheres to DESIGN.md semantic tokens, Public Sans + Geist Mono typography, and WCAG AA contrast.
 */
export default function ScoreTrendChart({
  scoreTrend = [],
  averageScore = 0,
  totalAttempts = 0,
  bestScore = 0,
}) {
  const [activePoint, setActivePoint] = useState(null);

  if (!scoreTrend || scoreTrend.length === 0) {
    return (
      <Card padding="none" className="overflow-hidden">
        <CardHeader
          title="Score Over Time"
          subtitle="Retention tracking across your quiz attempts"
          className="border-b border-border-subtle p-4 pb-3"
        />
        <div className="flex min-h-44 flex-col items-center justify-center p-6 text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
            No Quiz Attempts Recorded
          </p>
          <p className="mt-1 max-w-sm text-xs text-secondary leading-relaxed">
            Take practice quizzes inside your document workspaces to visualize retention and mastery trends over time.
          </p>
        </div>
      </Card>
    );
  }

  // SVG Chart bounds
  const width = 560;
  const height = 150;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 30;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const points = scoreTrend.map((d, index) => {
    const x =
      scoreTrend.length === 1
        ? paddingLeft + plotWidth / 2
        : paddingLeft + (index / (scoreTrend.length - 1)) * plotWidth;
    const y = paddingTop + (1 - Math.max(0, Math.min(100, d.score)) / 100) * plotHeight;
    return { ...d, x, y };
  });

  const pathData =
    points.length === 1
      ? `M ${paddingLeft} ${points[0].y} L ${width - paddingRight} ${points[0].y}`
      : points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');

  const areaData =
    points.length === 1
      ? ''
      : `${pathData} L ${points[points.length - 1].x.toFixed(1)} ${(paddingTop + plotHeight).toFixed(1)} L ${points[0].x.toFixed(1)} ${(paddingTop + plotHeight).toFixed(1)} Z`;

  const hoveredItem = activePoint !== null ? points[activePoint] : points[points.length - 1];

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-border-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-primary">
            Score Over Time
          </h3>
          <p className="text-xs text-secondary">
            Retention and accuracy across {totalAttempts} practice attempt{totalAttempts === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted">Avg:</span>
            <span className="font-semibold text-primary">{averageScore}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted">Best:</span>
            <span className="font-semibold text-success">{bestScore}%</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Active hover info banner */}
        <div className="mb-2 flex items-center justify-between font-mono text-xs text-muted min-h-5">
          {hoveredItem ? (
            <>
              <span className="truncate max-w-[280px]">
                {hoveredItem.documentTitle}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-secondary">
                  {new Date(hoveredItem.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span className="font-semibold text-primary">
                  {hoveredItem.score}% ({hoveredItem.correctCount}/{hoveredItem.totalQuestions})
                </span>
              </span>
            </>
          ) : (
            <span>Hover a data point to inspect details</span>
          )}
        </div>

        {/* Minimal Accessible SVG Chart */}
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible select-none"
            role="img"
            aria-label={`Score trend line chart. ${totalAttempts} quiz attempts with an average score of ${averageScore} percent.`}
          >
            <defs>
              <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent, #6366f1)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--color-accent, #6366f1)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Labels */}
            {[100, 50, 0].map((val) => {
              const y = paddingTop + (1 - val / 100) * plotHeight;
              return (
                <g key={val} className="text-muted">
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity="0.15"
                    strokeDasharray={val === 50 ? '3 3' : undefined}
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="font-mono text-[10px] fill-muted"
                  >
                    {val}%
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            {areaData && (
              <path d={areaData} fill="url(#scoreAreaGradient)" />
            )}

            {/* Trend Polyline */}
            <path
              d={pathData}
              fill="none"
              stroke="var(--color-accent, #6366f1)"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Points */}
            {points.map((p, i) => {
              const isHovered = activePoint === i;
              const pointColor =
                p.score >= 80
                  ? 'var(--color-success, #10b981)'
                  : p.score >= 50
                  ? 'var(--color-accent, #6366f1)'
                  : 'var(--color-danger, #ef4444)';

              return (
                <g
                  key={i}
                  className="cursor-pointer focus:outline-none"
                  onMouseEnter={() => setActivePoint(i)}
                  onMouseLeave={() => setActivePoint(null)}
                  onFocus={() => setActivePoint(i)}
                  onBlur={() => setActivePoint(null)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Attempt ${i + 1}: ${p.score}% on ${p.documentTitle}`}
                >
                  {/* Invisible enlarged hit target for easy tapping */}
                  <circle cx={p.x} cy={p.y} r="14" fill="transparent" />

                  {/* Outer circle for active hover */}
                  {isHovered && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="7"
                      fill={pointColor}
                      opacity="0.3"
                    />
                  )}

                  {/* Core data point dot */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? '4.5' : '3.5'}
                    fill="var(--color-surface, #ffffff)"
                    stroke={pointColor}
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />
                </g>
              );
            })}

            {/* X-Axis bottom labels for first and last attempts */}
            {points.length > 1 && (
              <>
                <text
                  x={points[0].x}
                  y={height - 8}
                  textAnchor="start"
                  className="font-mono text-[9px] fill-muted"
                >
                  {new Date(points[0].date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </text>
                <text
                  x={points[points.length - 1].x}
                  y={height - 8}
                  textAnchor="end"
                  className="font-mono text-[9px] fill-muted"
                >
                  {new Date(points[points.length - 1].date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </text>
              </>
            )}
          </svg>
        </div>
      </div>
    </Card>
  );
}
