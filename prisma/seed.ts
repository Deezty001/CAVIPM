import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PHASE_NAMES } from "../src/lib/utils";
import { addBusinessDays } from "../src/lib/dates";
import { DEFAULT_TEMPLATE } from "../src/lib/template";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding demo project…");

  const project = await db.project.create({
    data: {
      name: "220 Moss Vale Rd",
      address: "220 Moss Vale Road",
      suburb: "Bowral",
      type: "RESIDENTIAL_SUBDIVISION",
      lotCount: 12,
      status: "ACTIVE",
      phases: {
        create: PHASE_NAMES.map((name, i) => ({ name, order: i })),
      },
      contacts: {
        create: [
          {
            name: "Adam Karim",
            initials: "AK",
            title: "Project Manager",
            organisation: "Cavi Property",
            isInternal: true,
          },
          {
            name: "Jane Smith",
            initials: "JS",
            title: "Town Planner",
            organisation: "Smith Planning Co",
            email: "jane@smithplanning.com.au",
          },
          {
            name: "Mike Chen",
            initials: "MC",
            title: "Civil Engineer",
            organisation: "Chen Engineering",
            email: "mike@cheneng.com.au",
            phone: "0400 000 001",
          },
        ],
      },
    },
    include: { phases: true },
  });

  const phaseMap = project.phases.reduce<Record<number, string>>((acc, p) => {
    acc[p.order] = p.id;
    return acc;
  }, {});

  const tasksByPhase = DEFAULT_TEMPLATE.reduce<Record<number, typeof DEFAULT_TEMPLATE>>(
    (acc, t) => {
      if (!acc[t.phase]) acc[t.phase] = [];
      acc[t.phase].push(t);
      return acc;
    },
    {}
  );

  for (const [phaseIdx, tasks] of Object.entries(tasksByPhase)) {
    const phaseId = phaseMap[Number(phaseIdx)];
    if (!phaseId) continue;
    let cursor = new Date();
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      const start = new Date(cursor);
      const due = addBusinessDays(start, t.duration);
      const status =
        i < 2 ? "DONE" : i === 2 ? "IN_PROGRESS" : "TODO";
      await db.task.create({
        data: {
          name: t.name,
          description: t.description,
          assigneeText: t.assigneeRole,
          duration: t.duration,
          startDate: start,
          dueDate: due,
          status,
          phaseId,
          order: i,
        },
      });
      cursor = addBusinessDays(due, 1);
    }
  }

  console.log("Done — project created:", project.id);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
