"use client";

import { useMemo } from "react";
import { Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface BeadCounts {
  open: number;
  in_progress: number;
  inreview: number;
  closed: number;
}

interface StatusDonutProps {
  beadCounts: BeadCounts;
  size?: number;
  className?: string;
}

// Status colors matching the kanban board
const STATUS_COLORS = {
  open: "#3b82f6",        // blue-500
  in_progress: "#f59e0b", // amber-500
  inreview: "#a855f7",    // purple-500
  closed: "#22c55e",      // green-500
};

const STATUS_LABELS = {
  open: "Open",
  in_progress: "In Progress",
  inreview: "In Review",
  closed: "Closed",
};

const chartConfig = {
  count: {
    label: "Tasks",
  },
  open: {
    label: "Open",
    color: STATUS_COLORS.open,
  },
  in_progress: {
    label: "In Progress",
    color: STATUS_COLORS.in_progress,
  },
  inreview: {
    label: "In Review",
    color: STATUS_COLORS.inreview,
  },
  closed: {
    label: "Closed",
    color: STATUS_COLORS.closed,
  },
} satisfies ChartConfig;

export function StatusDonut({ beadCounts, size = 48, className }: StatusDonutProps) {
  const chartData = useMemo(() => {
    return [
      { status: "open", count: beadCounts.open, fill: STATUS_COLORS.open },
      { status: "in_progress", count: beadCounts.in_progress, fill: STATUS_COLORS.in_progress },
      { status: "inreview", count: beadCounts.inreview, fill: STATUS_COLORS.inreview },
      { status: "closed", count: beadCounts.closed, fill: STATUS_COLORS.closed },
    ].filter((item) => item.count > 0); // Only show statuses with counts
  }, [beadCounts]);

  const total = useMemo(() => {
    return beadCounts.open + beadCounts.in_progress + beadCounts.inreview + beadCounts.closed;
  }, [beadCounts]);

  // If no tasks, show empty state
  if (total === 0) {
    return (
      <div
        className={className}
        style={{ width: size, height: size }}
        aria-label="No tasks"
      >
        <div
          className="rounded-full border-2 border-dashed border-zinc-700 w-full h-full"
          title="No tasks"
        />
      </div>
    );
  }

  const innerRadius = size * 0.3;
  const outerRadius = size * 0.45;

  return (
    <ChartContainer
      config={chartConfig}
      className={className}
      style={{ width: size, height: size }}
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, name) => (
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: STATUS_COLORS[name as keyof typeof STATUS_COLORS] }}
                  />
                  <span className="text-zinc-400">
                    {STATUS_LABELS[name as keyof typeof STATUS_LABELS]}
                  </span>
                  <span className="ml-auto font-mono font-medium text-zinc-100">
                    {value}
                  </span>
                </div>
              )}
            />
          }
        />
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="status"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          strokeWidth={0}
          paddingAngle={2}
        />
      </PieChart>
    </ChartContainer>
  );
}
