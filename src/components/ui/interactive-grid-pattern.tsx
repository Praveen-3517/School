"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface InteractiveGridPatternProps {
  width?: number;
  height?: number;
  squares?: [number, number];
  className?: string;
  squaresClassName?: string;
}

export function InteractiveGridPattern({
  width = 40,
  height = 40,
  squares = [24, 24],
  className,
  squaresClassName,
}: InteractiveGridPatternProps) {
  const [columns, rows] = squares;
  const [hoveredSquare, setHoveredSquare] = useState<number | null>(null);

  return (
    <svg
      width={width * columns}
      height={height * rows}
      className={cn(
        "absolute inset-0 h-full w-full",
        className
      )}
    >
      <defs>
        <pattern
          id="interactive-grid-pattern"
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            className="stroke-gray-400/20 dark:stroke-gray-500/20"
          />
        </pattern>
      </defs>
      
      <rect width="100%" height="100%" fill="url(#interactive-grid-pattern)" />

      <svg x={0} y={0} className="overflow-visible">
        {Array.from({ length: columns * rows }).map((_, index) => {
          const x = (index % columns) * width;
          const y = Math.floor(index / columns) * height;

          return (
            <rect
              key={index}
              x={x}
              y={y}
              width={width}
              height={height}
              className={cn(
                "transition-all duration-300 ease-in-out pointer-events-auto",
                hoveredSquare === index
                  ? "fill-gray-300/30 dark:fill-gray-400/30"
                  : "fill-transparent",
                squaresClassName
              )}
              onMouseEnter={() => setHoveredSquare(index)}
              onMouseLeave={() => setHoveredSquare(null)}
            />
          );
        })}
      </svg>
    </svg>
  );
}
