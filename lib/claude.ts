import Anthropic from "@anthropic-ai/sdk";

let _anthropic: Anthropic;
function getClient() {
  if (!_anthropic) _anthropic = new Anthropic();
  return _anthropic;
}

export async function extractSeasons(pageText: string, leagueUrl: string) {
  const response = await getClient().messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are extracting youth sports league season data from a webpage. The page is from: ${leagueUrl}

Extract all upcoming seasons/programs. For each, provide:
- name: descriptive name (e.g. "Spring 2026 Soccer")
- sport: the sport (Soccer, Basketball, Baseball, Football, Volleyball, Swimming, etc.)
- signup_start: registration opens date (YYYY-MM-DD format, null if unknown)
- signup_end: registration closes date (YYYY-MM-DD format, null if unknown)
- season_start: play begins date (YYYY-MM-DD format, null if unknown)
- season_end: play ends date (YYYY-MM-DD format, null if unknown)
- age_group: age range (e.g. "5-12", null if unknown)
- details_url: direct link to this season if available, otherwise null

Return ONLY a JSON array. If no seasons found, return [].

Page content:
${pageText.slice(0, 15000)}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    console.error("Failed to parse Claude response as JSON");
    return [];
  }
}

export async function extractCityFromPage(pageText: string): Promise<string | null> {
  const response = await getClient().messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Look at this webpage text and find a physical/mailing address for this organization (street address, city, state). Extract ONLY the city name from that address.

If you find an address, return JSON: { "city": "CityName" }
If no address is found, return JSON: { "city": null }

Return ONLY the JSON object.

Page content:
${pageText.slice(0, 10000)}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const result = JSON.parse(jsonMatch[0]);
    return result.city || null;
  } catch {
    return null;
  }
}

export async function evaluateSearchResult(
  title: string,
  snippet: string,
  url: string
) {
  const response = await getClient().messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Is this a Dallas-area youth sports league? Evaluate this search result:

Title: ${title}
Snippet: ${snippet}
URL: ${url}

If yes, extract:
- org_name: organization name
- sport: primary sport (or "Multi-Sport")
- league_name: full league name

Return JSON: { "is_league": true/false, "org_name": "...", "sport": "...", "league_name": "..." }
Return ONLY the JSON object.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { is_league: false };

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { is_league: false };
  }
}
