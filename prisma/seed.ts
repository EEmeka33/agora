/**
 * Demo data for Agora.
 *
 *   npm run db:seed            → fills an EMPTY database with a demo association
 *   npm run db:seed -- --reset → wipes everything first (careful!)
 *
 * Every demo account uses the password: agora1234
 */
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { foundationSteps } from "../src/lib/foundation-template";

const db = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./data/agora.db" }),
});
const reset = process.argv.includes("--reset");
const locale = process.env.SEED_LOCALE === "fr" ? "fr" : "en";
const PASSWORD = "agora1234";

const now = new Date();
const wallNow = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
const day = (offset: number, hour = 0, minute = 0) => {
  const d = new Date(
    Date.UTC(wallNow.getUTCFullYear(), wallNow.getUTCMonth(), wallNow.getUTCDate() + offset, hour, minute),
  );
  return d;
};
const ago = (days: number) => new Date(now.getTime() - days * 86_400_000);
const eur = (n: number) => Math.round(n * 100);

async function wipe() {
  // Order matters because of foreign keys.
  await db.activity.deleteMany();
  await db.taskComment.deleteMany();
  await db.task.deleteMany();
  await db.milestone.deleteMany();
  await db.projectUpdate.deleteMany();
  await db.projectMember.deleteMany();
  await db.membership.deleteMany();
  await db.transaction.deleteMany();
  await db.document.deleteMany();
  await db.eventAttendee.deleteMany();
  await db.event.deleteMany();
  await db.project.deleteMany();
  await db.responsibility.deleteMany();
  await db.poleMember.deleteMany();
  await db.pole.deleteMany();
  await db.foundationStep.deleteMany();
  await db.announcement.deleteMany();
  await db.invitation.deleteMany();
  await db.user.deleteMany();
  await db.association.deleteMany();
}

