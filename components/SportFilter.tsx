"use client";

const SPORT_COLORS: Record<string, string> = {
  Soccer: "bg-green-500",
  Basketball: "bg-orange-500",
  Baseball: "bg-red-500",
  Football: "bg-amber-700",
  Volleyball: "bg-purple-500",
  Swimming: "bg-blue-500",
  "Multi-Sport": "bg-gray-500",
};

export function getSportColor(sport: string): string {
  return SPORT_COLORS[sport] || "bg-gray-400";
}

export function getSportBorderColor(sport: string): string {
  const map: Record<string, string> = {
    Soccer: "border-green-500",
    Basketball: "border-orange-500",
    Baseball: "border-red-500",
    Football: "border-amber-700",
    Volleyball: "border-purple-500",
    Swimming: "border-blue-500",
    "Multi-Sport": "border-gray-500",
  };
  return map[sport] || "border-gray-400";
}

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
