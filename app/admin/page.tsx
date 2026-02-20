"use client";

import { useState, useEffect } from "react";
import { getSportColor } from "@/lib/sport-colors";

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
  visible: boolean;
  leagueName: string;
  organization: string | null;
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Set<number>>(new Set());
  const [filterSport, setFilterSport] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/seasons?includeHidden=true")
      .then((r) => r.json())
      .then((data) => {
        setSeasons(data);
        setLoading(false);
      });
  }, []);

  async function toggleVisibility(season: Season) {
    setUpdating((prev) => new Set(prev).add(season.id));

    const newVisible = !season.visible;
    await fetch("/api/seasons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: season.id, visible: newVisible }),
    });

    setSeasons((prev) =>
      prev.map((s) => (s.id === season.id ? { ...s, visible: newVisible } : s))
    );
    setUpdating((prev) => {
      const next = new Set(prev);
      next.delete(season.id);
      return next;
    });
  }

  async function bulkToggle(sport: string, visible: boolean) {
    const affected = seasons.filter((s) => s.sport === sport);
    for (const season of affected) {
      if (season.visible !== visible) {
        await fetch("/api/seasons", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: season.id, visible }),
        });
      }
    }
    setSeasons((prev) =>
      prev.map((s) => (s.sport === sport ? { ...s, visible } : s))
    );
  }

  // Group by sport, then by league
  const sports = Array.from(new Set(seasons.map((s) => s.sport))).sort();
  const filtered = filterSport ? seasons.filter((s) => s.sport === filterSport) : seasons;

  const groupedBySport = new Map<string, Map<string, Season[]>>();
  for (const season of filtered) {
    if (!groupedBySport.has(season.sport)) groupedBySport.set(season.sport, new Map());
    const leagueMap = groupedBySport.get(season.sport)!;
    const key = season.leagueName;
    if (!leagueMap.has(key)) leagueMap.set(key, []);
    leagueMap.get(key)!.push(season);
  }

  const visibleCount = seasons.filter((s) => s.visible).length;
  const hiddenCount = seasons.filter((s) => !s.visible).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Program Visibility</h1>
        <p className="text-gray-600 mt-1">
          Choose which programs appear on the calendar.
          {" "}<span className="font-medium text-green-700">{visibleCount} visible</span>
          {hiddenCount > 0 && (
            <>, <span className="font-medium text-gray-500">{hiddenCount} hidden</span></>
          )}
        </p>
      </div>

      {/* Sport filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterSport(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filterSport === null ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Sports
        </button>
        {sports.map((sport) => {
          const sportSeasons = seasons.filter((s) => s.sport === sport);
          const sportVisible = sportSeasons.filter((s) => s.visible).length;
          return (
            <button
              key={sport}
              onClick={() => setFilterSport(filterSport === sport ? null : sport)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                filterSport === sport ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${getSportColor(sport)}`} />
              {sport}
              <span className="text-xs opacity-60">
                {sportVisible}/{sportSeasons.length}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-8">
          {Array.from(groupedBySport.entries()).map(([sport, leagueMap]) => {
            const allSportSeasons = Array.from(leagueMap.values()).flat();
            const allVisible = allSportSeasons.every((s) => s.visible);
            const noneVisible = allSportSeasons.every((s) => !s.visible);

            return (
              <div key={sport}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${getSportColor(sport)}`} />
                    {sport}
                    <span className="text-sm font-normal text-gray-500">
                      ({allSportSeasons.filter((s) => s.visible).length}/{allSportSeasons.length})
                    </span>
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => bulkToggle(sport, true)}
                      disabled={allVisible}
                      className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Show All
                    </button>
                    <button
                      onClick={() => bulkToggle(sport, false)}
                      disabled={noneVisible}
                      className="text-xs px-2 py-1 rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Hide All
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {Array.from(leagueMap.entries()).map(([leagueName, leagueSeasons]) => (
                    <div key={leagueName} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-700">{leagueName}</span>
                        {leagueSeasons[0].organization && (
                          <span className="text-xs text-gray-500 ml-2">{leagueSeasons[0].organization}</span>
                        )}
                      </div>
                      <div className="divide-y divide-gray-50">
                        {leagueSeasons.map((season) => (
                          <div
                            key={season.id}
                            className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                              season.visible ? "" : "opacity-50"
                            }`}
                          >
                            <button
                              onClick={() => toggleVisibility(season)}
                              disabled={updating.has(season.id)}
                              className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${
                                season.visible ? "bg-green-500" : "bg-gray-300"
                              } ${updating.has(season.id) ? "opacity-50" : ""}`}
                            >
                              <span
                                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                                  season.visible ? "left-[18px]" : "left-0.5"
                                }`}
                              />
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {season.name}
                              </p>
                              <div className="flex gap-3 text-xs text-gray-500">
                                {season.ageGroup && <span>Ages {season.ageGroup}</span>}
                                {season.signupStart && (
                                  <span>Registration: {formatDate(season.signupStart)} – {formatDate(season.signupEnd)}</span>
                                )}
                                {season.seasonStart && (
                                  <span>Season: {formatDate(season.seasonStart)} – {formatDate(season.seasonEnd)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
