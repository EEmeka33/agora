import { expect, test, type Browser, type Page } from "@playwright/test";

// One story, step by step: an association is founded, people join with a code,
// work is requested between poles, and data stays private to each association.
test.describe.configure({ mode: "serial" });

const alex = { name: "Alex Founder", email: "alex@example.org", password: "garden-founder-2026" };
const sam = { name: "Sam Gardener", email: "sam@example.org", password: "watering-can-2026" };
let page: Page; // Alex
let samPage: Page;
let joinLink = "";

// Next.js keeps recently visited pages mounted (hidden): always target visible elements.
const visible = (p: Page, role: Parameters<Page["getByRole"]>[0], name: string | RegExp) =>
  p
    .getByRole(role, { name, exact: typeof name === "string" })
    .filter({ visible: true })
    .first();

const field = (p: Page, name: string, tag = "input") =>
  p.locator(`${tag}[name="${name}"]`).filter({ visible: true }).first();
const txt = (p: Page, text: string | RegExp) => p.getByText(text).filter({ visible: true }).first();

async function submitDialog(p: Page) {
  await p.locator("dialog[open] button[type=submit]").click();
  await expect(p.locator("dialog[open]")).toHaveCount(0);
}

async function signUp(browser: Browser, who: { name: string; email: string; password: string }, url = "/signup") {
  const p = await browser.newPage();
  await p.goto(url);
  await field(p, "name").fill(who.name);
  await field(p, "email").fill(who.email);
  await field(p, "password").fill(who.password);
  await field(p, "confirm").fill(who.password);
  return p;
}

test("first visit leads to account creation", async ({ browser }) => {
  page = await browser.newPage();
  await page.goto("/");
  await expect(page).toHaveURL(/\/signup$/);
});

test("weak passwords are refused", async () => {
  await field(page, "name").fill(alex.name);
  await field(page, "email").fill(alex.email);
  await field(page, "password").fill("password123");
  await field(page, "confirm").fill("password123");
  await page.getByRole("button", { name: "Create my account" }).click();
  await expect(txt(page, /too common/)).toBeVisible();
});

test("sign up, then create the association", async () => {
  await field(page, "password").fill(alex.password);
  await field(page, "confirm").fill(alex.password);
  await page.getByRole("button", { name: "Create my account" }).click();
  await expect(page).toHaveURL(/\/welcome$/);
  await page.getByRole("link", { name: "Create an association" }).click();
  await field(page, "name").fill("Les Jardins Partagés");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/foundation$/);
  await expect(txt(page, "Write the statutes")).toBeVisible();
});

test("a founding step can be completed", async () => {
  await visible(page, "button", "Mark as done").click();
  await expect(txt(page, /1 of 16 steps done/)).toBeVisible();
});

test("the interface switches to French and back", async () => {
  await visible(page, "button", alex.name).click();
  await page.getByRole("button", { name: "Français" }).click();
  await expect(page.getByRole("heading", { name: "Checklist de création" })).toBeVisible();
  await visible(page, "button", alex.name).click();
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "Founding checklist" })).toBeVisible();
});

test("create a single-use join code for the Gardening pole", async () => {
  await page.goto("/poles?new=1");
  await page.locator('dialog[open] input[name="name"]').fill("Gardening");
  await page.locator('dialog[open] select[name="leadId"]').selectOption({ label: alex.name });
  await submitDialog(page);

  await page.goto("/members");
  await visible(page, "button", "New code").click();
  await page.locator('dialog[open] input[name="maxUses"]').fill("1");
  await page.locator('dialog[open] select[name="poleId"]').selectOption({ label: "Gardening" });
  await page.locator("dialog[open] button[type=submit]").click();
  const linkInput = page.locator("dialog[open] input[readonly]");
  await expect(linkInput).toBeVisible();
  joinLink = await linkInput.inputValue();
  expect(joinLink).toMatch(/\/join\?code=[A-Z2-9]{5}-[A-Z2-9]{5}$/);
});

