import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db, schema } from "../db";

const seedLeagues = [
  {
    name: "i9 Sports Dallas",
    organization: "i9 Sports",
    sport: "Multi-Sport",
    website: "https://www.i9sports.com/Programs/Dallas-TX",
  },
  {
    name: "YMCA of Metropolitan Dallas - Youth Sports",
    organization: "YMCA",
    sport: "Multi-Sport",
    website: "https://www.ymcadallas.org/programs/youth-sports",
  },
  {
    name: "Dallas Parks & Recreation Youth Sports",
    organization: "City of Dallas",
    sport: "Multi-Sport",
    website: "https://www.dallasparks.org/",
  },
  {
    name: "Plano Youth Soccer Association",
    organization: "PYSA",
    sport: "Soccer",
    website: "https://www.planosoccer.org/",
  },
  {
    name: "Dallas Youth Baseball",
    organization: "Dallas Youth Baseball",
    sport: "Baseball",
    website: "https://www.dallasyouthbaseball.com/",
  },
  {
    name: "North Texas Youth Football Association",
    organization: "NTYFA",
    sport: "Football",
    website: "https://www.ntyfa.org/",
  },
  {
    name: "Dallas Texans Soccer Club",
    organization: "Dallas Texans",
    sport: "Soccer",
    website: "https://www.dallastexans.com/",
  },
  {
    name: "Richardson Youth Basketball",
    organization: "RYBA",
    sport: "Basketball",
    website: "https://www.leagueathletics.com/",
  },
  {
    name: "NTSSA Youth Soccer",
    organization: "North Texas State Soccer Association",
    sport: "Soccer",
    website: "https://www.ntssa.org/",
  },
  {
    name: "Keller Youth Association",
    organization: "KYA",
    sport: "Multi-Sport",
    website: "https://www.kelleryouth.com/",
  },
  {
    name: "Allen Sports Association",
    organization: "ASA",
    sport: "Multi-Sport",
    website: "https://www.allensportsassociation.com/",
  },
  {
    name: "Frisco Youth Football League",
    organization: "Frisco Youth Football",
    sport: "Football",
    website: "https://www.friscoyouthfootball.com/",
  },
  {
    name: "DFW Swim - Youth Swimming",
    organization: "DFW Swim",
    sport: "Swimming",
    website: "https://www.dfwswim.com/",
  },
  {
    name: "Little Elm Youth Sports",
    organization: "Town of Little Elm",
    sport: "Multi-Sport",
    website: "https://www.littleelm.org/",
  },
  {
    name: "McKinney Youth Basketball Association",
    organization: "MYBA",
    sport: "Basketball",
    website: "https://www.mckinneyyouthbasketball.com/",
  },
];

