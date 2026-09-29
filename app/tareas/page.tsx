import { listTasks } from "@/lib/actions";
import { TaskBoard } from "@/components/tareas/TaskBoard";

export const dynamic = "force-dynamic";

export default async function TareasPage() {
  const tasks = await listTasks();
  return <TaskBoard initialTasks={tasks} />;
}
