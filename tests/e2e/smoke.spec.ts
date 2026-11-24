import { expect, test, type Page } from "@playwright/test";

// One story, step by step: a new association is founded and organized.
test.describe.configure({ mode: "serial" });

const admin = { name: "Alex Founder", email: "alex@example.org", password: "super-secret-1" };
let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
});

async function submitDialog(p: Page) {
  await p.locator("dialog[open] button[type=submit]").click();
  await expect(p.locator("dialog[open]")).toHaveCount(0);
}

test("first run redirects to the setup wizard", async () => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/setup$/);
});

test("setup wizard creates the association and the admin", async () => {
  await page.getByRole("button", { name: "Français" }).click();
  await page.fill('input[name="name"]', "Les Jardins Partagés");
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.fill('input[name="adminName"]', admin.name);
  await page.fill('input[name="email"]', admin.email);
  await page.fill('input[name="password"]', admin.password);
  await page.fill('input[name="confirm"]', admin.password);
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: "Créer l'espace" }).click();
  await expect(page).toHaveURL(/\/foundation$/);
  await expect(page.getByRole("heading", { name: "Checklist de création" })).toBeVisible();
  await expect(page.getByText("Rédiger les statuts")).toBeVisible();
});

test("a founding step can be completed", async () => {
  await page.getByRole("button", { name: "Marquer comme fait" }).first().click();
  await expect(page.getByText(/1 étape sur 16 terminée/)).toBeVisible();
});

test("switching to English", async () => {
  await page.getByRole("button", { name: admin.name }).click();
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "Founding checklist" })).toBeVisible();
});

test("create a project and a task, then complete the task", async () => {
  await page.goto("/projects?new=1");
  await page.locator('dialog[open] input[name="title"]').fill("Community garden");
  await submitDialog(page);
  await page
    .getByRole("link", { name: /Community garden/ })
    .first()
    .click();
  await expect(page.getByRole("heading", { name: "Community garden" })).toBeVisible();

  await page.getByRole("link", { name: /Tasks/ }).last().click();
  await page.getByRole("button", { name: "New task" }).click();
  await page.locator('dialog[open] input[name="title"]').fill("Buy seeds");
  await submitDialog(page);
  await expect(page.getByText("Buy seeds")).toBeVisible();

  await page.goto("/tasks?view=list");
  await page.getByRole("button", { name: "Mark as done" }).first().click();
  await expect(page.locator("text=Buy seeds").first()).toHaveClass(/line-through/);
});

test("comment on a task", async () => {
  await page.getByRole("link", { name: "Buy seeds" }).click();
  await page.fill('textarea[name="body"]', "Organic seeds please!");
  await page.getByRole("button", { name: "Comment" }).click();
  await expect(page.getByText("Organic seeds please!")).toBeVisible();
});

test("create a pole and join it", async () => {
  await page.goto("/poles?new=1");
  await page.locator('dialog[open] input[name="name"]').fill("Gardening");
  await submitDialog(page);
  await page.getByRole("link", { name: /Gardening/ }).click();
  await expect(page.getByRole("heading", { name: "Gardening" })).toBeVisible();
});

test("add a member and activate the invitation", async ({ browser }) => {
  await page.goto("/members?new=1");
  await page.locator('dialog[open] input[name="name"]').fill("Sam Gardener");
  await page.locator('dialog[open] input[name="email"]').fill("sam@example.org");
  await page.locator("dialog[open] button[type=submit]").click();
  // The invitation link is shown in a dialog, ready to be copied.
  const linkInput = page.locator("dialog[open] input[readonly]");
  await expect(linkInput).toBeVisible();
  const link = await linkInput.inputValue();
  expect(link).toContain("/invite/");

  const guest = await browser.newPage();
  await guest.goto(link);
  await guest.fill('input[name="password"]', "garden-password");
  await guest.fill('input[name="confirm"]', "garden-password");
  await guest.locator("button[type=submit]").click();
  await expect(guest).toHaveURL(/\/$/);
  await expect(guest.getByRole("heading", { level: 1 })).toContainText("Sam");
  await guest.close();
});

test("plan an event and answer it", async () => {
  await page.goto("/events?new=1");
  await page.locator('dialog[open] input[name="title"]').fill("General assembly");
  await page.locator('dialog[open] input[name="startAt"]').fill("2030-06-01T18:00");
  await submitDialog(page);
  await page.getByRole("link", { name: "General assembly" }).filter({ visible: true }).first().click();
  await expect(page).toHaveURL(/\/events\/\w+/);
  // Next.js keeps recently visited pages mounted (hidden), so only target visible elements.
  const maybe = page.getByRole("button", { name: "Maybe", exact: true }).filter({ visible: true });
  await maybe.click();
  await expect(maybe).toHaveAttribute("aria-pressed", "true");
});

test("record money in and out", async () => {
  await page.goto("/finance");
  await page.getByRole("button", { name: "New transaction" }).click();
  await page.locator('dialog[open] input[name="label"]').fill("Garden tools");
  await page.locator('dialog[open] input[name="amount"]').fill("42,50");
  await submitDialog(page);
  await expect(page.getByText("Garden tools")).toBeVisible();
  await expect(page.getByText("−€42.50").first()).toBeVisible();
});

test("upload a document", async () => {
  await page.goto("/documents");
  await page.getByRole("button", { name: "Add document" }).click();
  await page.setInputFiles('dialog[open] input[type="file"]', {
    name: "statutes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Statutes of the association"),
  });
  await page.locator("dialog[open] button[type=submit]").click();
  await expect(page.getByText("statutes", { exact: true })).toBeVisible();
  const href = await page.locator('a[href^="/api/files/"]').filter({ visible: true }).first().getAttribute("href");
  const res = await page.request.get(href!);
  expect(await res.text()).toBe("Statutes of the association");
});

test("search finds the project", async () => {
  await page.goto("/");
  await page.getByRole("button", { name: /Search…/ }).click();
  await page.keyboard.type("garden");
  await expect(page.locator("dialog[open]").getByText("Community garden")).toBeVisible();
});

test("signed-out visitors are redirected to login", async ({ browser }) => {
  const anon = await browser.newPage();
  await anon.goto("/projects");
  await expect(anon).toHaveURL(/\/login/);
  const res = await anon.request.get("/api/export/backup");
  expect(res.status()).toBe(403);
  await anon.close();
});
