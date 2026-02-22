"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import SportFilter from "./SportFilter";
import SeasonDetail, { Season } from "./SeasonDetail";
import RegistrationDeadlines from "./RegistrationDeadlines";
import { getSportColor } from "./SportFilter";
import { getHiddenSeasonIds, getChildren } from "@/lib/preferences";
import { calculateAge, seasonMatchesAges } from "@/lib/age-utils";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface BarSegment {
  season: Season;
  type: "signup" | "active";
  startDay: number;
  endDay: number;
}

function getBarSegments(seasons: Season[], year: number, month: number): BarSegment[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const segments: BarSegment[] = [];

  for (const season of seasons) {
    if (season.signupStart && season.signupEnd) {
      const sStart = season.signupStart;
      const sEnd = season.signupEnd;
      if (sStart <= `${monthStr}-${String(daysInMonth).padStart(2, "0")}` && sEnd >= `${monthStr}-01`) {
        const startDay = sStart.startsWith(monthStr) ? parseInt(sStart.split("-")[2]) : 1;
        const endDay = sEnd.startsWith(monthStr) ? parseInt(sEnd.split("-")[2]) : daysInMonth;
        segments.push({ season, type: "signup", startDay, endDay });
      }
    }

    if (season.seasonStart && season.seasonEnd) {
      const sStart = season.seasonStart;
      const sEnd = season.seasonEnd;
      if (sStart <= `${monthStr}-${String(daysInMonth).padStart(2, "0")}` && sEnd >= `${monthStr}-01`) {
        const startDay = sStart.startsWith(monthStr) ? parseInt(sStart.split("-")[2]) : 1;
        const endDay = sEnd.startsWith(monthStr) ? parseInt(sEnd.split("-")[2]) : daysInMonth;
        segments.push({ season, type: "active", startDay, endDay });
      }
    }
  }

  return segments;
}

