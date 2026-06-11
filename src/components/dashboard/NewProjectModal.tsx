"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { createProject } from "@/actions/projects";
import { Sparkles } from "lucide-react";

const TYPE_OPTIONS = [
  { value: "RESIDENTIAL_SUBDIVISION", label: "Residential Subdivision" },
  { value: "TOWNHOUSE_DEVELOPMENT", label: "Townhouse Development" },
  { value: "MIXED_USE", label: "Mixed Use" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "RENOVATION", label: "Renovation" },
];

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewProjectModal({ open, onClose }: NewProjectModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [useTemplate, setUseTemplate] = useState(true);
  const [form, setForm] = useState({
    name: "",
    address: "",
    suburb: "",
    type: "RESIDENTIAL_SUBDIVISION",
    lotCount: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Project name is required";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    startTransition(async () => {
      const project = await createProject({
        name: form.name.trim(),
        address: form.address.trim(),
        suburb: form.suburb.trim(),
        type: form.type,
        lotCount: form.lotCount ? parseInt(form.lotCount) : undefined,
        useTemplate,
      });
      onClose();
      router.push(`/projects/${project.id}`);
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="New Project" size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Project name"
          placeholder="e.g. 220 Moss Vale Rd"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Address"
            placeholder="Street address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <Input
            label="Suburb"
            placeholder="e.g. Bowral"
            value={form.suburb}
            onChange={(e) => setForm({ ...form, suburb: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Development type"
            options={TYPE_OPTIONS}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
          <Input
            label="Lot count"
            type="number"
            placeholder="e.g. 12"
            min={1}
            value={form.lotCount}
            onChange={(e) => setForm({ ...form, lotCount: e.target.value })}
          />
        </div>

        {/* Template toggle */}
        <label
          className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-all duration-200 ${
            useTemplate 
              ? "border-blue-200 bg-blue-50/50 shadow-sm shadow-blue-50" 
              : "border-slate-200 bg-slate-50/20 hover:border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <input
            type="checkbox"
            checked={useTemplate}
            onChange={(e) => setUseTemplate(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 accent-blue-600 cursor-pointer"
          />
          <div className="cursor-pointer select-none">
            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              Pre-fill with standard NSW subdivision tasks
            </div>
            <p className="text-xs mt-1 text-slate-500 leading-relaxed">
              Adds ~40 tasks across all 6 phases based on a typical residential subdivision. You can edit or delete any of them.
            </p>
          </div>
        </label>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create Project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
