"use client";

import { Season } from "./SeasonDetail";
import { getSportColor } from "./SportFilter";

interface RegistrationDeadlinesProps {
  seasons: Season[];
  onClose: () => void;
  onSelectSeason: (season: Season) => void;
}

function daysUntilClose(signupEnd: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(signupEnd + "T00:00:00");
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function RegistrationDeadlines({
  seasons,
  onClose,
  onSelectSeason,
}: RegistrationDeadlinesProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  const withDeadline = seasons.filter((s) => s.signupEnd);

  const upcoming = withDeadline
    .filter((s) => s.signupEnd! >= todayStr)
    .sort((a, b) => a.signupEnd!.localeCompare(b.signupEnd!));

  const recentlyClosed = withDeadline
    .filter((s) => s.signupEnd! < todayStr)
    .sort((a, b) => b.signupEnd!.localeCompare(a.signupEnd!));

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Registration Deadlines</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
          {/* Upcoming Deadlines */}
          {upcoming.length > 0 && (
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Upcoming Deadlines
              </h3>
              <div className="space-y-1">
                {upcoming.map((season) => {
                  const days = daysUntilClose(season.signupEnd!);
                  let urgencyClass = "text-gray-500";
                  if (days <= 2) urgencyClass = "text-red-600";
                  else if (days <= 7) urgencyClass = "text-orange-600";

                  let daysText = `${days} days left`;
                  if (days === 0) daysText = "Closes today!";
                  else if (days === 1) daysText = "Closes tomorrow!";

                  return (
                    <button
                      key={season.id}
                      onClick={() => onSelectSeason(season)}
                      className="w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${getSportColor(season.sport)}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {season.leagueName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {season.name}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xs font-bold ${urgencyClass}`}>
                          {daysText}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {formatDate(season.signupEnd!)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recently Closed */}
          {recentlyClosed.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Recently Closed
              </h3>
              <div className="space-y-1">
                {recentlyClosed.map((season) => {
                  const days = Math.abs(daysUntilClose(season.signupEnd!));
                  let closedText = `Closed ${days} day${days !== 1 ? "s" : ""} ago`;
                  if (days === 0) closedText = "Closed today";

                  return (
                    <button
                      key={season.id}
                      onClick={() => onSelectSeason(season)}
                      className="w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors opacity-60"
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${getSportColor(season.sport)}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {season.leagueName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {season.name}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-400">
                          {closedText}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {formatDate(season.signupEnd!)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {upcoming.length === 0 && recentlyClosed.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-gray-400">
              No registration deadlines found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
