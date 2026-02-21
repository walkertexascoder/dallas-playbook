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

        <div className="flex gap-3">
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
