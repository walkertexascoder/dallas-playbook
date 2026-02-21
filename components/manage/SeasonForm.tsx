"use client";

import { useState } from "react";

interface SeasonData {
  id?: number;
  name: string;
  sport: string;
  ageGroup: string | null;
  signupStart: string | null;
  signupEnd: string | null;
  seasonStart: string | null;
  seasonEnd: string | null;
  detailsUrl: string | null;
  registrationUrl: string | null;
  visible: boolean;
}

interface SeasonFormProps {
  season?: SeasonData;
  defaultSport?: string;
  onSave: (data: Omit<SeasonData, "id">) => void;
  onCancel: () => void;
}

export default function SeasonForm({ season, defaultSport, onSave, onCancel }: SeasonFormProps) {
  const [name, setName] = useState(season?.name ?? "");
  const [sport, setSport] = useState(season?.sport ?? defaultSport ?? "");
  const [ageGroup, setAgeGroup] = useState(season?.ageGroup ?? "");
  const [signupStart, setSignupStart] = useState(season?.signupStart ?? "");
  const [signupEnd, setSignupEnd] = useState(season?.signupEnd ?? "");
  const [seasonStart, setSeasonStart] = useState(season?.seasonStart ?? "");
  const [seasonEnd, setSeasonEnd] = useState(season?.seasonEnd ?? "");
  const [registrationUrl, setRegistrationUrl] = useState(season?.registrationUrl ?? "");
  const [visible, setVisible] = useState(season?.visible ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      name,
      sport,
      ageGroup: ageGroup || null,
      signupStart: signupStart || null,
      signupEnd: signupEnd || null,
      seasonStart: seasonStart || null,
      seasonEnd: seasonEnd || null,
      detailsUrl: season?.detailsUrl ?? (registrationUrl || null),
      registrationUrl: registrationUrl || null,
      visible,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sport <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Age Group
          </label>
          <input
            type="text"
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            placeholder="e.g. 5-12, 14U"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Signup Start
          </label>
          <input
            type="date"
            value={signupStart}
            onChange={(e) => setSignupStart(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Signup End
          </label>
          <input
            type="date"
            value={signupEnd}
            onChange={(e) => setSignupEnd(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Season Start
          </label>
          <input
            type="date"
            value={seasonStart}
            onChange={(e) => setSeasonStart(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Season End
          </label>
          <input
            type="date"
            value={seasonEnd}
            onChange={(e) => setSeasonEnd(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {season?.detailsUrl && (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Source URL <span className="text-xs font-normal">(set by scraper &mdash; used for matching)</span>
            </label>
            <div className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 truncate">
              <a href={season.detailsUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {season.detailsUrl}
              </a>
            </div>
          </div>
        )}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registration URL {season?.detailsUrl && <span className="text-xs font-normal text-gray-500">(overrides source URL for public link)</span>}
          </label>
          <input
            type="url"
            value={registrationUrl}
            onChange={(e) => setRegistrationUrl(e.target.value)}
            placeholder={season?.detailsUrl || "Registration link"}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
              className="rounded border-gray-300"
            />
            Visible on public calendar
          </label>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
