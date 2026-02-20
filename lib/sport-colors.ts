const SPORT_COLORS: Record<string, string> = {
  Soccer: "bg-green-500",
  Basketball: "bg-orange-500",
  Baseball: "bg-red-500",
  Football: "bg-amber-700",
  Volleyball: "bg-purple-500",
  Swimming: "bg-blue-500",
  "Multi-Sport": "bg-gray-500",
  Softball: "bg-pink-500",
  Tennis: "bg-lime-500",
  Lacrosse: "bg-teal-500",
  Cheerleading: "bg-rose-400",
};

export function getSportColor(sport: string): string {
  return SPORT_COLORS[sport] || "bg-gray-400";
}
