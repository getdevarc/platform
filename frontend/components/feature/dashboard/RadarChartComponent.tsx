"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis
} from "recharts";

import { useTheme } from "next-themes";

interface RadarChartComponentProps {
  solvedCount: number;
}

export default function RadarChartComponent({ solvedCount }: RadarChartComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 280, height: 180 });
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);

    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, []);

  const radarData = [
    { subject: 'Arrays', A: solvedCount === 0 ? 0 : 120, fullMark: 150 },
    { subject: 'Strings', A: solvedCount === 0 ? 0 : 98, fullMark: 150 },
    { subject: 'DP', A: solvedCount === 0 ? 0 : 86, fullMark: 150 },
    { subject: 'Trees', A: solvedCount === 0 ? 0 : 99, fullMark: 150 },
    { subject: 'Graphs', A: solvedCount === 0 ? 0 : 85, fullMark: 150 },
    { subject: 'Sorting', A: solvedCount === 0 ? 0 : 65, fullMark: 155 },
  ];

  if (!mounted) {
    return <div className="w-full h-full bg-zinc-950/20 min-h-[180px]" />;
  }

  return (
    <div ref={containerRef} className="w-full h-full min-h-[180px] min-w-[0px] relative">
      <RadarChart 
        cx="50%" 
        cy="50%" 
        outerRadius="70%" 
        width={dimensions.width} 
        height={dimensions.height} 
        data={radarData}
      >
        <PolarGrid stroke={isDark ? "#27272a" : "#e2e8f0"} />
        <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 10, fontWeight: 700 }} />
        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
        <Radar
          name="Mastery"
          dataKey="A"
          stroke="#0ea5e9"
          fill="#0ea5e9"
          fillOpacity={0.15}
        />
      </RadarChart>
    </div>
  );
}
