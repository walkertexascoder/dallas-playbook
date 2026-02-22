import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { getSportColor } from "@/lib/sport-colors";

export const dynamic = "force-dynamic";

function formatDate(d: string | null): string {
  if (!d) return "TBD";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function LeaguesPage() {
  const leagues = await db
    .select()
    .from(schema.leagues)
    .where(eq(schema.leagues.approved, true));

  const allSeasons = await db
    .select()
    .from(schema.seasons)
    .innerJoin(schema.leagues, eq(schema.seasons.leagueId, schema.leagues.id))
    .where(
      and(
        eq(schema.leagues.approved, true),
        eq(schema.seasons.approved, true),
        eq(schema.seasons.visible, true)
      )
    );

  // Group seasons by league
  const seasonsByLeague = new Map<number, (typeof allSeasons)[number]["seasons"][]>();
  for (const row of allSeasons) {
    if (!seasonsByLeague.has(row.seasons.leagueId)) seasonsByLeague.set(row.seasons.leagueId, []);
    seasonsByLeague.get(row.seasons.leagueId)!.push(row.seasons);
  }

  // Group leagues by sport
  const grouped = new Map<string, typeof leagues>();
  for (const league of leagues) {
    const sport = league.sport;
    if (!grouped.has(sport)) grouped.set(sport, []);
    grouped.get(sport)!.push(league);
  }

  const sortedSports = Array.from(grouped.keys()).sort();
  const now = new Date().toISOString().split("T")[0];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">League Directory</h1>
      <p className="text-gray-600 mb-6">
        {leagues.length} youth sports organizations tracked across Dallas
      </p>

      {sortedSports.map((sport) => (
        <div key={sport} className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${getSportColor(sport)}`} />
            {sport}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {grouped.get(sport)!.map((league) => {
              const seasons = seasonsByLeague.get(league.id) || [];
              return (
                <Link
                  key={league.id}
                  href={`/leagues/${league.id}`}
                  className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-gray-900">{league.name}</h3>
                  {league.organization && (
                    <p className="text-sm text-gray-500">{league.organization}</p>
                  )}
                  {seasons.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {seasons.map((season) => {
                        const isSignupOpen =
                          season.signupStart && season.signupEnd &&
                          season.signupStart <= now && season.signupEnd >= now;
                        return (
                          <div key={season.id} className="text-sm border-l-2 border-gray-200 pl-2">
                            <p className="font-medium text-gray-800">{season.name}</p>
                            {season.ageGroup && (
                              <p className="text-xs text-gray-500">Ages {season.ageGroup}</p>
                            )}
                            {(season.signupStart || season.signupEnd) && (
                              <p className="text-xs text-gray-500">
                                Registration: {formatDate(season.signupStart)} &ndash; {formatDate(season.signupEnd)}
                                {isSignupOpen && (
                                  <span className="ml-1 text-yellow-700 font-medium">Open</span>
                                )}
                              </p>
                            )}
                            {(season.seasonStart || season.seasonEnd) && (
                              <p className="text-xs text-gray-500">
                                Season: {formatDate(season.seasonStart)} &ndash; {formatDate(season.seasonEnd)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mt-2">No seasons listed</p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
