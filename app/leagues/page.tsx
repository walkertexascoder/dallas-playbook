import { db, schema } from "@/db";
import { sql, eq, and } from "drizzle-orm";
import Link from "next/link";
import { getSportColor } from "@/lib/sport-colors";

export const dynamic = "force-dynamic";

export default async function LeaguesPage() {
  const leagues = await db
    .select()
    .from(schema.leagues)
    .where(eq(schema.leagues.approved, true));

  // Get season counts per league (only approved + visible seasons under approved leagues)
  const seasonCounts = await db
    .select({
      leagueId: schema.seasons.leagueId,
      count: sql<number>`count(*)`,
    })
    .from(schema.seasons)
    .innerJoin(schema.leagues, eq(schema.seasons.leagueId, schema.leagues.id))
    .where(
      and(
        eq(schema.leagues.approved, true),
        eq(schema.seasons.approved, true),
        eq(schema.seasons.visible, true)
      )
    )
    .groupBy(schema.seasons.leagueId);

  const countMap = new Map(seasonCounts.map((s) => [s.leagueId, s.count]));

  // Group leagues by sport
  const grouped = new Map<string, typeof leagues>();
  for (const league of leagues) {
    const sport = league.sport;
    if (!grouped.has(sport)) grouped.set(sport, []);
    grouped.get(sport)!.push(league);
  }

  const sortedSports = Array.from(grouped.keys()).sort();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">League Directory</h1>
      <p className="text-gray-600 mb-6">
        {leagues.length} youth sports organizations tracked across the DFW area
      </p>

      {sortedSports.map((sport) => (
        <div key={sport} className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${getSportColor(sport)}`} />
            {sport}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {grouped.get(sport)!.map((league) => (
              <Link
                key={league.id}
                href={`/leagues/${league.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-900">{league.name}</h3>
                {league.organization && (
                  <p className="text-sm text-gray-500">{league.organization}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {countMap.get(league.id) || 0} season{(countMap.get(league.id) || 0) !== 1 ? "s" : ""}
                </p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
