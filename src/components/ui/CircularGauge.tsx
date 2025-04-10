import React from "react";
import { cn } from "@/lib/utils";

interface CircularGaugeProps {
  value: number;
  maxValue: number;
  size?: number;
  thickness?: number;
  className?: string;
  colorByValue?: boolean;
  showValue?: boolean;
  label?: string;
  valueFormatter?: (value: number) => string;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  maxValue,
  size = 120,
  thickness = 8,
  className,
  colorByValue = true,
  showValue = true,
  label,
  valueFormatter,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (!colorByValue) return "stroke-primary";
    if (percentage <= 25) return "stroke-destructive";
    if (percentage <= 50) return "stroke-orange-500";
    if (percentage <= 75) return "stroke-yellow-500";
    return "stroke-emerald-500";
  };

  const formattedValue = valueFormatter
    ? valueFormatter(value)
    : value.toString();

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center",
        className
      )}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          className="stroke-muted"
        />

        {/* Foreground circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset.toString()}
          strokeLinecap="round"
          className={cn("transition-all duration-500 ease-out", getColor())}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {showValue && (
          <span className="text-lg font-medium">{formattedValue}</span>
        )}
        {label && (
          <span className="text-xs text-muted-foreground">{label}</span>
        )}
      </div>
    </div>
  );
};

export default CircularGauge;
