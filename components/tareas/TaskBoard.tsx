"use client";

import { useMemo, useState } from "react";
import {
  createTask,
  updateTask,
  setTaskStatus,
  deleteTask,
} from "@/lib/actions";
import { formatDate, toInputDate } from "@/lib/utils";
import {
  Modal,
  Field,
  FormError,
  SubmitButton,
  CancelButton,
  PrimaryButton,
  DangerButton,
  IconButton,
  Badge,
  EmptyState,
  PageHeader,
  inputClasses,
} from "@/components/ui";

type Status = "PENDIENTE" | "EN_CURSO" | "HECHA";
type Priority = "BAJA" | "MEDIA" | "ALTA";

type Task = {
  id: number;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  assignee: string | null;
  dueDate: Date | null;
};

const COLUMNS: { status: Status; label: string; tone: "amber" | "sky" | "green" }[] = [
  { status: "PENDIENTE", label: "Pendientes", tone: "amber" },
  { status: "EN_CURSO", label: "En curso", tone: "sky" },
  { status: "HECHA", label: "Hechas", tone: "green" },
];

const PRIORITY_TONE: Record<Priority, "red" | "amber" | "default"> = {
  ALTA: "red",
  MEDIA: "amber",
  BAJA: "default",
};

const PRIORITY_LABEL: Record<Priority, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

function isOverdue(t: Task): boolean {
  if (!t.dueDate || t.status === "HECHA") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(t.dueDate) < today;
}

