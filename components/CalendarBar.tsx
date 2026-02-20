"use client";

import { getSportColor } from "./SportFilter";
import { Season } from "./SeasonDetail";

interface CalendarBarProps {
  season: Season;
  type: "signup" | "active";
  dayStart: number;
  dayEnd: number;
  totalDays: number;
  row: number;
  onClick: () => void;
}

export default function CalendarBar({
  season,
  type,
  dayStart,
  dayEnd,
  totalDays,
  row,
  onClick,
}: CalendarBarProps) {
  const colorClass = getSportColor(season.sport);
  const isSignup = type === "signup";

  // Calculate grid column positions (1-indexed, 1 extra for the header col)
  // dayStart is 1-indexed day of month
  const colStart = dayStart;
  const colEnd = dayEnd + 1; // grid-column-end is exclusive

  return (
    <button
      onClick={onClick}
      className={`absolute h-5 rounded text-[10px] font-medium text-white truncate px-1.5 leading-5 hover:opacity-90 transition-opacity cursor-pointer z-10 ${colorClass} ${
        isSignup ? "opacity-60 border border-dashed border-white/50" : ""
      }`}
      style={{
        gridColumnStart: colStart,
        gridColumnEnd: colEnd,
        top: `${row * 22 + 24}px`,
        left: `${((dayStart - 1) / totalDays) * 100}%`,
        width: `${((dayEnd - dayStart + 1) / totalDays) * 100}%`,
      }}
      title={`${season.name} (${isSignup ? "Sign-up" : "Season"})`}
    >
      {season.name}
    </button>
  );
}
