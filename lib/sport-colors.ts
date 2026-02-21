// Colorblind-safe palette — varies in both hue and lightness so colors
// remain distinguishable under deuteranopia, protanopia, and tritanopia.
const SPORT_COLORS: Record<string, string> = {
  Soccer: "bg-blue-600",
  Basketball: "bg-amber-500",
  Baseball: "bg-rose-800",
  Football: "bg-teal-400",
  Volleyball: "bg-violet-600",
  Swimming: "bg-sky-400",
  "Multi-Sport": "bg-slate-500",
  Softball: "bg-pink-400",
  Tennis: "bg-yellow-500",
  Lacrosse: "bg-indigo-400",
  Cheerleading: "bg-fuchsia-600",
};

export function getSportColor(sport: string): string {
  return SPORT_COLORS[sport] || "bg-gray-400";
}