export function TaskBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<Task | null>(null);

  const filtered = useMemo(
    () =>
      tasks.filter((t) => {
        const q = query.toLowerCase();
        return (
          !q ||
          t.title.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q) ||
          (t.assignee ?? "").toLowerCase().includes(q)
        );
      }),
    [tasks, query],
  );

  async function reload() {
    const { listTasks } = await import("@/lib/actions");
    setTasks((await listTasks()) as Task[]);
  }

  async function move(task: Task, dir: -1 | 1) {
    const order: Status[] = ["PENDIENTE", "EN_CURSO", "HECHA"];
    const next = order[order.indexOf(task.status) + dir];
    if (!next) return;
    setBusy(true);
    await setTaskStatus(task.id, next);
    setBusy(false);
    await reload();
  }

  return (
    <div>
      <PageHeader
        title="Tareas"
        description="Tablero del staff: qué hay que hacer, quién lo lleva y cuándo vence."
        action={
          <PrimaryButton
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            + Nueva tarea
          </PrimaryButton>
        }
      />

      <div className="mb-5">
        <input
          type="search"
          placeholder="Buscar tareas…"
          className={`${inputClasses} max-w-sm`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = filtered.filter((t) => t.status === col.status);
          return (
            <section
              key={col.status}
              className="block-border border border-night-600/60 bg-night-800/60 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg tracking-wide text-mist-50">
                  {col.label}
                </h2>
                <Badge tone={col.tone}>{items.length}</Badge>
              </div>
              <div className="space-y-3">
                {items.length === 0 && (
                  <p className="rounded-lg border border-dashed border-night-600 px-3 py-6 text-center text-xs text-mist-500">
                    Nada aquí
                  </p>
                )}
                {items.map((t) => (
                  <article
                    key={t.id}
                    className="rounded-xl border border-night-600/60 bg-night-900/80 p-3.5 transition hover:border-grape-600/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-mist-50">{t.title}</h3>
                      <Badge tone={PRIORITY_TONE[t.priority]}>
                        {PRIORITY_LABEL[t.priority]}
                      </Badge>
                    </div>
                    {t.description && (
                      <p className="mt-1.5 line-clamp-3 text-xs text-mist-400">
                        {t.description}
                      </p>
                    )}
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mist-500">
                      {t.assignee && <span>👤 {t.assignee}</span>}
                      {t.dueDate && (
                        <span
                          className={isOverdue(t) ? "font-semibold text-red-300" : ""}
                        >
                          📅 {formatDate(t.dueDate)}
                          {isOverdue(t) ? " · vencida" : ""}
                        </span>
                      )}
                    </div>
                    <div className="mt-2.5 flex items-center justify-between border-t border-night-600/40 pt-2">
                      <div className="flex gap-1">
                        {t.status !== "PENDIENTE" && (
                          <IconButton
                            onClick={() => void move(t, -1)}
                            label="Mover atrás"
                          >
                            ←
                          </IconButton>
                        )}
                        {t.status !== "HECHA" && (
                          <IconButton
                            onClick={() => void move(t, 1)}
                            label="Avanzar"
                          >
                            {t.status === "EN_CURSO" ? "✓ Hecha" : "→"}
                          </IconButton>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <IconButton
                          onClick={() => {
                            setEditing(t);
                            setShowForm(true);
                          }}
                          label="Editar"
                        >
                          ✎
                        </IconButton>
                        <IconButton
                          onClick={() => setDeleting(t)}
                          label="Eliminar"
                          danger
                        >
                          🗑
                        </IconButton>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {showForm && (
        <TaskForm
          task={editing}
          busy={busy}
          setBusy={setBusy}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={async () => {
            setShowForm(false);
            setEditing(null);
            await reload();
          }}
        />
      )}

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Eliminar tarea"
      >
        <p className="text-sm text-mist-400">
          ¿Eliminar <strong className="text-mist-200">“{deleting?.title}”</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <CancelButton onClick={() => setDeleting(null)} />
          <DangerButton
            onClick={async () => {
              if (!deleting) return;
              setBusy(true);
              await deleteTask(deleting.id);
              setDeleting(null);
              setBusy(false);
              await reload();
            }}
          >
            {busy ? "Eliminando…" : "Eliminar"}
          </DangerButton>
        </div>
      </Modal>
    </div>
  );
}

function TaskForm({
  task,
  busy,
  setBusy,
  onClose,
  onSaved,
}: {
  task: Task | null;
  busy: boolean;
  setBusy: (b: boolean) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<Status>(task?.status ?? "PENDIENTE");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "MEDIA");
  const [assignee, setAssignee] = useState(task?.assignee ?? "");
  const [dueDate, setDueDate] = useState(toInputDate(task?.dueDate));
  const [error, setError] = useState<string>();

  async function save() {
    setError(undefined);
    if (!title.trim()) return setError("El título es obligatorio.");
    setBusy(true);
    try {
      const input = {
        title,
        description,
        status,
        priority,
        assignee,
        dueDate: dueDate || undefined,
      };
      if (task) await updateTask(task.id, input);
      else await createTask(input);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={task ? "Editar tarea" : "Nueva tarea"} wide>
      <div className="space-y-4">
        <FormError error={error} />
        <Field label="Título" htmlFor="tk-title">
          <input
            id="tk-title"
            className={inputClasses}
            placeholder="p. ej. Revisar permisos del rango VIP"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field label="Descripción" htmlFor="tk-desc">
          <textarea
            id="tk-desc"
            rows={3}
            className={inputClasses}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Estado" htmlFor="tk-status">
            <select
              id="tk-status"
              className={inputClasses}
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
            >
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_CURSO">En curso</option>
              <option value="HECHA">Hecha</option>
            </select>
          </Field>
          <Field label="Prioridad" htmlFor="tk-prio">
            <select
              id="tk-prio"
              className={inputClasses}
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
            </select>
          </Field>
          <Field label="Responsable" htmlFor="tk-assignee">
            <input
              id="tk-assignee"
              className={inputClasses}
              placeholder="Nick del staff"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            />
          </Field>
          <Field label="Vence" htmlFor="tk-due">
            <input
              id="tk-due"
              type="date"
              className={inputClasses}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-3">
          <CancelButton onClick={onClose} />
          <SubmitButton pending={busy} onClick={save}>
            Guardar
          </SubmitButton>
        </div>
      </div>
    </Modal>
  );
}
