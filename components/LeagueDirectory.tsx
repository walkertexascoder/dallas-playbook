"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getSportColor } from "@/lib/sport-colors";
import { getHiddenSeasonIds } from "@/lib/preferences";

interface League {
  id: number;
  name: string;
  organization: string | null;
  sport: string;
  website: string;
}

interface Season {
  id: number;
  leagueId: number;
  name: string;
  sport: string;
  signupStart: string | null;
  signupEnd: string | null;
  seasonStart: string | null;
  seasonEnd: string | null;
  ageGroup: string | null;
  detailsUrl: string | null;
}

function formatDate(d: string | null): string {
  if (!d) return "TBD";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function dateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export default function LeagueDirectory({
  leagues,
  seasons,
}: {
  leagues: League[];
  seasons: Season[];
}) {
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    function loadPrefs() {
      setHiddenIds(getHiddenSeasonIds());
    }
    loadPrefs();
    window.addEventListener("preferences-changed", loadPrefs);
    return () => window.removeEventListener("preferences-changed", loadPrefs);
  }, []);

  const seasonsByLeague = useMemo(() => {
    const map = new Map<number, Season[]>();
    for (const s of seasons) {
      if (!map.has(s.leagueId)) map.set(s.leagueId, []);
      map.get(s.leagueId)!.push(s);
    }
    return map;
  }, [seasons]);

  // Group leagues by sport
  const grouped = useMemo(() => {
    const map = new Map<string, League[]>();
    for (const league of leagues) {
      if (!map.has(league.sport)) map.set(league.sport, []);
      map.get(league.sport)!.push(league);
    }
    return map;
  }, [leagues]);

  const sortedSports = useMemo(
    () => Array.from(grouped.keys()).sort(),
    [grouped]
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        League Directory
      </h1>
      <p className="text-gray-600 mb-6">
        {leagues.length} youth sports organizations tracked across Dallas
      </p>

      {sortedSports.map((sport) => (
        <div key={sport} className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${getSportColor(sport)}`}
            />
            {sport}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {grouped.get(sport)!.map((league) => {
              const leagueSeasons = seasonsByLeague.get(league.id) || [];
              const visible = leagueSeasons.filter(
                (s) => !hiddenIds.has(s.id)
              );
              const hidden = leagueSeasons.filter((s) =>
                hiddenIds.has(s.id)
              );

              return (
                <div
                  key={league.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
                >
                  <Link href={`/leagues/${league.id}`}>
                    <h3 className="font-semibold text-gray-900">
                      {league.name}
                    </h3>
                    {league.organization && (
                      <p className="text-sm text-gray-500">
                        {league.organization}
                      </p>
                    )}
                  </Link>

                  {leagueSeasons.length === 0 ? (
                    <p className="text-sm text-gray-400 mt-2">
                      No known upcoming seasons. Reach out to me if you know they exist.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {visible.map((s) => (
                        <SeasonRow key={s.id} season={s} />
                      ))}
                      {hidden.length > 0 && (
                        <HiddenSeasons seasons={hidden} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function SeasonRow({ season }: { season: Season }) {
  const reg = dateRange(season.signupStart, season.signupEnd);
  const play = dateRange(season.seasonStart, season.seasonEnd);

  return (
    <div className="text-sm border-l-2 border-gray-200 pl-2">
      <p className="font-medium text-gray-800 leading-tight">{season.name}</p>
      {reg && (
        <p className="text-xs text-gray-500">
          <span className="font-medium">Reg:</span> {reg}
        </p>
      )}
      {play && (
        <p className="text-xs text-gray-500">
          <span className="font-medium">Season:</span> {play}
        </p>
      )}
    </div>
  );
}

function HiddenSeasons({ seasons }: { seasons: Season[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        {expanded ? "Hide" : "Show"} {seasons.length} hidden season
        {seasons.length !== 1 ? "s" : ""}
      </button>
      {expanded && (
        <div className="mt-1 space-y-1.5 opacity-50">
          {seasons.map((s) => (
            <SeasonRow key={s.id} season={s} />
          ))}
        </div>
      )}
    </div>
  );
}
