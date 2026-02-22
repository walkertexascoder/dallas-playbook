"use client";

import { useState, useEffect } from "react";
import { getSportColor } from "@/lib/sport-colors";
import { getHiddenSeasonIds, toggleSeasonVisibility, bulkSetVisibility, getChildren, addChild, removeChild, type ChildEntry } from "@/lib/preferences";
import { calculateAge, seasonMatchesAges } from "@/lib/age-utils";

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

export default function SettingsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  const [filterSport, setFilterSport] = useState<string | null>(null);
  const [children, setChildrenState] = useState<ChildEntry[]>([]);
  const [newBirthdate, setNewBirthdate] = useState("");

  useEffect(() => {
    setHiddenIds(getHiddenSeasonIds());
    setChildrenState(getChildren());
    fetch("/api/seasons")
      .then((r) => r.json())
      .then((data) => {
        setSeasons(data);
        setLoading(false);
      });
  }, []);

  const childAges = children.map((c) => calculateAge(c.birthdate));

  const ageMatchCount = seasons.filter((s) => seasonMatchesAges(s.ageGroup, childAges)).length;

  function handleAddChild() {
    if (!newBirthdate) return;
    addChild(newBirthdate);
    setChildrenState(getChildren());
    setNewBirthdate("");
  }

  function handleRemoveChild(id: string) {
    removeChild(id);
    setChildrenState(getChildren());
  }

  const notMatchingIds = seasons.filter((s) => !seasonMatchesAges(s.ageGroup, childAges)).map((s) => s.id);
  const ageFilterApplied = notMatchingIds.length > 0 && notMatchingIds.every((id) => hiddenIds.has(id));

  function handleToggleAgeFilter() {
    if (ageFilterApplied) {
      // Show all
      bulkSetVisibility(seasons.map((s) => s.id), true);
    } else {
      // Hide non-matching, show matching
      const matching = seasons.filter((s) => seasonMatchesAges(s.ageGroup, childAges)).map((s) => s.id);
      bulkSetVisibility(matching, true);
      bulkSetVisibility(notMatchingIds, false);
    }
    setHiddenIds(getHiddenSeasonIds());
  }

  function handleToggle(id: number) {
    toggleSeasonVisibility(id);
    setHiddenIds(getHiddenSeasonIds());
  }

  function handleBulkToggle(sport: string, visible: boolean) {
    const ids = seasons.filter((s) => s.sport === sport).map((s) => s.id);
    bulkSetVisibility(ids, visible);
    setHiddenIds(getHiddenSeasonIds());
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

  const visibleCount = seasons.filter((s) => !hiddenIds.has(s.id)).length;
  const hiddenCount = seasons.filter((s) => hiddenIds.has(s.id)).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Choose which programs appear on your calendar. Your preferences are saved in this browser.
          {" "}<span className="font-medium text-green-700">{visibleCount} visible</span>
          {hiddenCount > 0 && (
            <>, <span className="font-medium text-gray-500">{hiddenCount} hidden</span></>
          )}
        </p>
      </div>

      {/* My Children */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-1">My Children</h2>
        <p className="text-xs text-gray-400 mb-3">Add your children to filter the calendar to only show seasons they&apos;re eligible for.</p>
        <div className="flex flex-wrap gap-2 mb-3">
          <input
            type="date"
            value={newBirthdate}
            onChange={(e) => setNewBirthdate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            max={new Date().toISOString().split("T")[0]}
          />
          <button
            onClick={handleAddChild}
            disabled={!newBirthdate}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add Child
          </button>
        </div>
        {children.length === 0 ? (
          <p className="text-sm text-gray-400">No children added. All age groups will be shown.</p>
        ) : (
          <>
            <div className="space-y-2">
              {children.map((child, i) => {
                const age = calculateAge(child.birthdate);
                const born = new Date(child.birthdate + "T00:00:00").toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                return (
                  <div key={child.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-gray-700">
                      Child {i + 1} — Age {age} <span className="text-gray-400">(born {born})</span>
                    </span>
                    <button
                      onClick={() => handleRemoveChild(child.id)}
                      className="text-red-400 hover:text-red-600 text-sm transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2 mt-3">
              <p className="text-xs text-gray-500">
                {ageMatchCount} of {seasons.length} seasons match your children&apos;s ages
              </p>
              <button
                onClick={handleToggleAgeFilter}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  ageFilterApplied
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}
              >
                {ageFilterApplied ? "Show all" : "Only show matching"}
              </button>
            </div>
          </>
        )}
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
          const sportVisible = sportSeasons.filter((s) => !hiddenIds.has(s.id)).length;
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
            const allVisible = allSportSeasons.every((s) => !hiddenIds.has(s.id));
            const noneVisible = allSportSeasons.every((s) => hiddenIds.has(s.id));

            return (
              <div key={sport}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${getSportColor(sport)}`} />
                    {sport}
                    <span className="text-sm font-normal text-gray-500">
                      ({allSportSeasons.filter((s) => !hiddenIds.has(s.id)).length}/{allSportSeasons.length})
                    </span>
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkToggle(sport, true)}
                      disabled={allVisible}
                      className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Show All
                    </button>
                    <button
                      onClick={() => handleBulkToggle(sport, false)}
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
                        {leagueSeasons.map((season) => {
                          const isVisible = !hiddenIds.has(season.id);
                          return (
                            <div
                              key={season.id}
                              className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                                isVisible ? "" : "opacity-50"
                              }`}
                            >
                              <button
                                onClick={() => handleToggle(season.id)}
                                className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${
                                  isVisible ? "bg-green-500" : "bg-gray-300"
                                }`}
                              >
                                <span
                                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                                    isVisible ? "left-[18px]" : "left-0.5"
                                  }`}
                                />
                              </button>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {season.name}
                                </p>
                                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
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
                          );
                        })}
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
