"use client";

import { useState, useEffect, useMemo } from "react";
import SportFilter from "./SportFilter";
import SeasonDetail, { Season } from "./SeasonDetail";
import { getSportColor } from "./SportFilter";

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

export default function Calendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [sports, setSports] = useState<string[]>([]);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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

  const bars = useMemo(() => getBarSegments(seasons, year, month), [seasons, year, month]);

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
            <div className="flex gap-4 px-6 py-2 border-b border-gray-100 text-xs text-gray-500">
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
                      onClick={() => day && setSelectedDay(isSelected ? null : day)}
                      className={`min-h-[100px] border-b border-r border-gray-100 p-1 transition-colors ${
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
                            {startingBars.slice(0, MAX_VISIBLE_BARS).map((bar, bIdx) => (
                              <div
                                key={`${bar.season.id}-${bar.type}-${bIdx}`}
                                className={`text-[10px] leading-4 px-1 rounded truncate text-white ${getSportColor(
                                  bar.season.sport
                                )} ${
                                  bar.type === "signup"
                                    ? "opacity-60 border border-dashed border-white/40"
                                    : ""
                                }`}
                              >
                                {bar.season.name}
                              </div>
                            ))}
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
            {seasons.length} season{seasons.length !== 1 ? "s" : ""} found
            {selectedSport ? ` for ${selectedSport}` : ""}
          </p>
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

      {/* Detail modal */}
      {selectedSeason && (
        <SeasonDetail season={selectedSeason} onClose={() => setSelectedSeason(null)} />
      )}
    </div>
  );
}
