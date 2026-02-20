import { chromium } from "playwright";

export async function scrapePageText(url: string): Promise<string> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    // Wait a bit for any dynamic content
    await page.waitForTimeout(2000);
    const text = await page.evaluate(() => document.body.innerText);
    return text;
  } finally {
    await browser.close();
  }
}
