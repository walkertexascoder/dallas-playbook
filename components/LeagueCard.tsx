"use client";

import Link from "next/link";
import { getSportColor } from "./SportFilter";

interface League {
  id: number;
  name: string;
  organization: string | null;
  sport: string;
  website: string;
  active: boolean;
}

interface LeagueCardProps {
  league: League;
  seasonCount?: number;
}

export default function LeagueCard({ league, seasonCount }: LeagueCardProps) {
  return (
    <Link
      href={`/leagues/${league.id}`}
      className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{league.name}</h3>
          {league.organization && (
            <p className="text-sm text-gray-500">{league.organization}</p>
          )}
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${getSportColor(
            league.sport
          )}`}
        >
          {league.sport}
        </span>
      </div>
      {seasonCount !== undefined && (
        <p className="text-sm text-gray-500 mt-2">
          {seasonCount} season{seasonCount !== 1 ? "s" : ""}
        </p>
      )}
    </Link>
  );
}
