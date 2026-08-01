"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TasteAxis, TasteAxisCode } from "@/types/api";

const AXIS_ORDER: TasteAxisCode[] = [
  "growth",
  "catharsis",
  "immersion",
  "relationships",
  "worldbuilding",
];

const AXIS_FALLBACK_LABEL: Record<TasteAxisCode, string> = {
  growth: "성장감",
  catharsis: "통쾌함",
  immersion: "몰입감",
  relationships: "관계성",
  worldbuilding: "세계관",
};

type TasteRadarChartProps = {
  axes: TasteAxis[];
  animated?: boolean;
  className?: string;
};

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, score));
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleIndex: number,
  total: number
) {
  const angle = (Math.PI * 2 * angleIndex) / total - Math.PI / 2;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function pointsToPath(
  points: Array<{ x: number; y: number }>,
  close = true
): string {
  if (points.length === 0) return "";
  const body = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
  return close ? `${body} Z` : body;
}

export function hasValidRadarAxes(axes: TasteAxis[] | null | undefined): boolean {
  if (!axes || axes.length !== 5) return false;
  const codes = new Set(axes.map((a) => a.code));
  return AXIS_ORDER.every((code) => codes.has(code));
}

export function TasteRadarChart({
  axes,
  animated = true,
  className,
}: TasteRadarChartProps) {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = animated && !reduceMotion;

  const ordered = useMemo(() => {
    const byCode = new Map(axes.map((a) => [a.code, a]));
    return AXIS_ORDER.map((code) => {
      const found = byCode.get(code);
      return {
        code,
        label: found?.label || AXIS_FALLBACK_LABEL[code],
        score: clampScore(found?.score ?? 0),
      };
    });
  }, [axes]);

  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 88;
  const levels = 4;

  const gridPolys = useMemo(
    () =>
      Array.from({ length: levels }, (_, i) => {
        const r = (maxR * (i + 1)) / levels;
        return pointsToPath(
          AXIS_ORDER.map((_, idx) => polarToCartesian(cx, cy, r, idx, 5))
        );
      }),
    [cx, cy]
  );

  const axisLines = useMemo(
    () =>
      AXIS_ORDER.map((_, idx) => {
        const tip = polarToCartesian(cx, cy, maxR, idx, 5);
        return { x1: cx, y1: cy, x2: tip.x, y2: tip.y };
      }),
    [cx, cy]
  );

  const dataPoints = useMemo(
    () =>
      ordered.map((axis, idx) =>
        polarToCartesian(cx, cy, (maxR * axis.score) / 100, idx, 5)
      ),
    [ordered, cx, cy]
  );

  const dataPath = pointsToPath(dataPoints);
  const labelPoints = useMemo(
    () =>
      ordered.map((axis, idx) => ({
        ...axis,
        ...polarToCartesian(cx, cy, maxR + 28, idx, 5),
      })),
    [ordered, cx, cy]
  );

  return (
    <div className={cn("mx-auto w-full max-w-[320px]", className)}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="취향 5축 레이더 차트"
        className="h-auto w-full"
      >
        <motion.g
          initial={shouldAnimate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          {gridPolys.map((d, i) => (
            <path
              key={`grid-${i}`}
              d={d}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
          ))}
        </motion.g>

        <motion.g
          initial={shouldAnimate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: shouldAnimate ? 0.15 : 0 }}
        >
          {axisLines.map((line, i) => (
            <line
              key={`axis-${i}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={1}
            />
          ))}
        </motion.g>

        <motion.path
          d={dataPath}
          fill="rgba(95,52,254,0.28)"
          stroke="#7C5CFC"
          strokeWidth={2}
          initial={
            shouldAnimate
              ? { scale: 0.15, opacity: 0, transformOrigin: `${cx}px ${cy}px` }
              : false
          }
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: shouldAnimate ? 0.55 : 0,
            delay: shouldAnimate ? 0.35 : 0,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {dataPoints.map((point, i) => (
          <motion.circle
            key={`dot-${i}`}
            cx={point.x}
            cy={point.y}
            r={3.5}
            fill="#7C5CFC"
            stroke="#0F1014"
            strokeWidth={1.5}
            initial={shouldAnimate ? { opacity: 0, scale: 0 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: shouldAnimate ? 0.75 + i * 0.04 : 0,
              duration: 0.2,
            }}
          />
        ))}

        {labelPoints.map((point, i) => (
          <motion.g
            key={`label-${point.code}`}
            initial={shouldAnimate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ delay: shouldAnimate ? 0.9 + i * 0.03 : 0 }}
          >
            <text
              x={point.x}
              y={point.y - 6}
              textAnchor="middle"
              className="fill-foreground"
              style={{ fontSize: 11, fontWeight: 600 }}
            >
              {point.label}
            </text>
            <text
              x={point.x}
              y={point.y + 8}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: 10 }}
            >
              {point.score}
            </text>
          </motion.g>
        ))}
      </svg>
    </div>
  );
}
