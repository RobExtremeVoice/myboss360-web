type DashboardSparklineProps = {
  points: number[];
  tone: "up" | "flat" | "attention";
};

const strokeMap = {
  up: "#059669",
  flat: "#475569",
  attention: "#d97706",
} as const;

export function DashboardSparkline({
  points,
  tone,
}: DashboardSparklineProps) {
  const width = 120;
  const height = 40;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const coordinates = points
    .map((point, index) => {
      const x = (index / (points.length - 1 || 1)) * width;
      const y = height - ((point - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-10 w-28"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke="rgba(148,163,184,0.18)"
        strokeWidth="1"
        points={`0,${height - 4} ${width},${height - 4}`}
      />
      <polyline
        fill="none"
        stroke={strokeMap[tone]}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coordinates}
      />
    </svg>
  );
}
