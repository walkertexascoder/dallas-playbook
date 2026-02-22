"use client";

import { useState } from "react";

interface League {
  id?: number;
  name: string;
  organization: string | null;
  city: string | null;
  sport: string;
  website: string;
}

interface LeagueFormProps {
  league?: League;
  onSave: (data: Omit<League, "id">) => void;
  onCancel: () => void;
}

export default function LeagueForm({ league, onSave, onCancel }: LeagueFormProps) {
  const [name, setName] = useState(league?.name ?? "");
  const [organization, setOrganization] = useState(league?.organization ?? "");
  const [city, setCity] = useState(league?.city ?? "");
  const [sport, setSport] = useState(league?.sport ?? "");
  const [website, setWebsite] = useState(league?.website ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ name, organization: organization || null, city: city || null, sport, website });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
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
          Organization
        </label>
        <input
          type="text"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          City
        </label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
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
          Website <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          required
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
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
