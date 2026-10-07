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
  ".png": "image/png",
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
    window.__navElement = document.querySelector(".mobile-nav");
    window.__headerElement = document.querySelector(".site-header");
    window.__navTop = window.__navElement.getBoundingClientRect().top;
    window.__navMoved = false;
    window.__transitionCalls = 0;
    const startTransition = document.startViewTransition?.bind(document);
    if (startTransition) document.startViewTransition = (...args) => { window.__transitionCalls++; return startTransition(...args); };
    window.__checkNav = () => {
      if (window.__navElement !== document.querySelector(".mobile-nav") || Math.abs(window.__navElement.getBoundingClientRect().top - window.__navTop) > 0.5) window.__navMoved = true;
      window.__navFrame = requestAnimationFrame(window.__checkNav);
    };
    window.__navFrame = requestAnimationFrame(window.__checkNav);
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
  if (await page.evaluate(() => window.__navMoved || window.__transitionCalls || window.__headerElement !== document.querySelector(".site-header"))) throw Error("Mobile chrome moved or remounted during navigation");
  await page.evaluate(() => cancelAnimationFrame(window.__navFrame));
  if (await page.evaluate(() => window.__skeletonFlash)) throw Error("Cached navigation flashed skeletons");
  if (repeatedResourceFetches !== 0)
    throw Error("Navigation fetched resource data again");
  page.removeListener("request", countResourceFetches);
  await page.goto(base + "/category/offices-and-people/", {
    waitUntil: "networkidle",
  });
  const expectedContacts = JSON.parse(fs.readFileSync(path.join(root, "data/resources.json"), "utf8")).filter((r) => r.category === "Offices & People").length;
  if ((await page.locator(".contact-row").count()) !== expectedContacts || await page.getByRole("button", { name: "View all offices" }).count())
    throw Error("People directory did not show all contacts immediately");
  await page.goto(base + "/category/academic-and-administration/", {
    waitUntil: "networkidle",
  });
  const directory = JSON.parse(fs.readFileSync(path.join(root, "data/resources.json"), "utf8"));
  const academicCount = directory.filter((r) => r.category === "Academic & Administration").length;
  if ((await page.locator(".resource-row").count()) !== academicCount || await page.locator(".more-resources").count())
    throw Error("Category filter hides matching resources behind an expansion button");
  for (const type of ["Portals", "Forms", "All resources"]) {
    await page.getByRole("button", { name: type, exact: true }).click();
    const expected = directory.filter((r) => r.category === "Academic & Administration" && (type === "All resources" || (type === "Portals" ? ["Portal", "Payment"] : ["Form", "Process"]).includes(r.type))).length;
    if (await page.locator(".resource-row").count() !== expected || await page.locator(".more-resources").count()) throw Error(`Incomplete type filter: ${type}`);
  }
  const correctedUrls = {
    "student-portal-camu-services": "https://www.ashesi.mycamu.com",
    "webprint": "https://invence.ashesi.local:9192/app?service=page/UserWebPrint",
    "maintenance-service-request": "https://ashesi-operations.web.app/submit-issue",
    "accessibility-services-meeting-request-form": "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=9WHGbQzuDka9tANK6z82cJZAadFZhghJpTyyEpn6eRNURUFJTUhKWkUzTzZDOFRaRjJQVlBZTTFWMi4u",
  };
  for (const [slug, url] of Object.entries(correctedUrls)) {
    if (directory.find((r) => r.slug === slug)?.url !== url) throw Error(`Incorrect generated destination: ${slug}`);
    await page.goto(base + `/resource/${slug}`, { waitUntil: "networkidle" });
    if (await page.locator(".detail-action > a").getAttribute("href") !== url) throw Error(`Incorrect rendered destination: ${slug}`);
  }
  for (const slug of ["accessibility-and-accommodation-request", "natembea-health-center", "job-shadowing-sign-up", "global-mentorship-initiative", "interruption-of-studies", "academic-requests-via-camu", "academic-request-form", "course-registration-and-issue-reporting", "course-reserves"]) {
    if (directory.some((r) => r.slug === slug) || fs.existsSync(path.join(root, "resource", slug, "index.html"))) throw Error(`Removed resource remains published: ${slug}`);
  }
  await page.goto(base, { waitUntil: "networkidle" });
  const shortcuts = await page.locator(".quick-links > a").evaluateAll((links) => links.map((a) => a.getAttribute("href")));
  if (!shortcuts.includes(correctedUrls.webprint) || !shortcuts.includes(correctedUrls["student-portal-camu-services"])) throw Error("Everyday links did not pick up corrected URLs");
  await page.locator("#resource-search").fill("ashesi");
  await page.waitForFunction(() => parseInt(document.querySelector(".result-count")?.textContent || "0") > 12);
  const searchCount = parseInt(await page.locator(".result-count").innerText());
  if (await page.locator(".search-result").count() !== searchCount || await page.locator(".more-resources").count()) throw Error("Search results truncated behind an expansion button");

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
  const expectedForms = directory.filter((r) => r.category === "Academic & Administration" && ["Form", "Process"].includes(r.type)).length;
  if (meta.length !== expectedForms || meta.some((x) => !x.startsWith("Form"))) throw Error("Type filter failed");
  if (!expectedForms && !(await page.locator(".empty-state").innerText()).includes("No matching resources")) throw Error("Empty form filter not explained");
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
  // Crawlers/share services receive route metadata before executing JavaScript.
  const seoRoutes = [
    ["/", "Ashesi links, forms &amp; contacts", "/", false],
    ["/category/offices-and-people", "Office contacts &amp; people", "/category/offices-and-people", false],
    ["/contacts", "Office contacts &amp; people", "/category/offices-and-people", false],
    ["/resource/maintenance-service-request", "Maintenance Service Request", "/resource/maintenance-service-request", false],
    ["/resource/maintenance-service-request/report", "Report a problem", "/resource/maintenance-service-request/report", true],
    ["/search", "Search Ashesi resources", "/search", true],
  ];
  for (const [route, title, canonical, noindex] of seoRoutes) {
    const response = await page.request.get(base + route);
    const html = await response.text();
    if (!html.includes(`<title>${title}`) || !html.includes(`rel="canonical" href="https://ashesiresourcehub.netlify.app${canonical}"`) || !html.includes(`name="robots" content="${noindex ? "noindex" : "index"}, follow"`) || !html.includes('property="og:image" content="https://ashesiresourcehub.netlify.app/social-card.png"')) throw Error(`Static route SEO missing: ${route}`);
    const structured = JSON.parse(html.match(/<script id="hub-structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    if (structured["@graph"].some((item) => item.publisher?.name === "Ashesi University")) throw Error("SEO falsely claims university ownership");
  }
  const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
  if (sitemap.includes("/report</loc>") || sitemap.includes("/search</loc>") || sitemap.includes("/contacts</loc>")) throw Error("Non-canonical/noindex views in sitemap");
  await page.goto(base, { waitUntil: "networkidle" });
  await page.locator(".resource-row h3 a").first().click();
  await page.waitForSelector(".detail-record");
  const detailCanonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  if (!detailCanonical.endsWith(new URL(page.url()).pathname) || !(await page.locator('meta[property="og:title"]').getAttribute("content")).includes(await page.locator("h1").innerText())) throw Error("SEO stale after client navigation");
  await page.goto(base + "/resource/does-not-exist", { waitUntil: "networkidle" });
  if (await page.locator('meta[name="robots"]').getAttribute("content") !== "noindex, follow") throw Error("Missing resource remains indexable");
  await page.locator(".page-content a").click();
  await page.waitForFunction(() => document.querySelector('meta[name="robots"]').content === "index, follow");
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
        await delayed.locator("#resource-search").fill(name === "people" ? "finance" : name === "category" ? "Student Portal / CAMU Services" : "my AC is broken");
        await delayed.evaluate(() => { window.__searchInput = document.querySelector("#resource-search"); });
      }
      if (name === "category") {
        await delayed.getByRole("button", { name: "Portals", exact: true }).click();
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
          "SPA navigation without reloads, cached resource data, back navigation, intent search, clear, category filtering, empty states, contact search, report validation/error, emergency destinations, localized delayed loading on seven routes at two widths, preserved search/filter/report state, in-place retry, reduced motion, stationary persistent mobile chrome, full People directory, untruncated category/type/search filters, corrected resource destinations, archived resource exclusion and static/client route SEO passed",
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