function formatDate(d: string | null): string {
  if (!d) return "TBD";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function daysUntilClose(signupEnd: string | null): number | null {
  if (!signupEnd) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(signupEnd + "T00:00:00");
  const diffMs = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays : null;
}

function isClosingSoon(signupEnd: string | null): boolean {
  const days = daysUntilClose(signupEnd);
  return days !== null && days <= 7;
}

function closingSoonText(days: number): string {
  if (days === 0) return "Closes today!";
  if (days === 1) return "Closes tomorrow!";
  return `Closes in ${days} days`;
}

export default function Calendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [sports, setSports] = useState<string[]>([]);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showDeadlines, setShowDeadlines] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  const [childAges, setChildAges] = useState<number[]>([]);
  const mobileDayDetailRef = useRef<HTMLDivElement>(null);

  const handleSelectDay = useCallback((day: number | null) => {
    setSelectedDay(day);
    if (day !== null) {
      // Scroll mobile day-detail into view after render
      setTimeout(() => {
        mobileDayDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 50);
    }
  }, []);

  // Load hidden preferences and children, listen for changes
  useEffect(() => {
    function loadPrefs() {
      setHiddenIds(getHiddenSeasonIds());
      setChildAges(getChildren().map((c) => calculateAge(c.birthdate)));
    }
    loadPrefs();
    window.addEventListener("preferences-changed", loadPrefs);
    return () => window.removeEventListener("preferences-changed", loadPrefs);
  }, []);

  const visibleSeasons = useMemo(
    () => seasons.filter((s) => !hiddenIds.has(s.id) && seasonMatchesAges(s.ageGroup, childAges)),
    [seasons, hiddenIds, childAges]
  );

  const ageFilteredCount = useMemo(
    () => childAges.length > 0 ? seasons.filter((s) => !seasonMatchesAges(s.ageGroup, childAges)).length : 0,
    [seasons, childAges]
  );

  const closingSoonSeasons = useMemo(
    () => visibleSeasons
      .map((s) => ({ season: s, days: daysUntilClose(s.signupEnd) }))
      .filter((x): x is { season: Season; days: number } => x.days !== null && x.days <= 7)
      .sort((a, b) => a.days - b.days),
    [visibleSeasons]
  );

  useEffect(() => {
    fetch("/api/sports")
      .then((r) => r.json())
      .then(setSports);
  }, []);

  useEffect(() => {
    setLoading(true);
    setSelectedDay(null);
    const params = new URLSearchParams({ month: String(month), year: String(year) });
    if (selectedSport) params.set("sport", selectedSport);
    fetch(`/api/seasons?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setSeasons(data);
        setLoading(false);
      });
  }, [month, year, selectedSport]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const today = now.getDate();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;

  const bars = useMemo(() => getBarSegments(visibleSeasons, year, month), [visibleSeasons, year, month]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else { setMonth(month - 1); }
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else { setMonth(month + 1); }
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function barsForDay(day: number) {
    return bars.filter((b) => b.startDay <= day && b.endDay >= day);
  }

  // Deduplicate: a season can appear twice (signup + active) for same day
  // Group by season id and merge types
  function eventsForDay(day: number) {
    const dayBars = barsForDay(day);
    const map = new Map<number, { season: Season; types: Set<string> }>();
    for (const bar of dayBars) {
      const existing = map.get(bar.season.id);
      if (existing) {
        existing.types.add(bar.type);
      } else {
        map.set(bar.season.id, { season: bar.season, types: new Set([bar.type]) });
      }
    }
    return Array.from(map.values());
  }

  const selectedDayEvents = selectedDay ? eventsForDay(selectedDay) : [];

  const MAX_VISIBLE_BARS = 3;

  return (
    <div>
      <div className="mb-6">
        <SportFilter sports={sports} selected={selectedSport} onSelect={setSelectedSport} />
      </div>

      {closingSoonSeasons.length > 0 && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Registration Closing Soon
          </h3>
          <div className="space-y-1">
            {closingSoonSeasons.map(({ season, days }) => (
              <button
                key={season.id}
                onClick={() => setSelectedSeason(season)}
                className="w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getSportColor(season.sport)}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{season.name}</p>
                  <p className="text-xs text-gray-500 truncate">{season.leagueName}</p>
                </div>
                <span className={`text-xs font-bold shrink-0 ${days <= 2 ? "text-red-600" : "text-orange-600"}`}>
                  {closingSoonText(days)}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowDeadlines(true)}
            className="mt-3 text-sm text-orange-700 hover:text-orange-900 transition-colors"
          >
            View all registration deadlines &rarr;
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Calendar */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-xl font-bold text-gray-900">
                {MONTH_NAMES[month - 1]} {year}
              </h2>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 px-6 py-2 border-b border-gray-100 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className="w-8 h-3 rounded bg-gray-400 opacity-60 border border-dashed border-white/50" />
                Sign-up Period
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-8 h-3 rounded bg-gray-400" />
                Active Season
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>
            ) : (
              <div className="grid grid-cols-7">
                {cells.map((day, idx) => {
                  const dayBars = day ? barsForDay(day) : [];
                  const isToday = isCurrentMonth && day === today;
                  const isSelected = day === selectedDay;
                  const startingBars = dayBars.filter((b) => b.startDay === day);
                  const continuingCount = dayBars.length - startingBars.length;
                  const totalCount = dayBars.length;

                  return (
                    <div
                      key={idx}
                      onClick={() => day && handleSelectDay(isSelected ? null : day)}
                      className={`min-h-[60px] sm:min-h-[100px] border-b border-r border-gray-100 p-1 transition-colors ${
                        day ? "cursor-pointer hover:bg-blue-50" : "bg-gray-50"
                      } ${isSelected ? "bg-blue-50 ring-2 ring-blue-400 ring-inset" : ""}`}
                    >
                      {day && (
                        <>
                          <div className="flex items-center justify-between mb-0.5">
                            <div
                              className={`text-sm ${
                                isToday
                                  ? "bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold"
                                  : "text-gray-700"
                              }`}
                            >
                              {day}
                            </div>
                            {totalCount > 0 && (
                              <span className="text-[10px] text-gray-400 font-medium">
                                {totalCount}
                              </span>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            {startingBars.slice(0, MAX_VISIBLE_BARS).map((bar, bIdx) => {
                              const closing = bar.type === "signup" && isClosingSoon(bar.season.signupEnd);
                              return (
                                <div
                                  key={`${bar.season.id}-${bar.type}-${bIdx}`}
                                  className={`rounded relative ${getSportColor(
                                    bar.season.sport
                                  )} ${
                                    bar.type === "signup"
                                      ? closing
                                        ? "border border-orange-400"
                                        : "opacity-60 border border-dashed border-white/40"
                                      : ""
                                  }`}
                                >
                                  <span className="hidden sm:block text-[10px] leading-4 px-1 truncate text-white">
                                    {bar.season.name}
                                  </span>
                                  <span className="block sm:hidden w-full h-1.5 rounded" />
                                  {closing && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                                  )}
                                </div>
                              );
                            })}
                            {startingBars.length > MAX_VISIBLE_BARS && (
                              <div className="text-[10px] text-gray-500 px-1">
                                +{startingBars.length - MAX_VISIBLE_BARS} starting
                              </div>
                            )}
                            {startingBars.length === 0 && continuingCount > 0 && (
                              <div className="flex flex-wrap gap-0.5 px-0.5">
                                {dayBars.slice(0, 5).map((bar, bIdx) => (
                                  <span
                                    key={`dot-${bar.season.id}-${bar.type}-${bIdx}`}
                                    className={`w-1.5 h-1.5 rounded-full ${getSportColor(bar.season.sport)} ${
                                      bar.type === "signup" ? "opacity-60" : ""
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Season count */}
          <p className="text-sm text-gray-500 mt-3 text-center">
            {visibleSeasons.length} season{visibleSeasons.length !== 1 ? "s" : ""} shown
            {selectedSport ? ` for ${selectedSport}` : ""}
            {(hiddenIds.size > 0 || ageFilteredCount > 0) && (
              <span className="text-gray-400">
                {" ("}
                {hiddenIds.size > 0 && <>{hiddenIds.size} hidden</>}
                {hiddenIds.size > 0 && ageFilteredCount > 0 && ", "}
                {ageFilteredCount > 0 && <>{ageFilteredCount} filtered by age</>}
                {")"}
              </span>
            )}
          </p>

          {/* Mobile day detail (below lg only) */}
          {selectedDay && (
            <div ref={mobileDayDetailRef} className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 lg:hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="font-bold text-gray-900">
                  {MONTH_NAMES[month - 1]} {selectedDay}, {year}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? "s" : ""}
                </p>
              </div>
              {selectedDayEvents.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  No events on this day
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {selectedDayEvents.map(({ season, types }) => (
                    <button
                      key={season.id}
                      onClick={() => setSelectedSeason(season)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${getSportColor(season.sport)}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{season.name}</p>
                          <p className="text-xs text-gray-500 truncate">{season.leagueName}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {types.has("signup") && (
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                isClosingSoon(season.signupEnd) ? "bg-orange-100 text-orange-800" : "bg-yellow-100 text-yellow-800"
                              }`}>
                                {isClosingSoon(season.signupEnd)
                                  ? closingSoonText(daysUntilClose(season.signupEnd)!)
                                  : `Registration ${season.signupStart && season.signupEnd
                                      ? `${formatDate(season.signupStart)} – ${formatDate(season.signupEnd)}`
                                      : "Open"}`
                                }
                              </span>
                            )}
                            {types.has("active") && (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                                In Season {season.seasonStart && season.seasonEnd
                                  ? `${formatDate(season.seasonStart)} – ${formatDate(season.seasonEnd)}`
                                  : ""}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-3 mt-1.5 text-xs text-gray-500">
                            {season.ageGroup && (
                              <span>Ages {season.ageGroup}</span>
                            )}
                            <span>{season.sport}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Day detail panel */}
        <div className="w-80 shrink-0 hidden lg:block">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-20">
            {selectedDay ? (
              <>
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900">
                    {MONTH_NAMES[month - 1]} {selectedDay}, {year}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
                  {selectedDayEvents.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-400">
                      No events on this day
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {selectedDayEvents.map(({ season, types }) => (
                        <button
                          key={season.id}
                          onClick={() => setSelectedSeason(season)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${getSportColor(season.sport)}`} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{season.name}</p>
                              <p className="text-xs text-gray-500 truncate">{season.leagueName}</p>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {types.has("signup") && (
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800">
                                    Registration {season.signupStart && season.signupEnd
                                      ? `${formatDate(season.signupStart)} – ${formatDate(season.signupEnd)}`
                                      : "Open"}
                                  </span>
                                )}
                                {types.has("active") && (
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                                    In Season {season.seasonStart && season.seasonEnd
                                      ? `${formatDate(season.seasonStart)} – ${formatDate(season.seasonEnd)}`
                                      : ""}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-3 mt-1.5 text-xs text-gray-500">
                                {season.ageGroup && (
                                  <span>Ages {season.ageGroup}</span>
                                )}
                                <span>{season.sport}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="px-4 py-12 text-center">
                <p className="text-sm text-gray-400">Click a day to see all events</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Registration deadlines modal */}
      {showDeadlines && (
        <RegistrationDeadlines
          seasons={visibleSeasons}
          onClose={() => setShowDeadlines(false)}
          onSelectSeason={(season) => {
            setShowDeadlines(false);
            setSelectedSeason(season);
          }}
        />
      )}

      {/* Detail modal */}
      {selectedSeason && (
        <SeasonDetail season={selectedSeason} onClose={() => setSelectedSeason(null)} />
      )}
    </div>
  );
}
