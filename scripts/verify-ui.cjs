const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");
const { execFileSync } = require("node:child_process");
// Build the report error case without a live backend. Running this verification
// must never create real flags or send Telegram notifications.
execFileSync(process.platform === "win32" ? "pnpm.cmd" : "pnpm", ["build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, VITE_CONVEX_URL: "" },
});
const root = path.resolve(__dirname, "../dist");
const out = path.resolve(
  process.env.UI_SCREENSHOT_DIR || path.join(__dirname, "../artifacts/ui"),
);
fs.mkdirSync(out, { recursive: true });
function verifyLinks(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      verifyLinks(file);
      continue;
    }
    if (!file.endsWith(".html")) continue;
    for (const [, link] of fs
      .readFileSync(file, "utf8")
      .matchAll(/(?:href|src)="(\/[^"]+)"/g)) {
      if (link.startsWith("//")) continue;
      const destination = path.join(root, link.split(/[?#]/)[0]);
      if (
        !fs.existsSync(destination) &&
        !fs.existsSync(path.join(destination, "index.html"))
      )
        throw Error(`Broken internal link: ${file} -> ${link}`);
    }
  }
}
verifyLinks(root);
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
};
(async () => {
  const server = http.createServer((req, res) => {
    let file = path.join(
      root,
      decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    try {
      if (!fs.existsSync(file) && !path.extname(file))
        file = path.join(root, "index.html");
      if (fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
      res.setHeader(
        "Content-Type",
        types[path.extname(file)] || "application/octet-stream",
      );
      res.end(fs.readFileSync(file));
    } catch {
      res.writeHead(404).end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.UI_CHROMIUM_PATH || undefined,
    args: process.env.UI_CHROMIUM_PATH
      ? [
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--single-process",
          "--no-zygote",
          "--disable-gpu",
        ]
      : undefined,
  });
  const pages = [
    ["home", "/"],
    ["category", "/category/academic-and-administration/"],
    ["search", "/?q=my%20AC%20is%20broken"],
    ["people", "/category/offices-and-people/"],
    ["detail", "/resource/maintenance-service-request/"],
    ["emergency", "/emergency/"],
    ["report", "/resource/maintenance-service-request/report/"],
  ];
  const errors = [],
    checks = [];
  const context = await browser.newContext({
    viewport: { width: 1140, height: 960 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.setDefaultTimeout(15000);
  for (const [label, width, height] of [
    ["desktop", 1140, 960],
    ["mobile", 334, 960],
  ]) {
    await page.setViewportSize({ width, height });
    for (const [name, route] of pages) {
      await page.goto(base + route, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      if (name === "report")
        await page.getByLabel("The link is dead", { exact: true }).check();
      await page.screenshot({ path: path.join(out, `${name}-${label}.png`) });
      checks.push({
        page: name,
        viewport: label,
        overflow: await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        h1: await page.locator("h1").innerText(),
      });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    window.__spaMarker = "loaded";
    window.__skeletonFlash = false;
    new MutationObserver(() => {
      if (document.querySelector(".skeleton")) window.__skeletonFlash = true;
    }).observe(document.body, { childList: true, subtree: true });
  });
  let repeatedResourceFetches = 0;
  const countResourceFetches = (request) => {
    if (request.url().endsWith("/data/resources.json"))
      repeatedResourceFetches++;
  };
  page.on("request", countResourceFetches);
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .last()
    .getByRole("link", { name: "People", exact: true })
    .click();
  await page.waitForFunction(
    () => document.querySelector("h1")?.textContent === "Who can help?",
  );
  await page.locator("#resource-search").fill("finance");
  if ((await page.locator(".contact-row").count()) !== 1)
    throw Error("Search after SPA navigation failed");
  if ((await page.evaluate(() => window.__spaMarker)) !== "loaded")
    throw Error("Navigation reloaded the document");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .last()
    .getByRole("link", { name: "Resources", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      document.querySelector("h1")?.textContent === "Where do you need to go?",
  );
  await page
    .locator("#category-picker")
    .selectOption("/category/library-and-academic-support");
  await page.waitForFunction(
    () =>
      document.querySelector("h1")?.textContent ===
      "Library & Academic Support",
  );
  if ((await page.evaluate(() => window.__spaMarker)) !== "loaded")
    throw Error("Category selection reloaded the document");
  await page.goBack();
  await page.waitForFunction(
    () =>
      document.querySelector("h1")?.textContent === "Where do you need to go?",
  );
  if (await page.evaluate(() => window.__skeletonFlash)) throw Error("Cached navigation flashed skeletons");
  if (repeatedResourceFetches !== 0)
    throw Error("Navigation fetched resource data again");
  page.removeListener("request", countResourceFetches);
  await page.goto(base + "/category/offices-and-people/", {
    waitUntil: "networkidle",
  });
  await page.getByRole("button", { name: "View all offices" }).click();
  if ((await page.locator(".contact-row").count()) <= 3)
    throw Error("Additional offices inaccessible");
  await page.goto(base + "/category/academic-and-administration/", {
    waitUntil: "networkidle",
  });
  await page.getByRole("button", { name: "View all resources" }).click();
  if ((await page.locator(".resource-row").count()) <= 5)
    throw Error("Additional resources inaccessible");

  await page.goto(base, { waitUntil: "networkidle" });
  await page.locator("#resource-search").fill("my AC is broken");
  await page.waitForSelector(".search-result");
  if (
    (await page.locator(".search-result").count()) !== 1 ||
    !(await page.locator(".search-result").first().innerText()).includes(
      "Maintenance Service Request",
    )
  )
    throw Error("Exact intent search failed");
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  if ((await page.locator("h1").innerText()) !== "Where do you need to go?")
    throw Error("Clear search failed");
  await page.goto(base + "/category/academic-and-administration/", {
    waitUntil: "networkidle",
  });
  await page.getByRole("button", { name: "Forms", exact: true }).click();
  const meta = await page.locator(".resource-meta").allTextContents();
  if (!meta.length || meta.some((x) => !x.startsWith("Form")))
    throw Error("Type filter failed");
  await page.locator("#resource-search").fill("zzzxxyynotarealresource");
  if (
    !(await page.locator(".empty-state").innerText()).includes(
      "No matching resources",
    )
  )
    throw Error("Empty state failed");
  await page.goto(base + "/category/offices-and-people/", {
    waitUntil: "networkidle",
  });
  await page.locator("#resource-search").fill("finance");
  if (!(await page.locator(".contact-list").innerText()).includes("Finance"))
    throw Error("Contact search failed");
  await page.goto(base + "/resource/maintenance-service-request/report/", {
    waitUntil: "networkidle",
  });
  if (
    !(await page
      .getByRole("button", { name: "Send report", exact: true })
      .isDisabled())
  )
    throw Error("Report requires reason");
  await page.getByLabel("The link is dead", { exact: true }).check();
  await page.getByRole("button", { name: "Send report", exact: true }).click();
  await page.getByRole("alert").waitFor();
  if ((await page.locator("body").innerText()).includes("Reported anonymously"))
    throw Error("False report success");
  await page.goto(base + "/emergency/", { waitUntil: "networkidle" });
  const phones = await page
    .locator(".emergency-action a")
    .evaluateAll((els) => els.map((a) => a.getAttribute("href")));
  if (
    JSON.stringify(phones) !==
    JSON.stringify([
      "tel:+233201722818",
      "tel:+233501331668",
      "tel:+233501260277",
      "tel:+233501673669",
      "mailto:hotline@ashesi.edu.gh",
    ])
  )
    throw Error("Emergency destinations mismatch");
  for (const width of [320, 390, 768, 1360]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [name, route] of pages) {
      await page.goto(base + route, { waitUntil: "networkidle" });
      checks.push({
        page: name,
        width,
        overflow: await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      });
    }
  }
  // Hold the actual data request open: only fetched regions may be skeletons.
  const data = fs.readFileSync(path.join(root, "data/resources.json"), "utf8");
  for (const width of [334, 1140]) {
    for (const [name, route] of pages) {
      const delayed = await page.context().newPage();
      await delayed.setViewportSize({ width, height: 960 });
      await delayed.emulateMedia({ reducedMotion: "reduce" });
      delayed.on("pageerror", (e) => errors.push(e.message));
      let release;
      const pending = new Promise((resolve) => { release = resolve; });
      await delayed.route("**/data/resources.json", async (request) => {
        await pending;
        await request.fulfill({ contentType: "application/json", body: data });
      });
      await delayed.goto(base + route, { waitUntil: "domcontentloaded" });
      await delayed.locator(".page-content .skeleton").first().waitFor();
      if (!(await delayed.locator(".site-header").isVisible())) throw Error("Header missing during loading");
      if ((await delayed.locator(".search-box .skeleton").count()) !== 0) throw Error("Search input was skeletonized");
      if (name === "home" || name === "people" || name === "detail") {
        await delayed.screenshot({ path: path.join(out, `loading-${name}-${width}.png`) });
      }
      if (await delayed.locator("#resource-search").count()) {
        await delayed.locator("#resource-search").fill(name === "people" ? "finance" : name === "category" ? "Academic Request Form" : "my AC is broken");
        await delayed.evaluate(() => { window.__searchInput = document.querySelector("#resource-search"); });
      }
      if (name === "category") {
        await delayed.getByRole("button", { name: "Forms", exact: true }).click();
      }
      if (name === "report") {
        await delayed.getByLabel("The link is dead", { exact: true }).check();
        await delayed.getByLabel("Anything else? (optional)").fill("Keep this note while loading");
        if (!(await delayed.getByRole("button", { name: "Send report", exact: true }).isDisabled())) throw Error("Report allowed before resource verified");
      }
      if (await delayed.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error(`Loading overflow: ${name} ${width}`);
      const reducedAnimation = await delayed.locator(".skeleton").first().evaluate((el) => getComputedStyle(el, "::after").animationName);
      if (reducedAnimation !== "none") throw Error("Reduced motion shimmer still active");
      release();
      await delayed.waitForFunction(() => !document.querySelector(".skeleton"));
      if (await delayed.locator("#resource-search").count()) {
        if (!(await delayed.evaluate(() => window.__searchInput === document.querySelector("#resource-search")))) throw Error("Loading replaced the search input");
        const selector = name === "people" ? ".contact-row" : name === "category" ? ".resource-row" : ".search-result";
        if ((await delayed.locator(selector).count()) !== 1) throw Error(`Pending search not applied: ${name}`);
      }
      if (name === "report" && await delayed.getByRole("button", { name: "Send report", exact: true }).isDisabled()) throw Error("Report state lost while loading");
      await delayed.close();
    }
  }
  // Navigation is usable even before the shared request resolves. Also exercise
  // the CSS entrance fallback in a browser without the View Transition API.
  const pendingPage = await page.context().newPage();
  await pendingPage.setViewportSize({ width: 390, height: 844 });
  await pendingPage.addInitScript(() => { document.startViewTransition = undefined; });
  pendingPage.on("pageerror", (e) => errors.push(e.message));
  let unblock;
  const gate = new Promise((resolve) => { unblock = resolve; });
  let pendingRequests = 0;
  await pendingPage.route("**/data/resources.json", async (request) => {
    pendingRequests++;
    await gate;
    await request.fulfill({ contentType: "application/json", body: data });
  });
  await pendingPage.goto(base, { waitUntil: "domcontentloaded" });
  await pendingPage.locator(".skeleton").first().waitFor();
  await pendingPage.getByRole("navigation", { name: "Main navigation" }).last().getByRole("link", { name: "People", exact: true }).click();
  await pendingPage.waitForFunction(() => document.querySelector("h1")?.textContent === "Who can help?");
  await pendingPage.locator("#resource-search").fill("finance");
  unblock();
  await pendingPage.waitForSelector(".contact-row:not(.skeleton-record)");
  if (pendingRequests !== 1 || await pendingPage.locator(".contact-row").count() !== 1) throw Error("Navigation during loading lost shared request or search");
  await pendingPage.close();
  // A failed fetch keeps the shell/search alive, and retry recovers in-place.
  const retryPage = await page.context().newPage();
  await retryPage.setViewportSize({ width: 390, height: 844 });
  retryPage.on("pageerror", (e) => errors.push(e.message));
  let attempts = 0;
  await retryPage.route("**/data/resources.json", (request) => {
    attempts++;
    return attempts === 1 ? request.fulfill({ status: 503, body: "Unavailable" }) : request.fulfill({ contentType: "application/json", body: data });
  });
  await retryPage.goto(base, { waitUntil: "networkidle" });
  await retryPage.locator("#resource-search").fill("my AC is broken");
  await retryPage.getByRole("button", { name: "Try again", exact: true }).click();
  await retryPage.waitForSelector(".search-result");
  if (attempts !== 2 || await retryPage.locator(".search-result").count() !== 1) throw Error("In-place retry failed");
  const animation = await retryPage.locator(".search-result").evaluate((el) => getComputedStyle(el).animationName);
  if (animation !== "content-arrive") throw Error("Entrance animations missing");
  await retryPage.emulateMedia({ reducedMotion: "reduce" });
  if (await retryPage.locator(".search-result").evaluate((el) => getComputedStyle(el).animationName) !== "none") throw Error("Reduced motion entrance active");
  await retryPage.close();
  await page.close();
  await browser.close();
  server.close();
  fs.writeFileSync(
    path.join(out, "verification.json"),
    JSON.stringify(
      {
        checks,
        errors,
        functional:
          "SPA navigation without reloads, cached resource data, back navigation, intent search, clear, category filtering, empty states, contact search, report validation/error, emergency destinations, localized delayed loading on seven routes at two widths, preserved search/filter/report state, in-place retry and reduced motion passed",
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      errors,
      overflow: checks.filter((x) => x.overflow),
      screenshots: 14,
      functional: "passed",
    }),
  );
  if (errors.length || checks.some((x) => x.overflow)) process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