async function main() {
  const existing = await db.user.count();
  if (existing > 0 && !reset) {
    console.log("The database already contains data. Run `npm run db:seed -- --reset` to wipe it and load the demo.");
    return;
  }
  if (reset) await wipe();

  const hash = await bcrypt.hash(PASSWORD, 10);
  const year = wallNow.getUTCFullYear();

  await db.association.create({
    data: {
      name: "Green Campus Collective",
      shortName: "GCC",
      tagline: "Making our campus greener, together",
      purpose:
        "Promote sustainable practices on campus through events, workshops and concrete actions: composting, repair cafés, local partnerships.",
      legalForm: "Loi 1901",
      registrationNumber: "W691234567",
      foundedAt: day(-120),
      email: "hello@greencampus.example",
      website: "https://greencampus.example",
      address: "12 rue de l'Université",
      postalCode: "69007",
      city: "Lyon",
      country: "France",
      accentColor: "emerald",
      locale,
      currency: "EUR",
      membershipFeeCents: eur(15),
      fiscalYearStartMonth: 9,
    },
  });

  // ─── Members ──────────────────────────────────────────────────────────────
  const people = [
    {
      key: "camille",
      name: "Camille Martin",
      email: "camille@greencampus.example",
      role: "ADMIN",
      boardPosition: "PRESIDENT",
      title: "President",
      avatarColor: "emerald",
      skills: "public speaking, project management",
    },
    {
      key: "yanis",
      name: "Yanis Benali",
      email: "yanis@greencampus.example",
      role: "MANAGER",
      boardPosition: "TREASURER",
      title: "Treasurer",
      avatarColor: "sky",
      skills: "accounting, spreadsheets",
    },
    {
      key: "lea",
      name: "Léa Dubois",
      email: "lea@greencampus.example",
      role: "MANAGER",
      boardPosition: "SECRETARY",
      title: "Secretary",
      avatarColor: "violet",
      skills: "writing, organization",
    },
    {
      key: "thomas",
      name: "Thomas Nguyen",
      email: "thomas@greencampus.example",
      role: "MEMBER",
      boardPosition: "VICE_PRESIDENT",
      title: "Partnerships lead",
      avatarColor: "teal",
      skills: "negotiation, networking",
    },
    {
      key: "ines",
      name: "Inès Moreau",
      email: "ines@greencampus.example",
      role: "MANAGER",
      boardPosition: null,
      title: "Events lead",
      avatarColor: "amber",
      skills: "event planning, logistics",
    },
    {
      key: "lucas",
      name: "Lucas Bernard",
      email: "lucas@greencampus.example",
      role: "MEMBER",
      boardPosition: null,
      title: "Communication lead",
      avatarColor: "rose",
      skills: "design, video, social media",
    },
    {
      key: "sarah",
      name: "Sarah Cohen",
      email: "sarah@greencampus.example",
      role: "MEMBER",
      boardPosition: null,
      title: "Composting volunteer",
      avatarColor: "lime",
      skills: "gardening, biology",
    },
    {
      key: "maxime",
      name: "Maxime Petit",
      email: "maxime@greencampus.example",
      role: "MEMBER",
      boardPosition: null,
      title: null,
      avatarColor: "orange",
      skills: "photography",
      noAccount: true,
    },
    {
      key: "chloe",
      name: "Chloé Laurent",
      email: "chloe@greencampus.example",
      role: "MEMBER",
      boardPosition: null,
      title: null,
      avatarColor: "pink",
      skills: null,
      noAccount: true,
    },
  ] as const;

  const u: Record<string, string> = {};
  for (const [i, p] of people.entries()) {
    const user = await db.user.create({
      data: {
        name: p.name,
        email: p.email,
        passwordHash: "noAccount" in p ? null : hash,
        role: p.role,
        boardPosition: p.boardPosition,
        title: p.title,
        avatarColor: p.avatarColor,
        skills: p.skills,
        locale,
        joinedAt: day(-120 + i * 6),
        lastLoginAt: "noAccount" in p ? null : ago(i % 4),
      },
    });
    u[p.key] = user.id;
  }
  await db.invitation.create({
    data: {
      token: "demo-invitation-maxime",
      kind: "INVITE",
      userId: u.maxime,
      invitedById: u.camille,
      expiresAt: day(6),
    },
  });

  // ─── Poles ────────────────────────────────────────────────────────────────
  const poleDefs = [
    {
      key: "com",
      name: "Communication",
      color: "rose",
      icon: "megaphone",
      mission: "Website, social media, posters and newsletters.",
      leads: ["lucas"],
      members: ["maxime", "chloe"],
    },
    {
      key: "events",
      name: "Events",
      color: "amber",
      icon: "calendar",
      mission: "Organize festivals, workshops and the welcome week.",
      leads: ["ines"],
      members: ["sarah", "chloe", "lucas"],
    },
    {
      key: "partners",
      name: "Partnerships",
      color: "teal",
      icon: "handshake",
      mission: "Find sponsors and partner with local businesses.",
      leads: ["thomas"],
      members: ["yanis"],
    },
    {
      key: "green",
      name: "Sustainability actions",
      color: "emerald",
      icon: "leaf",
      mission: "Composting, repair café and day-to-day green actions on campus.",
      leads: ["sarah", "camille"],
      members: ["maxime"],
    },
    {
      key: "treasury",
      name: "Treasury",
      color: "violet",
      icon: "wallet",
      mission: "Budget, membership fees, grants and accounting.",
      leads: ["yanis"],
      members: ["lea"],
    },
  ];
  const pole: Record<string, string> = {};
  for (const [i, p] of poleDefs.entries()) {
    const created = await db.pole.create({
      data: {
        name: p.name,
        color: p.color,
        icon: p.icon,
        mission: p.mission,
        order: i,
        members: {
          create: [
            ...p.leads.map((k) => ({ userId: u[k], role: "LEAD" })),
            ...p.members.map((k) => ({ userId: u[k], role: "MEMBER" })),
          ],
        },
      },
    });
    pole[p.key] = created.id;
  }

  // ─── Who does what ────────────────────────────────────────────────────────
  await db.responsibility.createMany({
    data: [
      {
        title: "Keep the accounts and bank reconciliation",
        frequency: "MONTHLY",
        ownerId: u.yanis,
        poleId: pole.treasury,
      },
      { title: "Collect membership fees", frequency: "YEARLY", ownerId: u.yanis, poleId: pole.treasury },
      { title: "Write the minutes of board meetings", frequency: "MONTHLY", ownerId: u.lea },
      { title: "Publish on social media", frequency: "WEEKLY", ownerId: u.lucas, poleId: pole.com },
      { title: "Answer the association mailbox", frequency: "ONGOING", ownerId: u.lea },
      { title: "Empty and maintain the compost bins", frequency: "WEEKLY", ownerId: u.sarah, poleId: pole.green },
      { title: "Renew the liability insurance", frequency: "YEARLY", ownerId: u.camille },
      { title: "Prospect new sponsors", frequency: "QUARTERLY", ownerId: u.thomas, poleId: pole.partners },
    ],
  });

  // ─── Founding checklist ───────────────────────────────────────────────────
  const owners = [
    "camille",
    "camille",
    "thomas",
    "lea",
    "lea",
    "camille",
    "camille",
    "lea",
    "lea",
    "yanis",
    "yanis",
    "camille",
    "yanis",
    "camille",
    "lea",
    "lucas",
  ];
  const steps = foundationSteps(locale);
  for (const [i, s] of steps.entries()) {
    const status = i === 9 ? "SKIPPED" : i < 11 ? "DONE" : i < 13 ? "IN_PROGRESS" : "TODO";
    await db.foundationStep.create({
      data: {
        ...s,
        status,
        assigneeId: u[owners[i]],
        dueDate: status === "DONE" || status === "SKIPPED" ? null : day(7 + (i - 11) * 5),
        completedAt: status === "DONE" ? day(-110 + i * 6) : null,
      },
    });
  }

  // ─── Projects ─────────────────────────────────────────────────────────────
  type TaskDef = { title: string; status: string; priority?: string; due?: number; who?: string; description?: string };
  const projectDefs: {
    key: string;
    title: string;
    description: string;
    objectives?: string;
    status: string;
    priority: string;
    pole: string;
    lead: string;
    team: string[];
    start?: number;
    due?: number;
    budget?: number;
    color: string;
    milestones: { title: string; due?: number; done: boolean }[];
    tasks: TaskDef[];
  }[] = [
    {
      key: "festival",
      title: "Spring Climate Festival",
      description:
        "A one-day festival on the main lawn: talks, workshops, local food stands and a concert to raise awareness about climate action.",
      objectives: "500 visitors · 10 partner stands · zero single-use plastic",
      status: "IN_PROGRESS",
      priority: "HIGH",
      pole: "events",
      lead: "ines",
      team: ["lucas", "thomas", "sarah", "chloe"],
      start: -35,
      due: 62,
      budget: 2500,
      color: "amber",
      milestones: [
        { title: "Date and venue confirmed", due: -20, done: true },
        { title: "Program and speakers locked", due: 14, done: false },
        { title: "Partners signed", due: 30, done: false },
        { title: "Festival day", due: 62, done: false },
      ],
      tasks: [
        { title: "Book the main lawn with the university", status: "DONE", who: "ines", due: -21 },
        {
          title: "Draft the festival program",
          status: "IN_PROGRESS",
          priority: "HIGH",
          who: "ines",
          due: 5,
          description: "Morning: talks. Afternoon: workshops. Evening: concert.",
        },
        { title: "Contact 3 speakers on climate topics", status: "IN_PROGRESS", who: "thomas", due: 9 },
        { title: "Design the festival poster", status: "REVIEW", who: "lucas", due: 2 },
        { title: "Request the sound system quote", status: "TODO", who: "chloe", due: 18 },
        { title: "Recruit 20 volunteers for the day", status: "TODO", priority: "MEDIUM", who: "sarah", due: 40 },
        { title: "Apply for the student life grant", status: "TODO", priority: "URGENT", who: "yanis", due: -2 },
        { title: "Plan the waste sorting stations", status: "TODO", who: "sarah", due: 45 },
      ],
    },
    {
      key: "compost",
      title: "Campus composting program",
      description: "Install compost bins next to the cafeteria and train volunteers to maintain them.",
      objectives: "Divert 1 ton of organic waste per semester",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      pole: "green",
      lead: "sarah",
      team: ["camille", "maxime"],
      start: -70,
      due: 25,
      budget: 600,
      color: "emerald",
      milestones: [
        { title: "Agreement with the cafeteria", due: -50, done: true },
        { title: "Bins installed", due: -15, done: true },
        { title: "10 volunteers trained", due: 20, done: false },
      ],
      tasks: [
        { title: "Buy 4 compost bins", status: "DONE", who: "sarah", due: -30 },
        { title: "Write the composting guide", status: "DONE", who: "camille", due: -20 },
        { title: "Install signage near the bins", status: "DONE", who: "maxime", due: -12 },
        { title: "Organize the volunteer training session", status: "IN_PROGRESS", who: "sarah", due: 8 },
        { title: "Weigh collected waste every week", status: "TODO", who: "sarah", due: 3 },
      ],
    },
    {
      key: "web",
      title: "Website & social media launch",
      description: "Launch the website, an Instagram account and a monthly newsletter.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      pole: "com",
      lead: "lucas",
      team: ["maxime", "lea"],
      start: -25,
      due: 12,
      color: "rose",
      milestones: [
        { title: "Visual identity validated", due: -10, done: true },
        { title: "Website online", due: 12, done: false },
      ],
      tasks: [
        { title: "Finalize the logo", status: "DONE", who: "lucas", due: -12 },
        { title: "Write the 'About us' page", status: "REVIEW", who: "lea", due: 1 },
        { title: "Take photos of the team", status: "TODO", who: "maxime", due: 6 },
        { title: "Set up the newsletter tool", status: "TODO", who: "lucas", due: 10 },
        { title: "Create the Instagram account", status: "DONE", who: "lucas", due: -5 },
      ],
    },
    {
      key: "partners",
      title: "Partnerships with local businesses",
      description: "Build a network of local shops offering discounts to members and sponsoring our events.",
      status: "PLANNED",
      priority: "MEDIUM",
      pole: "partners",
      lead: "thomas",
      team: ["yanis"],
      start: 10,
      due: 95,
      budget: 150,
      color: "teal",
      milestones: [{ title: "Partnership kit ready", due: 25, done: false }],
      tasks: [
        { title: "Prepare the partnership kit (PDF)", status: "TODO", who: "thomas", due: 20 },
        { title: "List 30 shops to contact", status: "TODO", who: "yanis", due: 15 },
      ],
    },
    {
      key: "welcome",
      title: "Welcome week stand",
      description: "Stand during the university welcome week to recruit new members.",
      status: "COMPLETED",
      priority: "MEDIUM",
      pole: "events",
      lead: "camille",
      team: ["ines", "lucas"],
      start: -80,
      due: -66,
      budget: 200,
      color: "sky",
      milestones: [{ title: "Stand held", due: -66, done: true }],
      tasks: [
        { title: "Print flyers", status: "DONE", who: "lucas", due: -70 },
        { title: "Staff the stand schedule", status: "DONE", who: "ines", due: -68 },
      ],
    },
    {
      key: "repair",
      title: "Monthly repair café",
      description: "Volunteers help students repair clothes, bikes and electronics instead of throwing them away.",
      status: "IDEA",
      priority: "LOW",
      pole: "green",
      lead: "camille",
      team: [],
      color: "lime",
      milestones: [],
      tasks: [{ title: "Find a room for the repair café", status: "TODO", who: "camille" }],
    },
  ];

  const project: Record<string, string> = {};
  const taskIds: string[] = [];
  for (const p of projectDefs) {
    const created = await db.project.create({
      data: {
        title: p.title,
        description: p.description,
        objectives: p.objectives,
        status: p.status,
        priority: p.priority,
        poleId: pole[p.pole],
        leadId: u[p.lead],
        startDate: p.start !== undefined ? day(p.start) : null,
        dueDate: p.due !== undefined ? day(p.due) : null,
        budgetCents: p.budget ? eur(p.budget) : null,
        color: p.color,
        createdAt: ago(p.start ? Math.max(1, -p.start + 5) : 3),
        members: { create: [p.lead, ...p.team].map((k) => ({ userId: u[k] })) },
        milestones: {
          create: p.milestones.map((m, i) => ({
            title: m.title,
            dueDate: m.due !== undefined ? day(m.due) : null,
            done: m.done,
            doneAt: m.done ? day(m.due ?? 0) : null,
            order: i,
          })),
        },
      },
    });
    project[p.key] = created.id;
    for (const [i, task] of p.tasks.entries()) {
      const t = await db.task.create({
        data: {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority ?? "MEDIUM",
          dueDate: task.due !== undefined ? day(task.due) : null,
          completedAt: task.status === "DONE" ? day(task.due ?? 0) : null,
          projectId: created.id,
          poleId: pole[p.pole],
          assigneeId: task.who ? u[task.who] : null,
          creatorId: u[p.lead],
          order: i,
        },
      });
      taskIds.push(t.id);
    }
  }

  // Tasks outside projects
  await db.task.createMany({
    data: [
      {
        title: "Prepare the agenda of the next board meeting",
        status: "TODO",
        priority: "HIGH",
        dueDate: day(4),
        assigneeId: u.lea,
        creatorId: u.camille,
      },
      {
        title: "Update the member list for the insurance",
        status: "TODO",
        dueDate: day(12),
        assigneeId: u.yanis,
        creatorId: u.camille,
        poleId: pole.treasury,
      },
      {
        title: "Order association t-shirts",
        status: "IN_PROGRESS",
        priority: "LOW",
        dueDate: day(20),
        assigneeId: u.lucas,
        creatorId: u.lucas,
        poleId: pole.com,
      },
      {
        title: "Answer the city hall about the forum of associations",
        status: "TODO",
        priority: "URGENT",
        dueDate: day(1),
        assigneeId: u.camille,
        creatorId: u.lea,
      },
      { title: "Clean the storage room", status: "TODO", priority: "LOW", creatorId: u.ines },
    ],
  });

  // Comments
  await db.taskComment.createMany({
    data: [
      {
        taskId: taskIds[3],
        authorId: u.lucas,
        body: "First draft is ready, feedback welcome! I used the new color palette.",
        createdAt: ago(1),
      },
      {
        taskId: taskIds[3],
        authorId: u.ines,
        body: "Love it. Can we make the date bigger and add the partners' logos at the bottom?",
        createdAt: ago(0.5),
      },
      {
        taskId: taskIds[1],
        authorId: u.thomas,
        body: "Two speakers already said yes for the morning slot.",
        createdAt: ago(2),
      },
    ],
  });

  // Project updates
  await db.projectUpdate.createMany({
    data: [
      {
        projectId: project.festival,
        authorId: u.ines,
        health: "ON_TRACK",
        progress: 25,
        body: "Venue booked and poster in review. Next: lock the program and send the grant application.",
        createdAt: ago(9),
      },
      {
        projectId: project.festival,
        authorId: u.ines,
        health: "AT_RISK",
        progress: 30,
        body: "The grant application is late — Yanis needs the final budget by Friday. Speakers are coming along well.",
        createdAt: ago(1),
      },
      {
        projectId: project.compost,
        authorId: u.sarah,
        health: "ON_TRACK",
        progress: 70,
        body: "Bins are installed and already used! 42 kg collected the first week.",
        createdAt: ago(4),
      },
      {
        projectId: project.web,
        authorId: u.lucas,
        health: "ON_TRACK",
        progress: 55,
        body: "Logo done, Instagram live (120 followers). The website should go online next week.",
        createdAt: ago(3),
      },
    ],
  });

  // ─── Events ───────────────────────────────────────────────────────────────
  const ga = await db.event.create({
    data: {
      title: "Constitutive general assembly",
      type: "GENERAL_ASSEMBLY",
      startAt: day(-118, 18, 30),
      endAt: day(-118, 20, 30),
      location: "Room B204",
      agenda:
        "1. Presentation of the project\n2. Adoption of the statutes\n3. Election of the board\n4. Membership fee",
      minutes:
        "Present: 9 founding members.\n\n1. Camille presented the project of the association.\n2. The statutes were adopted unanimously.\n3. Elected board: Camille Martin (president), Léa Dubois (secretary), Yanis Benali (treasurer), Thomas Nguyen (vice-president).\n4. The annual membership fee is set to €15.",
      createdById: u.camille,
    },
  });
  const board = await db.event.create({
    data: {
      title: "Monthly board meeting",
      type: "BOARD_MEETING",
      startAt: day(5, 19, 0),
      endAt: day(5, 20, 30),
      location: "Café du Campus",
      agenda: "1. Festival budget\n2. Grant application\n3. Forum of associations",
      createdById: u.lea,
    },
  });
  const workshop = await db.event.create({
    data: {
      title: "Composting volunteer training",
      type: "WORKSHOP",
      startAt: day(8, 12, 30),
      endAt: day(8, 13, 30),
      location: "Cafeteria garden",
      poleId: pole.green,
      projectId: project.compost,
      createdById: u.sarah,
    },
  });
  const poleMeeting = await db.event.create({
    data: {
      title: "Events pole meeting",
      type: "POLE_MEETING",
      startAt: day(2, 18, 0),
      location: "Online",
      poleId: pole.events,
      createdById: u.ines,
    },
  });
  const festival = await db.event.create({
    data: {
      title: "Spring Climate Festival",
      type: "EVENT",
      startAt: day(62, 10, 0),
      endAt: day(62, 23, 0),
      location: "Main lawn",
      projectId: project.festival,
      poleId: pole.events,
      description: "Talks, workshops, food stands and a concert. Free and open to all students!",
      createdById: u.ines,
    },
  });
  await db.event.create({
    data: {
      title: "Welcome week stand",
      type: "EVENT",
      startAt: day(-67, 10, 0),
      endAt: day(-67, 17, 0),
      location: "Main hall",
      projectId: project.welcome,
      createdById: u.camille,
    },
  });
  const rsvps: [string, string, string][] = [
    [ga.id, "camille", "GOING"],
    [ga.id, "lea", "GOING"],
    [ga.id, "yanis", "GOING"],
    [ga.id, "thomas", "GOING"],
    [board.id, "camille", "GOING"],
    [board.id, "lea", "GOING"],
    [board.id, "yanis", "MAYBE"],
    [board.id, "thomas", "NOT_GOING"],
    [workshop.id, "sarah", "GOING"],
    [workshop.id, "maxime", "GOING"],
    [workshop.id, "camille", "MAYBE"],
    [poleMeeting.id, "ines", "GOING"],
    [poleMeeting.id, "lucas", "GOING"],
    [poleMeeting.id, "chloe", "MAYBE"],
    [festival.id, "ines", "GOING"],
    [festival.id, "lucas", "GOING"],
    [festival.id, "sarah", "GOING"],
  ];
  for (const [eventId, k, status] of rsvps) await db.eventAttendee.create({ data: { eventId, userId: u[k], status } });

  // ─── Money ────────────────────────────────────────────────────────────────
  const tx = (
    label: string,
    type: "INCOME" | "EXPENSE",
    amount: number,
    category: string,
    offset: number,
    extra: Record<string, unknown> = {},
  ) =>
    db.transaction.create({
      data: { label, type, amountCents: eur(amount), category, date: day(offset), recordedById: u.yanis, ...extra },
    });

  for (const [i, k] of ["camille", "yanis", "lea", "thomas", "ines", "lucas", "sarah"].entries()) {
    const t = await tx(
      `Membership fee ${year} — ${people.find((p) => p.key === k)!.name}`,
      "INCOME",
      15,
      "MEMBERSHIP",
      -100 + i * 3,
      { paymentMethod: i % 2 ? "CASH" : "TRANSFER" },
    );
    await db.membership.create({
      data: {
        userId: u[k],
        year,
        amountCents: eur(15),
        paidAt: day(-100 + i * 3),
        method: i % 2 ? "CASH" : "TRANSFER",
        transactionId: t.id,
      },
    });
  }
  await tx("Bank account opening fees", "EXPENSE", 12, "BANK", -95, { paymentMethod: "CARD" });
  await tx("Liability insurance (annual)", "EXPENSE", 180, "INSURANCE", -92, {
    paymentMethod: "TRANSFER",
    reference: "POL-2026-118",
  });
  await tx("Donation from alumni association", "INCOME", 400, "DONATION", -85, { paymentMethod: "TRANSFER" });
  await tx("Flyers printing — welcome week", "EXPENSE", 86.4, "COMMUNICATION", -72, {
    projectId: project.welcome,
    poleId: pole.events,
    paymentMethod: "CARD",
    reference: "INV-3381",
  });
  await tx("Coffee & snacks — welcome stand", "EXPENSE", 42.9, "FOOD", -67, {
    projectId: project.welcome,
    paymentMethod: "CASH",
  });
  await tx("Compost bins (x4)", "EXPENSE", 260, "SUPPLIES", -31, {
    projectId: project.compost,
    poleId: pole.green,
    paymentMethod: "CARD",
  });
  await tx("Signage for compost area", "EXPENSE", 58, "SUPPLIES", -13, {
    projectId: project.compost,
    paymentMethod: "CARD",
  });
  await tx("City sustainability grant", "INCOME", 800, "GRANT", -40, {
    paymentMethod: "TRANSFER",
    reference: "Grant #2026-44",
  });
  await tx("Website domain & hosting", "EXPENSE", 48, "SOFTWARE", -18, {
    projectId: project.web,
    poleId: pole.com,
    paymentMethod: "CARD",
  });
  await tx("Festival venue deposit", "EXPENSE", 350, "EVENT", -20, {
    projectId: project.festival,
    poleId: pole.events,
    paymentMethod: "TRANSFER",
  });
  await tx("Sponsorship — Bio Market Lyon", "INCOME", 500, "SPONSORSHIP", -8, {
    projectId: project.festival,
    poleId: pole.partners,
    paymentMethod: "TRANSFER",
  });
  await tx("Poster printing — festival", "EXPENSE", 124.5, "COMMUNICATION", -3, {
    projectId: project.festival,
    paymentMethod: "CARD",
  });

  // ─── Documents (small demo files) ─────────────────────────────────────────
  const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "./data/uploads");
  await mkdir(uploadDir, { recursive: true });
  const files = [
    {
      title: "Statutes (signed)",
      category: "STATUTES",
      fileName: "statutes.md",
      content:
        "# Statutes of Green Campus Collective\n\nArticle 1 — Name\nAn association governed by the French law of 1 July 1901 is founded, named Green Campus Collective.\n\nArticle 2 — Purpose\nPromote sustainable practices on campus…\n\n(Demo document)\n",
    },
    {
      title: "Minutes — constitutive general assembly",
      category: "MINUTES",
      fileName: "minutes-constitutive-ga.md",
      content:
        "# Minutes of the constitutive general assembly\n\nPresent: 9 founding members.\nThe statutes were adopted unanimously and the board was elected.\n\n(Demo document)\n",
    },
  ];
  for (const f of files) {
    const storedName = `demo-${f.fileName}`;
    await writeFile(path.join(uploadDir, storedName), f.content);
    await db.document.create({
      data: {
        title: f.title,
        category: f.category,
        fileName: f.fileName,
        storedName,
        mimeType: "text/markdown",
        sizeBytes: Buffer.byteLength(f.content),
        uploadedById: u.lea,
      },
    });
  }
  await db.document.createMany({
    data: [
      {
        title: "Brand guidelines (Figma)",
        category: "COMMUNICATION",
        url: "https://www.figma.com/",
        poleId: pole.com,
        uploadedById: u.lucas,
      },
      {
        title: "Festival budget sheet",
        category: "FINANCE",
        url: "https://docs.google.com/spreadsheets/",
        projectId: project.festival,
        uploadedById: u.yanis,
      },
      {
        title: "Volunteer handbook",
        category: "GUIDE",
        url: "https://example.org/volunteer-handbook",
        uploadedById: u.camille,
      },
    ],
  });

  // ─── Announcements ────────────────────────────────────────────────────────
  await db.announcement.createMany({
    data: [
      {
        title: "Festival: we need volunteers! 🌱",
        body: "The Spring Climate Festival needs 20 volunteers. Tell Sarah if you can help for a few hours.",
        pinned: true,
        authorId: u.ines,
        createdAt: ago(2),
      },
      {
        title: "Welcome to Agora",
        body: "Our association now has a shared workspace. Check your tasks and RSVP to the next board meeting!",
        authorId: u.camille,
        createdAt: ago(6),
      },
    ],
  });

  // ─── Activity ─────────────────────────────────────────────────────────────
  await db.activity.createMany({
    data: [
      {
        actorId: u.camille,
        action: "created",
        entityType: "workspace",
        entityLabel: "Green Campus Collective",
        createdAt: ago(10),
      },
      {
        actorId: u.sarah,
        action: "posted",
        entityType: "update",
        entityId: project.compost,
        entityLabel: "Campus composting program",
        createdAt: ago(4),
      },
      {
        actorId: u.lucas,
        action: "posted",
        entityType: "update",
        entityId: project.web,
        entityLabel: "Website & social media launch",
        createdAt: ago(3),
      },
      {
        actorId: u.yanis,
        action: "created",
        entityType: "transaction",
        entityLabel: "Poster printing — festival",
        createdAt: ago(3),
      },
      {
        actorId: u.thomas,
        action: "commented",
        entityType: "task",
        entityId: taskIds[1],
        entityLabel: "Draft the festival program",
        createdAt: ago(2),
      },
      {
        actorId: u.ines,
        action: "posted",
        entityType: "announcement",
        entityLabel: "Festival: we need volunteers! 🌱",
        createdAt: ago(2),
      },
      {
        actorId: u.ines,
        action: "posted",
        entityType: "update",
        entityId: project.festival,
        entityLabel: "Spring Climate Festival",
        createdAt: ago(1),
      },
      {
        actorId: u.lucas,
        action: "commented",
        entityType: "task",
        entityId: taskIds[3],
        entityLabel: "Design the festival poster",
        createdAt: ago(1),
      },
      {
        actorId: u.ines,
        action: "commented",
        entityType: "task",
        entityId: taskIds[3],
        entityLabel: "Design the festival poster",
        createdAt: ago(0.5),
      },
    ],
  });

  console.log("✔ Demo data loaded.");
  console.log(`  Sign in with camille@greencampus.example / ${PASSWORD} (administrator)`);
  console.log(`  Other accounts: yanis@, lea@, thomas@, ines@, lucas@, sarah@greencampus.example (same password)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
