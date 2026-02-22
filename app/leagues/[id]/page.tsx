import { db, schema } from "@/db";
import { eq, and, or, isNotNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSportColor } from "@/lib/sport-colors";

export const dynamic = "force-dynamic";

function formatDate(d: string | null): string {
  if (!d) return "TBD";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function LeagueDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [league] = await db
    .select()
    .from(schema.leagues)
    .where(and(eq(schema.leagues.id, Number(params.id)), eq(schema.leagues.approved, true), eq(schema.leagues.visible, true)));

  if (!league) return notFound();

  // Only fetch seasons that have at least one date
  const seasons = await db
    .select()
    .from(schema.seasons)
    .where(
      and(
        eq(schema.seasons.leagueId, league.id),
        eq(schema.seasons.approved, true),
        eq(schema.seasons.visible, true),
        or(
          isNotNull(schema.seasons.signupStart),
          isNotNull(schema.seasons.signupEnd),
          isNotNull(schema.seasons.seasonStart),
          isNotNull(schema.seasons.seasonEnd)
        )
      )
    );

  const now = new Date().toISOString().split("T")[0];

  return (
    <div>
      <Link
        href="/leagues"
        className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block"
      >
        &larr; Back to Leagues
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-3 h-3 rounded-full ${getSportColor(league.sport)}`} />
          <span className="text-sm font-medium text-gray-500">{league.sport}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{league.name}</h1>
        {league.organization && (
          <p className="text-gray-600">{league.organization}</p>
        )}
        <a
          href={league.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-700 mt-1 inline-block"
        >
          Visit Website &rarr;
        </a>
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Seasons ({seasons.length})
      </h2>

      {seasons.length === 0 ? (
        <p className="text-gray-500">No seasons found yet. Check back after the next scrape.</p>
      ) : (
        <div className="space-y-4">
          {seasons.map((season) => {
            const isSignupOpen =
              season.signupStart && season.signupEnd &&
              season.signupStart <= now && season.signupEnd >= now;
            const isActive =
              season.seasonStart && season.seasonEnd &&
              season.seasonStart <= now && season.seasonEnd >= now;

            return (
              <div
                key={season.id}
                className="bg-white rounded-lg border border-gray-200 p-5"
              >
                <div className="flex items-start justify-between flex-wrap mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{season.name}</h3>
                    {season.ageGroup && (
                      <p className="text-sm text-gray-500">Ages {season.ageGroup}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isSignupOpen && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Registration Open
                      </span>
                    )}
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        In Season
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  {(season.signupStart || season.signupEnd) && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Registration</p>
                      <p className="text-sm text-gray-800">
                        {formatDate(season.signupStart)} &ndash; {formatDate(season.signupEnd)}
                      </p>
                    </div>
                  )}
                  {(season.seasonStart || season.seasonEnd) && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Season</p>
                      <p className="text-sm text-gray-800">
                        {formatDate(season.seasonStart)} &ndash; {formatDate(season.seasonEnd)}
                      </p>
                    </div>
                  )}
                </div>

                {season.detailsUrl && (
                  <a
                    href={season.detailsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    View Details &rarr;
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