test("someone joins with the code", async ({ browser }) => {
  samPage = await signUp(browser, sam, new URL(joinLink).pathname + new URL(joinLink).search);
  await expect(field(samPage, "code")).toHaveValue(/[A-Z2-9]{5}-[A-Z2-9]{5}/);
  await samPage.getByRole("button", { name: "Create my account" }).click();
  await expect(samPage).toHaveURL(/\/$/);
  await expect(txt(samPage, "Les Jardins Partagés")).toBeVisible();
});

test("the code cannot be used more than allowed", async ({ browser }) => {
  const late = await signUp(
    browser,
    { name: "Late Person", email: "late@example.org", password: "arrived-after-everyone" },
    new URL(joinLink).pathname + new URL(joinLink).search,
  );
  await late.getByRole("button", { name: "Create my account" }).click();
  // The account is created but the code is used up: the person lands on the welcome page.
  await expect(late).toHaveURL(/\/welcome$/);
  await expect(late.getByText("Les Jardins Partagés")).toHaveCount(0);
  await late.close();
});

test("a request to a pole notifies its members, who take it", async () => {
  await page.goto("/requests?new=1");
  await page.locator('dialog[open] select[name="poleId"]').selectOption({ label: "Gardening" });
  await page.locator('dialog[open] input[name="title"]').fill("Water the tomatoes this weekend");
  await submitDialog(page);

  await samPage.goto("/notifications");
  await expect(txt(samPage, /asks Gardening: Water the tomatoes/)).toBeVisible();
  await samPage.goto("/requests");
  await visible(samPage, "button", "Take it").click();
  await expect(txt(samPage, /It's yours/)).toBeVisible();
  await samPage.goto("/tasks?scope=mine&view=list");
  await expect(visible(samPage, "link", /Water the tomatoes/)).toBeVisible();
});

test("finishing the task closes the request and tells the requester", async () => {
  await visible(samPage, "button", "Mark as done").click();
  await page.goto("/notifications");
  await expect(txt(page, /took your request/)).toBeVisible();
  await expect(txt(page, /is done/)).toBeVisible();
  await page.goto("/requests?tab=sent");
  await expect(txt(page, "Done")).toBeVisible();
});

test("vote on a decision", async () => {
  await page.goto("/polls?new=1");
  await page.locator('dialog[open] input[name="question"]').fill("Plant strawberries this spring?");
  await page.locator("dialog[open]").getByRole("button", { name: "Yes / No / Abstain" }).click();
  await submitDialog(page);

  await samPage.goto("/polls");
  await samPage.getByLabel("Yes").check();
  await visible(samPage, "button", "Vote").click();
  await expect(txt(samPage, "You voted")).toBeVisible();
  await expect(txt(samPage, /1 of 2 voted/)).toBeVisible();
});

test("log volunteer time", async () => {
  await samPage.goto("/volunteering?new=1");
  await samPage.locator('dialog[open] input[name="duration"]').fill("1h30");
  await samPage.locator('dialog[open] input[name="description"]').fill("Watering");
  await submitDialog(samPage);
  await expect(txt(samPage, "Watering")).toBeVisible();
  await expect(txt(samPage, "1.5 h")).toBeVisible();
});

test("projects, tasks and comments", async () => {
  await page.goto("/projects?new=1");
  await page.locator('dialog[open] input[name="title"]').fill("Community garden");
  await submitDialog(page);
  await visible(page, "link", /Community garden/).click();
  await expect(page.getByRole("heading", { name: "Community garden" })).toBeVisible();
  await page.locator('a[href*="?tab=tasks"]').filter({ visible: true }).first().click();
  await expect(page).toHaveURL(/tab=tasks/);
  await visible(page, "button", "New task").click();
  await page.locator('dialog[open] input[name="title"]').fill("Buy seeds");
  await submitDialog(page);
  await expect(visible(page, "link", /Buy seeds/)).toBeVisible();
  await page.goto("/projects");
  await expect(txt(page, "1/1 tasks").or(txt(page, "0/1 tasks"))).toBeVisible();
  await page.goto("/tasks?view=list");
  await visible(page, "link", /Buy seeds/).click();
  await field(page, "body", "textarea").fill("Organic seeds please!");
  await page.getByRole("button", { name: "Comment" }).click();
  await expect(txt(page, "Organic seeds please!")).toBeVisible();
});

test("events, money and documents", async () => {
  await page.goto("/events?new=1");
  await page.locator('dialog[open] input[name="title"]').fill("General assembly");
  await page.locator('dialog[open] input[name="startAt"]').fill("2030-06-01T18:00");
  await submitDialog(page);
  await visible(page, "link", "General assembly").click();
  await expect(page).toHaveURL(/\/events\/\w+/);
  const maybe = visible(page, "button", "Maybe");
  await maybe.click();
  await expect(maybe).toHaveAttribute("aria-pressed", "true");

  await page.goto("/finance");
  await visible(page, "button", "New transaction").click();
  await page.locator('dialog[open] input[name="label"]').fill("Garden tools");
  await page.locator('dialog[open] input[name="amount"]').fill("42,50");
  await submitDialog(page);
  await expect(txt(page, "−€42.50")).toBeVisible();

  await page.goto("/documents");
  await visible(page, "button", "Add document").click();
  await page.setInputFiles('dialog[open] input[type="file"]', {
    name: "statutes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Statutes of the association"),
  });
  await page.locator("dialog[open] button[type=submit]").click();
  const href = await page.locator('a[href^="/api/files/"]').filter({ visible: true }).first().getAttribute("href");
  expect(await (await page.request.get(href!)).text()).toBe("Statutes of the association");
});

test("each association's data stays private", async () => {
  // Sam creates another association with a secret project…
  await samPage.goto("/welcome/new");
  await field(samPage, "name").fill("Sam's Secret Club");
  await samPage.getByRole("button", { name: "Continue" }).click();
  await samPage.getByRole("button", { name: "Create workspace" }).click();
  await expect(samPage).toHaveURL(/\/foundation$/);
  await samPage.goto("/projects?new=1");
  await samPage.locator('dialog[open] input[name="title"]').fill("Top secret plan");
  await submitDialog(samPage);
  await visible(samPage, "link", /Top secret plan/).click();
  await expect(samPage).toHaveURL(/\/projects\/\w+/);
  const secretUrl = new URL(samPage.url()).pathname;

  // …that Alex cannot find nor open.
  const search = await page.request.get("/api/search?q=secret");
  expect(JSON.stringify(await search.json())).not.toContain("Top secret plan");
  await page.goto(secretUrl);
  await expect(txt(page, "Not found")).toBeVisible();
});

test("members cannot reach admin-only data", async () => {
  await samPage.goto("/welcome");
  await samPage.getByRole("button", { name: /Les Jardins Partagés/ }).click();
  await expect(samPage).toHaveURL(/\/$/);
  expect((await samPage.request.get("/api/export/backup")).status()).toBe(403);
  expect((await samPage.request.get("/api/export/members")).status()).toBe(403);
});

test("signed-out visitors are sent to the login page", async ({ browser }) => {
  const anon = await browser.newPage();
  await anon.goto("/projects");
  await expect(anon).toHaveURL(/\/login/);
  expect((await anon.request.get("/api/export/backup")).status()).toBe(403);
  expect((await anon.request.get("/api/search?q=garden")).status()).toBe(401);
  await anon.close();
});

test("a wrong password is refused, then the account locks", async ({ browser }) => {
  const p = await browser.newPage();
  await p.goto("/login");
  for (let i = 0; i < 5; i++) {
    await field(p, "email").fill(sam.email);
    await field(p, "password").fill(`wrong-password-${i}`);
    await p.getByRole("button", { name: "Sign in" }).click();
    await expect(txt(p, /Incorrect email or password|Too many failed attempts/)).toBeVisible();
  }
  await field(p, "password").fill(sam.password);
  await p.getByRole("button", { name: "Sign in" }).click();
  await expect(txt(p, /Too many failed attempts/)).toBeVisible();
  await p.close();
});
