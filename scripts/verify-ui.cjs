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
  env: { ...process.env, PUBLIC_CONVEX_URL: "" },
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
  const page = await browser.newPage({
    viewport: { width: 1140, height: 960 },
    deviceScaleFactor: 1,
  });
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
    throw Error("Search after View Transition failed");
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
          "Intent search, clear, category filtering, empty states, contact search, report validation/error, emergency destinations passed",
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
