"use client";

import { getSportColor } from "@/lib/sport-colors";
export { getSportColor };

interface SportFilterProps {
  sports: string[];
  selected: string | null;
  onSelect: (sport: string | null) => void;
}

export default function SportFilter({
  sports,
  selected,
  onSelect,
}: SportFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          selected === null
            ? "bg-gray-900 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        All Sports
      </button>
      {sports.map((sport) => (
        <button
          key={sport}
          onClick={() => onSelect(selected === sport ? null : sport)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
            selected === sport
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${getSportColor(sport)}`}
          />
          {sport}
        </button>
      ))}
    </div>
  );
}
