"use client";

import { useState, useEffect, useCallback } from "react";
import { getSportColor } from "@/components/SportFilter";
import ManageModal from "@/components/manage/ManageModal";
import LeagueForm from "@/components/manage/LeagueForm";
import SeasonForm from "@/components/manage/SeasonForm";

interface Season {
  id: number;
  leagueId: number;
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
  approved: boolean;
  source?: string;
}

interface League {
  id: number;
  name: string;
  organization: string | null;
  city: string | null;
  sport: string;
  website: string;
  source?: string;
  approved: boolean;
  visible: boolean;
  seasons: Season[];
}

function formatDate(d: string | null): string {
  if (!d) return "\u2014";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ManagePage() {
  const [state, setState] = useState<"loading" | "login" | "dashboard">("loading");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [leagues, setLeagues] = useState<League[]>([]);
  const [expandedLeague, setExpandedLeague] = useState<number | null>(null);
  const [leagueFilter, setLeagueFilter] = useState("");
  const [modal, setModal] = useState<
    | null
    | { type: "addLeague" }
    | { type: "editLeague"; league: League }
    | { type: "addSeason"; league: League }
    | { type: "editSeason"; season: Season }
  >(null);

  const fetchLeagues = useCallback(async () => {
    const res = await fetch("/api/manage/leagues");
    if (res.ok) {
      setLeagues(await res.json());
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/check")
      .then((r) => r.json())
      .then((data) => {
        setState(data.authenticated ? "dashboard" : "login");
        if (data.authenticated) fetchLeagues();
      });
  }, [fetchLeagues]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setState("dashboard");
      fetchLeagues();
    } else {
      setLoginError("Invalid password");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setState("login");
    setPassword("");
    setLeagues([]);
  }

  async function handleSaveLeague(data: { name: string; organization: string | null; city: string | null; sport: string; website: string }) {
    let res: Response;
    if (modal?.type === "editLeague") {
      res = await fetch(`/api/manage/leagues/${modal.league.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      res = await fetch("/api/manage/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      alert(`Save failed: ${err.error || res.statusText}`);
      return;
    }
    setModal(null);
    fetchLeagues();
  }

  async function handleSaveSeason(data: Omit<Season, "id" | "leagueId" | "approved" | "source">) {
    let res: Response;
    if (modal?.type === "editSeason") {
      res = await fetch(`/api/manage/seasons/${modal.season.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else if (modal?.type === "addSeason") {
      res = await fetch("/api/manage/seasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, leagueId: modal.league.id }),
      });
    } else {
      return;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      alert(`Save failed: ${err.error || res.statusText}`);
      return;
    }
    setModal(null);
    fetchLeagues();
  }

  async function handleDeleteSeason(season: Season) {
    if (!confirm(`Delete "${season.name}"? This cannot be undone.`)) return;
    await fetch(`/api/manage/seasons/${season.id}`, { method: "DELETE" });
    fetchLeagues();
  }

  async function handleToggleVisible(season: Season) {
    const newVisible = !season.visible;
    setLeagues((prev) =>
      prev.map((l) => ({
        ...l,
        seasons: l.seasons.map((s) => (s.id === season.id ? { ...s, visible: newVisible } : s)),
      }))
    );
    await fetch(`/api/manage/seasons/${season.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: newVisible }),
    });
  }

  async function handleApproveLeague(league: League) {
    await fetch(`/api/manage/leagues/${league.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: true, visible: true }),
    });
    fetchLeagues();
  }

  async function handleRejectLeague(league: League) {
    if (!confirm(`Reject "${league.name}"? It will be hidden.`)) return;
    setLeagues((prev) =>
      prev.map((l) => (l.id === league.id ? { ...l, approved: false, visible: false } : l))
    );
    await fetch(`/api/manage/leagues/${league.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: false, visible: false }),
    });
  }

  async function handleToggleApprovedLeague(league: League) {
    if (league.approved) {
      // Turning off approved = reject (hide)
      setLeagues((prev) =>
        prev.map((l) => (l.id === league.id ? { ...l, approved: false, visible: false } : l))
      );
      await fetch(`/api/manage/leagues/${league.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: false, visible: false }),
      });
    } else {
      // Turning on approved = restore
      setLeagues((prev) =>
        prev.map((l) => (l.id === league.id ? { ...l, approved: true, visible: true } : l))
      );
      await fetch(`/api/manage/leagues/${league.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true, visible: true }),
      });
    }
  }

  async function handleApproveSeason(season: Season) {
    await fetch(`/api/manage/seasons/${season.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: true }),
    });
    fetchLeagues();
  }

  async function handleRejectSeason(season: Season) {
    if (!confirm(`Reject "${season.name}"? It will be hidden.`)) return;
    await fetch(`/api/manage/seasons/${season.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: false, visible: false }),
    });
    fetchLeagues();
  }

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (state === "login") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <form onSubmit={handleLogin} className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-6 text-center">Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {loginError && <p className="text-red-600 text-sm mb-4">{loginError}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    );
  }

  const approvedLeagues = leagues.filter((l) => l.approved && l.visible);
  const pendingLeagues = leagues.filter((l) => !l.approved && l.visible);
  const pendingSeasons = approvedLeagues.flatMap((l) =>
    l.seasons.filter((s) => !s.approved).map((s) => ({ ...s, leagueName: l.name }))
  );
  const missingDatesSeasons = approvedLeagues.flatMap((l) =>
    l.seasons
      .filter((s) => s.approved && !s.signupStart && !s.signupEnd && !s.seasonStart && !s.seasonEnd)
      .map((s) => ({ ...s, leagueName: l.name, leagueId: l.id }))
  );
  const totalSeasons = leagues.reduce((sum, l) => sum + l.seasons.length, 0);
  const pendingCount = pendingLeagues.length + pendingSeasons.length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Stats */}
      <div className={`grid gap-4 mb-6 ${pendingCount > 0 ? "grid-cols-3" : "grid-cols-2"}`}>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{leagues.length}</div>
          <div className="text-sm text-gray-500">Leagues</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{totalSeasons}</div>
          <div className="text-sm text-gray-500">Seasons</div>
        </div>
        {pendingCount > 0 && (
          <div className="bg-amber-50 rounded-lg shadow p-4 border border-amber-200">
            <div className="text-2xl font-bold text-amber-700">{pendingCount}</div>
            <div className="text-sm text-amber-600">Pending Review</div>
          </div>
        )}
      </div>

      {/* Pending Review Section */}
      {pendingCount > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-amber-800 mb-4">Pending Review</h2>

          {/* Pending Leagues */}
          {pendingLeagues.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-amber-700 mb-2">New Leagues ({pendingLeagues.length})</h3>
              <div className="space-y-2">
                {pendingLeagues.map((league) => (
                  <div key={league.id} className="bg-white rounded-lg border border-amber-200 p-3 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${getSportColor(league.sport)}`} />
                      <div>
                        <div className="font-medium text-gray-900">{league.name}</div>
                        <div className="text-xs text-gray-500">
                          {league.sport}
                          {league.source && <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">{league.source}</span>}
                        </div>
                        <a
                          href={league.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {league.website}
                        </a>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveLeague(league)}
                        className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setModal({ type: "editLeague", league })}
                        className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRejectLeague(league)}
                        className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Seasons */}
          {pendingSeasons.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-amber-700 mb-2">New Seasons ({pendingSeasons.length})</h3>
              <div className="space-y-2">
                {pendingSeasons.map((season) => (
                  <div key={season.id} className="bg-white rounded-lg border border-amber-200 p-3 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-medium text-gray-900">{season.name}</div>
                      <div className="text-xs text-gray-500">
                        {season.leagueName}
                        {(season.seasonStart || season.seasonEnd) && (
                          <span className="ml-2">
                            {formatDate(season.seasonStart)} &ndash; {formatDate(season.seasonEnd)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveSeason(season)}
                        className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectSeason(season)}
                        className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Missing Dates Section */}
      {missingDatesSeasons.length > 0 && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-orange-800 mb-1">Missing Dates</h2>
          <p className="text-sm text-orange-600 mb-4">
            {missingDatesSeasons.length} season{missingDatesSeasons.length !== 1 ? "s" : ""} missing registration or season dates
          </p>
          <div className="space-y-2">
            {missingDatesSeasons.map((season) => (
              <div key={season.id} className="bg-white rounded-lg border border-orange-200 p-3 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="font-medium text-gray-900">{season.name}</div>
                  <div className="text-xs text-gray-500">
                    {season.leagueName}
                    {season.ageGroup && <span className="ml-2">Ages {season.ageGroup}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setModal({ type: "editSeason", season })}
                    className="px-3 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                  >
                    Add Dates
                  </button>
                  <a
                    href={leagues.find((l) => l.id === season.leagueId)?.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    League Site
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add League + Filter */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setModal({ type: "addLeague" })}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm shrink-0"
        >
          + Add League
        </button>
        <div className="relative flex-1">
          <input
            type="text"
            value={leagueFilter}
            onChange={(e) => setLeagueFilter(e.target.value)}
            placeholder="Filter leagues..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {leagueFilter && (
            <button
              onClick={() => setLeagueFilter("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* League List */}
      <div className="space-y-4">
        {leagues.filter((l) => l.approved && l.visible && l.name.toLowerCase().includes(leagueFilter.toLowerCase())).map((league) => {
          const isExpanded = expandedLeague === league.id;
          return (
            <div key={league.id} id={`league-${league.id}`} className="bg-white rounded-lg shadow">
              {/* League Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                onClick={() => setExpandedLeague(isExpanded ? null : league.id)}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${getSportColor(league.sport)}`} />
                  <div>
                    <div className="font-semibold text-gray-900">{league.name}</div>
                    <div className="text-sm text-gray-500">
                      {league.organization && <span>{league.organization} &middot; </span>}
                      {league.city && <span>{league.city} &middot; </span>}
                      <a
                        href={league.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Website
                      </a>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">
                    {league.seasons.length} season{league.seasons.length !== 1 ? "s" : ""}
                  </span>
                  <div
                    className="flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                    title={league.approved ? "Approved — visible on public site" : "Unapproved — hidden from public site"}
                  >
                    <span className="text-xs text-gray-400">Approved</span>
                    <button
                      onClick={() => handleToggleApprovedLeague(league)}
                      className={`w-8 h-5 rounded-full transition-colors relative ${
                        league.approved ? "bg-green-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          league.approved ? "left-3.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModal({ type: "editLeague", league });
                    }}
                    className="text-sm text-gray-400 hover:text-blue-600"
                  >
                    Edit
                  </button>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Seasons */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-4 pb-4">
                  {league.seasons.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4">No seasons yet.</p>
                  ) : (
                    <>
                    {/* Mobile cards */}
                    <div className="sm:hidden space-y-3 mt-2">
                      {league.seasons.map((season) => {
                        const url = season.registrationUrl || season.detailsUrl;
                        const isOverride = !!season.registrationUrl;
                        return (
                          <div key={season.id} className={`rounded-lg p-3 text-sm ${!season.approved ? "bg-amber-50 border border-amber-200" : "bg-gray-50"}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900">{season.name}</p>
                              {!season.approved && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">Pending</span>
                              )}
                            </div>
                            <div className="space-y-0.5 text-gray-600 text-xs mb-2">
                              <p><span className="text-gray-400">Ages:</span> {season.ageGroup || "\u2014"}</p>
                              <p><span className="text-gray-400">Signup:</span> {season.signupStart || season.signupEnd
                                ? `${formatDate(season.signupStart)} \u2013 ${formatDate(season.signupEnd)}`
                                : "\u2014"}</p>
                              <p><span className="text-gray-400">Season:</span> {season.seasonStart || season.seasonEnd
                                ? `${formatDate(season.seasonStart)} \u2013 ${formatDate(season.seasonEnd)}`
                                : "\u2014"}</p>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {url ? (
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-xs"
                                    title={isOverride ? `Override (source: ${season.detailsUrl})` : "From scraper"}
                                  >
                                    {isOverride ? "Custom Link" : "Link"}
                                  </a>
                                ) : (
                                  <span className="text-gray-400 text-xs">&mdash;</span>
                                )}
                                <button
                                  onClick={() => handleToggleVisible(season)}
                                  className={`w-8 h-5 rounded-full transition-colors relative ${
                                    season.visible ? "bg-blue-600" : "bg-gray-300"
                                  }`}
                                >
                                  <span
                                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                      season.visible ? "left-3.5" : "left-0.5"
                                    }`}
                                  />
                                </button>
                              </div>
                              <div className="flex gap-3">
                                {!season.approved && (
                                  <>
                                    <button
                                      onClick={() => handleApproveSeason(season)}
                                      className="text-green-600 hover:text-green-800 text-xs font-medium"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleRejectSeason(season)}
                                      className="text-red-600 hover:text-red-800 text-xs font-medium"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => setModal({ type: "editSeason", season })}
                                  className="text-blue-600 hover:text-blue-800 text-xs"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteSeason(season)}
                                  className="text-red-600 hover:text-red-800 text-xs"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-sm mt-2">
                        <thead>
                          <tr className="text-left text-gray-500 border-b border-gray-100">
                            <th className="pb-2 pr-3 font-medium">Name</th>
                            <th className="pb-2 pr-3 font-medium">Ages</th>
                            <th className="pb-2 pr-3 font-medium">Signup Dates</th>
                            <th className="pb-2 pr-3 font-medium">Season Dates</th>
                            <th className="pb-2 pr-3 font-medium">Link</th>
                            <th className="pb-2 pr-3 font-medium">Visible</th>
                            <th className="pb-2 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {league.seasons.map((season) => (
                            <tr key={season.id} className={`border-b ${!season.approved ? "bg-amber-50 border-amber-100" : "border-gray-50"}`}>
                              <td className="py-2 pr-3 font-medium text-gray-900">
                                {season.name}
                                {!season.approved && (
                                  <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">Pending</span>
                                )}
                              </td>
                              <td className="py-2 pr-3 text-gray-600">{season.ageGroup || "\u2014"}</td>
                              <td className="py-2 pr-3 text-gray-600 whitespace-nowrap">
                                {season.signupStart || season.signupEnd
                                  ? `${formatDate(season.signupStart)} \u2013 ${formatDate(season.signupEnd)}`
                                  : "\u2014"}
                              </td>
                              <td className="py-2 pr-3 text-gray-600 whitespace-nowrap">
                                {season.seasonStart || season.seasonEnd
                                  ? `${formatDate(season.seasonStart)} \u2013 ${formatDate(season.seasonEnd)}`
                                  : "\u2014"}
                              </td>
                              <td className="py-2 pr-3">
                                {(() => {
                                  const url = season.registrationUrl || season.detailsUrl;
                                  if (!url) return <span className="text-gray-400">&mdash;</span>;
                                  const isOverride = !!season.registrationUrl;
                                  return (
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                      title={isOverride ? `Override (source: ${season.detailsUrl})` : "From scraper"}
                                    >
                                      {isOverride ? "Custom" : "Link"}
                                    </a>
                                  );
                                })()}
                              </td>
                              <td className="py-2 pr-3">
                                <button
                                  onClick={() => handleToggleVisible(season)}
                                  className={`w-8 h-5 rounded-full transition-colors relative ${
                                    season.visible ? "bg-blue-600" : "bg-gray-300"
                                  }`}
                                >
                                  <span
                                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                      season.visible ? "left-3.5" : "left-0.5"
                                    }`}
                                  />
                                </button>
                              </td>
                              <td className="py-2">
                                <div className="flex gap-2">
                                  {!season.approved && (
                                    <>
                                      <button
                                        onClick={() => handleApproveSeason(season)}
                                        className="text-green-600 hover:text-green-800 font-medium"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleRejectSeason(season)}
                                        className="text-red-600 hover:text-red-800 font-medium"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => setModal({ type: "editSeason", season })}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSeason(season)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    </>
                  )}
                  <button
                    onClick={() => setModal({ type: "addSeason", league })}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Add Season
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rejected Leagues */}
      {(() => {
        const rejected = leagues.filter((l) => !l.visible && l.name.toLowerCase().includes(leagueFilter.toLowerCase()));
        if (rejected.length === 0) return null;
        return (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-400 mb-3">Rejected ({rejected.length})</h2>
            <div className="space-y-2">
              {rejected.map((league) => (
                <div key={league.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${getSportColor(league.sport)}`} />
                      <div>
                        <div className="font-semibold text-gray-700">{league.name}</div>
                        <div className="text-sm text-gray-400">
                          {league.organization && <span>{league.organization} &middot; </span>}
                          <a
                            href={league.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Website
                          </a>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleApproveLeague(league)}
                      className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Modals */}
      {modal?.type === "addLeague" && (
        <ManageModal title="Add League" onClose={() => setModal(null)}>
          <LeagueForm onSave={handleSaveLeague} onCancel={() => setModal(null)} />
        </ManageModal>
      )}
      {modal?.type === "editLeague" && (
        <ManageModal title="Edit League" onClose={() => setModal(null)}>
          <LeagueForm league={modal.league} onSave={handleSaveLeague} onCancel={() => setModal(null)} />
        </ManageModal>
      )}
      {modal?.type === "addSeason" && (
        <ManageModal title="Add Season" onClose={() => setModal(null)}>
          <SeasonForm
            defaultSport={modal.league.sport}
            onSave={handleSaveSeason}
            onCancel={() => setModal(null)}
          />
        </ManageModal>
      )}
      {modal?.type === "editSeason" && (
        <ManageModal title="Edit Season" onClose={() => setModal(null)}>
          <SeasonForm season={modal.season} onSave={handleSaveSeason} onCancel={() => setModal(null)} />
        </ManageModal>
      )}
    </div>
  );
}
