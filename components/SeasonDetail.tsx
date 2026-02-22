"use client";

import { getSportColor } from "./SportFilter";

export interface Season {
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
  registrationUrl: string | null;
  leagueName: string;
  organization: string | null;
  leagueWebsite: string;
}

interface SeasonDetailProps {
  season: Season;
  onClose: () => void;
}

function formatDate(d: string | null): string {
  if (!d) return "TBD";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

export default function SeasonDetail({ season, onClose }: SeasonDetailProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-3 h-3 rounded-full ${getSportColor(season.sport)}`} />
              <span className="text-sm font-medium text-gray-500">{season.sport}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{season.name}</h2>
            <p className="text-gray-600">{season.leagueName}</p>
            {season.organization && (
              <p className="text-sm text-gray-500">{season.organization}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="space-y-3 mb-6">
          {(season.signupStart || season.signupEnd) && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Registration Period</h3>
              <p className="text-gray-900">
                {formatDate(season.signupStart)} &ndash; {formatDate(season.signupEnd)}
              </p>
              {(() => {
                const days = daysUntilClose(season.signupEnd);
                if (days === null || days > 7) return null;
                return (
                  <div className="mt-2 bg-orange-100 border border-orange-300 rounded-md px-3 py-1.5 text-sm font-semibold text-orange-800 flex items-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {days === 0 ? "Registration closes today!" : days === 1 ? "Registration closes tomorrow!" : `Registration closes in ${days} days!`}
                  </div>
                );
              })()}
            </div>
          )}
          {(season.seasonStart || season.seasonEnd) && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Season</h3>
              <p className="text-gray-900">
                {formatDate(season.seasonStart)} &ndash; {formatDate(season.seasonEnd)}
              </p>
            </div>
          )}
          {season.ageGroup && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Ages</h3>
              <p className="text-gray-900">{season.ageGroup}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {(season.registrationUrl || season.detailsUrl) && (
            <a
              href={season.registrationUrl || season.detailsUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {season.registrationUrl ? "Register" : "View Details"}
            </a>
          )}
          <a
            href={season.leagueWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-gray-100 text-gray-800 text-center py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            League Website
          </a>
        </div>
      </div>
    </div>
  );
}
