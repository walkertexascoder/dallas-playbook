import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db, schema } from "../db";
import { evaluateSearchResult } from "../lib/claude";
import { verifyUrl } from "../lib/verify-url";

const SERPER_API_KEY = process.env.SERPER_API_KEY;

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

interface SerperResult {
  title: string;
  snippet: string;
  link: string;
}

async function search(query: string): Promise<SerperResult[]> {
  if (!SERPER_API_KEY) {
    console.error("SERPER_API_KEY environment variable required");
    console.error("Get a free key at https://serper.dev");
    process.exit(1);
  }

  const resp = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      num: 5,
      gl: "us",
      location: "Dallas, Texas, United States",
    }),
  });

  if (!resp.ok) {
    console.error(`Search failed: ${resp.status} ${resp.statusText}`);
    return [];
  }

  const data = await resp.json();
  return (data.organic || []).map((item: SerperResult) => ({
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

  const existingLeagues = db.select().from(schema.leagues).all();
  const existingDomains = new Set(existingLeagues.map((l) => getDomain(l.website)));

  let newLeagues = 0;
  let rejected = 0;

  for (const query of QUERIES) {
    console.log(`\nSearching: "${query}"`);
    const results = await search(query);

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
        // Verify URL is safe before adding
        console.log(`    Verifying URL safety...`);
        const verification = await verifyUrl(result.link);
        if (!verification.safe) {
          console.log(`    REJECTED (unsafe): ${verification.reason}`);
          rejected++;
          existingDomains.add(domain); // Don't re-check this domain
          continue;
        }

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

    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nDiscovery complete. Added ${newLeagues} new leagues. Rejected ${rejected} unsafe URLs.`);
}

discover();
