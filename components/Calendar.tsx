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
    // Signup bar
    if (season.signupStart && season.signupEnd) {
      const sStart = season.signupStart;
      const sEnd = season.signupEnd;
      if (sStart <= `${monthStr}-${String(daysInMonth).padStart(2, "0")}` && sEnd >= `${monthStr}-01`) {
        const startDay = sStart.startsWith(monthStr)
          ? parseInt(sStart.split("-")[2])
          : 1;
        const endDay = sEnd.startsWith(monthStr)
          ? parseInt(sEnd.split("-")[2])
          : daysInMonth;
        segments.push({ season, type: "signup", startDay, endDay });
      }
    }

    // Active season bar
    if (season.seasonStart && season.seasonEnd) {
      const sStart = season.seasonStart;
      const sEnd = season.seasonEnd;
      if (sStart <= `${monthStr}-${String(daysInMonth).padStart(2, "0")}` && sEnd >= `${monthStr}-01`) {
        const startDay = sStart.startsWith(monthStr)
          ? parseInt(sStart.split("-")[2])
          : 1;
        const endDay = sEnd.startsWith(monthStr)
          ? parseInt(sEnd.split("-")[2])
          : daysInMonth;
        segments.push({ season, type: "active", startDay, endDay });
      }
    }
  }

  return segments;
}

export default function Calendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [sports, setSports] = useState<string[]>([]);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sports")
      .then((r) => r.json())
      .then(setSports);
  }, []);

  useEffect(() => {
    setLoading(true);
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

  // Assign rows to bars to avoid overlapping
  const barRows = useMemo(() => {
    const sorted = [...bars].sort((a, b) => a.startDay - b.startDay);
    const rows: { endDay: number }[][] = [];
    const assignments: number[] = [];

    for (const bar of sorted) {
      let placed = false;
      for (let r = 0; r < rows.length; r++) {
        if (rows[r].every((b) => b.endDay < bar.startDay || bar.endDay < rows[r][0].endDay)) {
          if (!rows[r].some((b) => b.endDay >= bar.startDay)) {
            rows[r].push({ endDay: bar.endDay });
            assignments.push(r);
            placed = true;
            break;
          }
        }
      }
      if (!placed) {
        rows.push([{ endDay: bar.endDay }]);
        assignments.push(rows.length - 1);
      }
    }
    return assignments;
  }, [bars]);

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  // Build calendar grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // Find bars that overlap a given day
  function barsForDay(day: number) {
    return bars
      .map((bar, idx) => ({ ...bar, row: barRows[idx] }))
      .filter((b) => b.startDay <= day && b.endDay >= day);
  }

  return (
    <div>
      <div className="mb-6">
        <SportFilter
          sports={sports}
          selected={selectedSport}
          onSelect={setSelectedSport}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            {MONTH_NAMES[month - 1]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
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
            <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            Loading...
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              const dayBars = day ? barsForDay(day) : [];
              const isToday = isCurrentMonth && day === today;
              return (
                <div
                  key={idx}
                  className={`min-h-[100px] border-b border-r border-gray-100 p-1 ${
                    day ? "" : "bg-gray-50"
                  }`}
                >
                  {day && (
                    <>
                      <div
                        className={`text-sm mb-1 ${
                          isToday
                            ? "bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold"
                            : "text-gray-700"
                        }`}
                      >
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {dayBars
                          .filter((b) => b.startDay === day)
                          .map((bar, bIdx) => {
                            return (
                              <button
                                key={`${bar.season.id}-${bar.type}-${bIdx}`}
                                onClick={() => setSelectedSeason(bar.season)}
                                className={`block w-full text-left text-[10px] leading-4 px-1 rounded truncate text-white ${getSportColor(
                                  bar.season.sport
                                )} ${
                                  bar.type === "signup"
                                    ? "opacity-60 border border-dashed border-white/40"
                                    : ""
                                } hover:opacity-90 transition-opacity cursor-pointer`}
                                title={`${bar.season.name} (${bar.type === "signup" ? "Sign-up" : "Season"})`}
                              >
                                {bar.season.name}
                              </button>
                            );
                          })}
                        {dayBars.filter((b) => b.startDay === day).length === 0 &&
                          dayBars.length > 0 && (
                            <div className="flex gap-0.5">
                              {dayBars.slice(0, 3).map((bar, bIdx) => (
                                <button
                                  key={`dot-${bar.season.id}-${bar.type}-${bIdx}`}
                                  onClick={() => setSelectedSeason(bar.season)}
                                  className={`w-1.5 h-1.5 rounded-full ${getSportColor(bar.season.sport)} ${
                                    bar.type === "signup" ? "opacity-60" : ""
                                  } cursor-pointer`}
                                  title={`${bar.season.name} (${bar.type === "signup" ? "Sign-up" : "Season"})`}
                                />
                              ))}
                              {dayBars.length > 3 && (
                                <span className="text-[9px] text-gray-400">+{dayBars.length - 3}</span>
                              )}
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

      {/* Detail modal */}
      {selectedSeason && (
        <SeasonDetail
          season={selectedSeason}
          onClose={() => setSelectedSeason(null)}
        />
      )}
    </div>
  );
}
