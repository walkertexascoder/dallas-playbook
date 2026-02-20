import { db, schema } from "../db";
import { eq } from "drizzle-orm";
import { evaluateSearchResult } from "../lib/claude";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_CX; // Custom Search Engine ID

const SPORTS = [
  "soccer",
  "basketball",
  "baseball",
  "football",
  "volleyball",
  "swimming",
  "softball",
  "tennis",
  "lacrosse",
];

const QUERIES = SPORTS.flatMap((sport) => [
  `Dallas youth ${sport} league registration 2026`,
  `Dallas kids ${sport} league sign up`,
  `DFW youth ${sport} program`,
]);

async function searchGoogle(query: string): Promise<Array<{ title: string; snippet: string; link: string }>> {
  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    console.error("GOOGLE_API_KEY and GOOGLE_CX environment variables required");
    return [];
  }

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", GOOGLE_API_KEY);
  url.searchParams.set("cx", GOOGLE_CX);
  url.searchParams.set("q", query);
  url.searchParams.set("num", "5");

  const resp = await fetch(url.toString());
  if (!resp.ok) {
    console.error(`Search failed: ${resp.status} ${resp.statusText}`);
    return [];
  }

  const data = await resp.json();
  return (data.items || []).map((item: { title: string; snippet: string; link: string }) => ({
    title: item.title,
    snippet: item.snippet,
    link: item.link,
  }));
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

async function discover() {
  console.log("Starting league discovery...");

  // Get existing league domains to deduplicate
  const existingLeagues = db.select().from(schema.leagues).all();
  const existingDomains = new Set(existingLeagues.map((l) => getDomain(l.website)));

  let newLeagues = 0;

  for (const query of QUERIES) {
    console.log(`\nSearching: "${query}"`);
    const results = await searchGoogle(query);

    for (const result of results) {
      const domain = getDomain(result.link);
      if (existingDomains.has(domain)) {
        continue;
      }

      console.log(`  Evaluating: ${result.title} (${domain})`);
      const evaluation = await evaluateSearchResult(
        result.title,
        result.snippet,
        result.link
      );

      if (evaluation.is_league) {
        db.insert(schema.leagues)
          .values({
            name: evaluation.league_name || result.title,
            organization: evaluation.org_name,
            sport: evaluation.sport || "Multi-Sport",
            website: result.link,
            source: "search",
          })
          .run();

        existingDomains.add(domain);
        newLeagues++;
        console.log(`    Added: ${evaluation.league_name || result.title}`);
      }
    }

    // Small delay between queries to respect rate limits
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\nDiscovery complete. Added ${newLeagues} new leagues.`);
}

discover();
