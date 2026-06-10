"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { updateProject, deleteProject } from "@/actions/projects";
import { PROJECT_TYPE_LABELS } from "@/lib/utils";

type Project = {
  id: string;
  name: string;
  address: string;
  suburb: string;
  type: string;
  lotCount: number | null;
  status: string;
};

interface ProjectSettingsModalProps {
  project: Project;
  open: boolean;
  onClose: () => void;
}

export function ProjectSettingsModal({
  project,
  open,
  onClose,
}: ProjectSettingsModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: project.name,
    address: project.address,
    suburb: project.suburb,
    type: project.type,
    lotCount: project.lotCount ? String(project.lotCount) : "",
    status: project.status,
  });

  const typeOptions = Object.entries(PROJECT_TYPE_LABELS).map(([v, l]) => ({
    value: v,
    label: l,
  }));

  const statusOptions = [
    { value: "ACTIVE", label: "Active" },
    { value: "ON_HOLD", label: "On Hold" },
    { value: "COMPLETE", label: "Complete" },
  ];

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await updateProject(project.id, {
        name: form.name,
        address: form.address,
        suburb: form.suburb,
        type: form.type,
        lotCount: form.lotCount ? parseInt(form.lotCount) : undefined,
        status: form.status,
      });
      onClose();
    });
  }

  function handleDelete() {
    if (
      !confirm(
        `Delete project "${project.name}"? This will permanently remove all tasks, phases, contacts, and meetings.`
      )
    )
      return;
    startTransition(async () => {
      await deleteProject(project.id);
      router.push("/");
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Project Settings" size="md">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Input
          label="Project name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <Input
            label="Suburb"
            value={form.suburb}
            onChange={(e) => setForm({ ...form, suburb: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Development type"
            options={typeOptions}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
          <Input
            label="Lot count"
            type="number"
            min={1}
            value={form.lotCount}
            onChange={(e) => setForm({ ...form, lotCount: e.target.value })}
          />
        </div>
        <Select
          label="Status"
          options={statusOptions}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        />

        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <Button variant="danger" type="button" size="sm" onClick={handleDelete}>
            Delete Project
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
