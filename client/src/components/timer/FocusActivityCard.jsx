import { useState } from 'react';
import { Flame, Timer, Sparkles } from 'lucide-react';
import Card, { CardHeader } from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';

function formatHoursAndMinutes(totalMinutes = 0) {
  const mins = Math.max(0, Math.round(totalMinutes));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const remM = mins % 60;
  return remM > 0 ? `${h}h ${remM}m` : `${h}h`;
}

export default function FocusActivityCard({
  streak = {},
  todayMinutes = 0,
  totalMinutes = 0,
  weeklyBreakdown = [],
  onOpenTimer,
}) {
  const [activeTooltip, setActiveTooltip] = useState(null);

  const currentStreak = streak?.current ?? 0;
  const longestStreak = streak?.longest ?? 0;

  // Calculate max minutes in the week to scale bar heights (at least 60m for scale)
  const maxWeeklyMinutes = Math.max(
    60,
    ...weeklyBreakdown.map((d) => d.minutes || 0)
  );

  return (
    <Card padding="none" className="flex h-full flex-col justify-between">
      <div>
        <CardHeader
          title="Focus Activity"
          subtitle="7-day study minutes & active recall streak"
          action={
            <div className="flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent-subtle/50 px-2.5 py-1 font-mono text-xs text-accent">
              <Flame className="h-3.5 w-3.5 fill-accent/20 stroke-accent" aria-hidden="true" />
              <span className="font-semibold">{currentStreak}-day streak</span>
            </div>
          }
          className="border-b border-border-subtle p-4 pb-3"
        />

        <div className="p-4 space-y-5">
          {/* Metrics summary row */}
          <div className="grid grid-cols-3 gap-2 rounded-lg border border-border-subtle bg-subtle/30 p-2.5">
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Today</p>
              <p className="mt-0.5 font-mono text-base font-semibold text-primary">
                {formatHoursAndMinutes(todayMinutes)}
              </p>
            </div>
            <div className="border-l border-border-subtle pl-2.5">
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">All-Time</p>
              <p className="mt-0.5 font-mono text-base font-semibold text-primary">
                {formatHoursAndMinutes(totalMinutes)}
              </p>
            </div>
            <div className="border-l border-border-subtle pl-2.5">
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Best Streak</p>
              <p className="mt-0.5 font-mono text-base font-semibold text-primary">
                {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>

          {/* 7-Day Bar Visualizer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted">
              <span>Past 7 days</span>
              <span className="font-mono">Daily focus time</span>
            </div>

            <div
              className="grid grid-cols-7 gap-2 pt-2 items-end h-28 border-b border-border-subtle pb-2"
              role="img"
              aria-label="7-day focus minutes breakdown"
            >
              {weeklyBreakdown.map((day, idx) => {
                const isToday = idx === weeklyBreakdown.length - 1;
                const minutes = day.minutes || 0;
                const heightPercent = Math.max(6, Math.round((minutes / maxWeeklyMinutes) * 100));
                const isHovered = activeTooltip === day.date;

                return (
                  <div
                    key={day.date}
                    className="group relative flex flex-col items-center justify-end h-full"
                    onMouseEnter={() => setActiveTooltip(day.date)}
                    onMouseLeave={() => setActiveTooltip(null)}
                    onFocus={() => setActiveTooltip(day.date)}
                    onBlur={() => setActiveTooltip(null)}
                    tabIndex={0}
                    role="graphics-symbol"
                    aria-label={`${day.dayName}, ${day.date}: ${minutes} minutes`}
                  >
                    {/* Tooltip bubble on hover/focus */}
                    {isHovered && (
                      <div className="absolute -top-9 z-20 whitespace-nowrap rounded-md border border-border-subtle bg-surface px-2 py-0.5 font-mono text-[10px] text-primary shadow-sm">
                        {day.dayName}: {minutes}m
                      </div>
                    )}

                    {/* Bar track */}
                    <div
                      className={`w-full max-w-[28px] rounded-t-sm transition-all duration-200 ${
                        minutes > 0
                          ? isToday
                            ? 'bg-accent group-hover:bg-accent/80'
                            : 'bg-accent/70 group-hover:bg-accent'
                          : 'bg-subtle/80 group-hover:bg-subtle'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Days labels */}
            <div className="grid grid-cols-7 gap-2 text-center">
              {weeklyBreakdown.map((day, idx) => {
                const isToday = idx === weeklyBreakdown.length - 1;
                return (
                  <div key={day.date} className="flex flex-col items-center">
                    <span
                      className={`font-mono text-[11px] ${
                        isToday ? 'font-semibold text-accent' : 'text-muted'
                      }`}
                    >
                      {day.dayName}
                    </span>
                    <span className="font-mono text-[9px] text-muted/70">
                      {day.date.slice(8)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Action launcher */}
      <div className="border-t border-border-subtle p-3.5 bg-subtle/20">
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          onClick={onOpenTimer}
          className="gap-1.5 text-accent border-accent/30 hover:bg-accent-subtle/30"
        >
          <Timer className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Launch focus timer</span>
        </Button>
      </div>
    </Card>
  );
}
