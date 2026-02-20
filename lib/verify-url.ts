import { chromium } from "playwright";

interface VerifyResult {
  safe: boolean;
  reason?: string;
  finalUrl?: string;
}

const SUSPICIOUS_DOMAINS = [
  "stripchat", "chaturbate", "pornhub", "xvideos", "xhamster",
  "livejasmin", "cam4", "bongacams", "myfreecams",
  "onlyfans", "fansly", "manyvids",
  "bet365", "1xbet", "stake.com",
  "ww1.", "ww2.", "ww3.", "ww4.", "ww5.", "ww6.", "ww7.", "ww8.",
  "ww9.", "ww10.", "ww11.", "ww12.", "ww13.", "ww14.", "ww15.",
  "ww16.", "ww17.", "ww18.", "ww19.", "ww20.",
];

const SUSPICIOUS_SCRIPTS = [
  "fingerprintjs", "fingerprint2", "FingerprintJS",
  "tr_uuid", "tracking_uuid",
  "popunder", "popUnder",
  "exoclick", "trafficjunky", "juicyads",
];

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Verify a URL is safe by checking for:
 * 1. Redirects to a different domain
 * 2. Suspicious content (fingerprinting, ad tracking, adult sites)
 * 3. Domain parking patterns
 */
export async function verifyUrl(url: string): Promise<VerifyResult> {
  const originalDomain = getDomain(url);

  // First do a quick curl-style check for redirects
  try {
    const resp = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    const finalUrl = resp.url;
    const finalDomain = getDomain(finalUrl);

    // Check if redirected to a completely different domain
    if (finalDomain !== originalDomain) {
      // Allow common benign redirects (www variants, same org)
      const origBase = originalDomain.split(".").slice(-2).join(".");
      const finalBase = finalDomain.split(".").slice(-2).join(".");
      if (origBase !== finalBase) {
        // Check if the final domain is suspicious
        const isSuspicious = SUSPICIOUS_DOMAINS.some((s) => finalDomain.includes(s));
        if (isSuspicious) {
          return { safe: false, reason: `Redirects to suspicious domain: ${finalDomain}`, finalUrl };
        }
        // Flag cross-domain redirects for review even if not obviously malicious
        return { safe: false, reason: `Redirects to different domain: ${finalDomain}`, finalUrl };
      }
    }

    // Check response body for suspicious patterns
    const text = await resp.text();
    const lowerText = text.toLowerCase();

    for (const pattern of SUSPICIOUS_SCRIPTS) {
      if (lowerText.includes(pattern.toLowerCase())) {
        return { safe: false, reason: `Suspicious content detected: ${pattern}`, finalUrl };
      }
    }

    // Check for domain parking indicators
    if (
      (lowerText.includes("domain for sale") || lowerText.includes("buy this domain")) &&
      text.length < 5000
    ) {
      return { safe: false, reason: "Domain appears to be parked/for sale", finalUrl };
    }

    // Check for very minimal content with redirects (common in hijacked domains)
    if (text.length < 500 && (lowerText.includes("window.location") || lowerText.includes("meta http-equiv=\"refresh\""))) {
      return { safe: false, reason: "Minimal page with redirect — possible hijack", finalUrl };
    }

    return { safe: true, finalUrl };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    // Connection errors aren't safety issues, just availability
    if (msg.includes("ENOTFOUND") || msg.includes("ECONNREFUSED")) {
      return { safe: true, reason: `Connection failed: ${msg}` };
    }
    if (msg.includes("timeout") || msg.includes("TimeoutError")) {
      return { safe: true, reason: "Timeout — could not verify" };
    }
    return { safe: true, reason: `Check error: ${msg}` };
  }
}

/**
 * Verify a URL using a real browser (catches JS-based redirects that fetch misses).
 * More thorough but slower — use for new domains or when fetch-based check is inconclusive.
 */
export async function verifyUrlWithBrowser(url: string): Promise<VerifyResult> {
  const originalDomain = getDomain(url);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();

    // Track all navigation
    const visitedUrls: string[] = [];
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) {
        visitedUrls.push(frame.url());
      }
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(3000); // Wait for JS redirects

    const finalUrl = page.url();
    const finalDomain = getDomain(finalUrl);

    // Check if JS redirected to a different domain
    const origBase = originalDomain.split(".").slice(-2).join(".");
    const finalBase = finalDomain.split(".").slice(-2).join(".");

    if (origBase !== finalBase) {
      const isSuspicious = SUSPICIOUS_DOMAINS.some((s) => finalDomain.includes(s));
      return {
        safe: false,
        reason: isSuspicious
          ? `Browser redirected to suspicious domain: ${finalDomain}`
          : `Browser redirected to different domain: ${finalDomain}`,
        finalUrl,
      };
    }

    // Check page content for suspicious patterns
    const content = await page.content();
    const lowerContent = content.toLowerCase();

    for (const pattern of SUSPICIOUS_SCRIPTS) {
      if (lowerContent.includes(pattern.toLowerCase())) {
        return { safe: false, reason: `Suspicious content in browser: ${pattern}`, finalUrl };
      }
    }

    // Check if any intermediate URLs went to suspicious domains
    for (const visited of visitedUrls) {
      const visitedDomain = getDomain(visited);
      if (SUSPICIOUS_DOMAINS.some((s) => visitedDomain.includes(s))) {
        return { safe: false, reason: `Visited suspicious domain during navigation: ${visitedDomain}`, finalUrl };
      }
    }

    return { safe: true, finalUrl };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { safe: true, reason: `Browser check error: ${msg}` };
  } finally {
    await browser.close();
  }
}