async function seed() {
  console.log("Seeding leagues...");

  // Also seed some sample seasons so the calendar has data to show
  const sampleSeasons = [
    { leagueIdx: 0, name: "Spring 2026 Flag Football", sport: "Football", signupStart: "2026-01-15", signupEnd: "2026-02-28", seasonStart: "2026-03-07", seasonEnd: "2026-05-16", ageGroup: "5-12" },
    { leagueIdx: 0, name: "Spring 2026 Soccer", sport: "Soccer", signupStart: "2026-01-10", signupEnd: "2026-02-20", seasonStart: "2026-03-01", seasonEnd: "2026-05-10", ageGroup: "4-14" },
    { leagueIdx: 1, name: "Spring 2026 Basketball", sport: "Basketball", signupStart: "2026-02-01", signupEnd: "2026-03-01", seasonStart: "2026-03-15", seasonEnd: "2026-05-30", ageGroup: "6-14" },
    { leagueIdx: 1, name: "Summer 2026 Swim Team", sport: "Swimming", signupStart: "2026-04-01", signupEnd: "2026-05-15", seasonStart: "2026-06-01", seasonEnd: "2026-08-01", ageGroup: "6-18" },
    { leagueIdx: 2, name: "Spring 2026 Youth Soccer", sport: "Soccer", signupStart: "2026-01-05", signupEnd: "2026-02-15", seasonStart: "2026-03-01", seasonEnd: "2026-05-01", ageGroup: "5-12" },
    { leagueIdx: 2, name: "Summer 2026 Youth Baseball", sport: "Baseball", signupStart: "2026-03-15", signupEnd: "2026-04-30", seasonStart: "2026-05-15", seasonEnd: "2026-07-31", ageGroup: "6-14" },
    { leagueIdx: 3, name: "Spring 2026 Rec Soccer", sport: "Soccer", signupStart: "2026-01-01", signupEnd: "2026-02-10", seasonStart: "2026-02-22", seasonEnd: "2026-05-09", ageGroup: "4-18" },
    { leagueIdx: 4, name: "Spring 2026 Little League", sport: "Baseball", signupStart: "2026-01-15", signupEnd: "2026-02-28", seasonStart: "2026-03-14", seasonEnd: "2026-06-13", ageGroup: "4-12" },
    { leagueIdx: 5, name: "Fall 2026 Youth Football", sport: "Football", signupStart: "2026-05-01", signupEnd: "2026-07-15", seasonStart: "2026-08-01", seasonEnd: "2026-11-15", ageGroup: "5-14" },
    { leagueIdx: 6, name: "Spring 2026 Select Soccer", sport: "Soccer", signupStart: "2026-01-10", signupEnd: "2026-02-15", seasonStart: "2026-02-28", seasonEnd: "2026-05-30", ageGroup: "8-18" },
    { leagueIdx: 7, name: "Winter 2026 Basketball League", sport: "Basketball", signupStart: "2025-11-01", signupEnd: "2025-12-15", seasonStart: "2026-01-10", seasonEnd: "2026-03-15", ageGroup: "7-14" },
    { leagueIdx: 9, name: "Spring 2026 Baseball", sport: "Baseball", signupStart: "2026-02-01", signupEnd: "2026-03-10", seasonStart: "2026-03-21", seasonEnd: "2026-06-06", ageGroup: "5-14" },
    { leagueIdx: 10, name: "Spring 2026 Multi-Sport", sport: "Volleyball", signupStart: "2026-02-15", signupEnd: "2026-03-15", seasonStart: "2026-04-01", seasonEnd: "2026-06-01", ageGroup: "8-14" },
    { leagueIdx: 12, name: "Summer 2026 Swim Season", sport: "Swimming", signupStart: "2026-03-01", signupEnd: "2026-05-01", seasonStart: "2026-05-25", seasonEnd: "2026-08-15", ageGroup: "5-18" },
    { leagueIdx: 14, name: "Spring 2026 Rec Basketball", sport: "Basketball", signupStart: "2026-02-01", signupEnd: "2026-02-28", seasonStart: "2026-03-07", seasonEnd: "2026-05-16", ageGroup: "5-14" },
  ];

  for (const league of seedLeagues) {
    const existing = db
      .select()
      .from(schema.leagues)
      .where(
        require("drizzle-orm").eq(schema.leagues.website, league.website)
      )
      .get();

    if (!existing) {
      const result = db.insert(schema.leagues).values(league).returning().get();
      console.log(`  Added: ${league.name} (id: ${result.id})`);
    } else {
      console.log(`  Skipped (exists): ${league.name}`);
    }
  }

  // Get all leagues to map indices to IDs
  const allLeagues = db.select().from(schema.leagues).all();

  for (const season of sampleSeasons) {
    const league = allLeagues[season.leagueIdx];
    if (!league) continue;

    const existing = db
      .select()
      .from(schema.seasons)
      .where(
        require("drizzle-orm").and(
          require("drizzle-orm").eq(schema.seasons.leagueId, league.id),
          require("drizzle-orm").eq(schema.seasons.name, season.name)
        )
      )
      .get();

    if (!existing) {
      db.insert(schema.seasons).values({
        leagueId: league.id,
        name: season.name,
        sport: season.sport,
        signupStart: season.signupStart,
        signupEnd: season.signupEnd,
        seasonStart: season.seasonStart,
        seasonEnd: season.seasonEnd,
        ageGroup: season.ageGroup,
      }).run();
      console.log(`  Added season: ${season.name}`);
    }
  }

  console.log("Done!");
}

seed();
