import "dotenv/config";
import { db } from "./index";
import { todos } from "./schema";
import { isNull } from "drizzle-orm";

async function migrate() {
  // Setze status auf 'todo' für alle Tasks, die noch kein Status-Feld haben (NULL oder undefined)
  const result = await db.update(todos)
    .set({ status: "todo" })
    .where(isNull(todos.status))
    .run();
  console.log(`Migration abgeschlossen. Betroffene Zeilen:`, result);
}

migrate().then(() => process.exit(0));
