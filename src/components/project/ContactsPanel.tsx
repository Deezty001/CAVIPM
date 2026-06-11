"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Building2, Mail, Phone, ShieldCheck, UserCheck } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { createContact, updateContact, deleteContact } from "@/actions/contacts";
import { generateInitials } from "@/lib/utils";

type Contact = {
  id: string;
  name: string;
  initials: string;
  title: string | null;
  organisation: string | null;
  email: string | null;
  phone: string | null;
  isInternal: boolean;
};

interface ContactsPanelProps {
  contacts: Contact[];
  projectId: string;
}

interface ContactForm {
  name: string;
  initials: string;
  title: string;
  organisation: string;
  email: string;
  phone: string;
  isInternal: string;
}

const emptyForm: ContactForm = {
  name: "",
  initials: "",
  title: "",
  organisation: "",
  email: "",
  phone: "",
  isInternal: "false",
};

export function ContactsPanel({ contacts, projectId }: ContactsPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [isPending, startTransition] = useTransition();

  function openNew() {
    setEditingContact(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(c: Contact) {
    setEditingContact(c);
    setForm({
      name: c.name,
      initials: c.initials,
      title: c.title ?? "",
      organisation: c.organisation ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      isInternal: c.isInternal ? "true" : "false",
    });
    setModalOpen(true);
  }

  function handleNameChange(name: string) {
    setForm((f) => ({
      ...f,
      name,
      initials: f.initials || generateInitials(name),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      if (editingContact) {
        await updateContact(editingContact.id, projectId, {
          name: form.name.trim(),
          initials: form.initials.trim() || generateInitials(form.name),
          title: form.title.trim() || undefined,
          organisation: form.organisation.trim() || undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          isInternal: form.isInternal === "true",
        });
      } else {
        await createContact({
          name: form.name.trim(),
          initials: form.initials.trim() || generateInitials(form.name),
          title: form.title.trim() || undefined,
          organisation: form.organisation.trim() || undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          isInternal: form.isInternal === "true",
          projectId,
        });
      }
      setModalOpen(false);
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name} from this project?`)) return;
    startTransition(() => deleteContact(id, projectId));
  }

  const internal = contacts.filter((c) => c.isInternal);
  const external = contacts.filter((c) => !c.isInternal);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight font-display">
            Project Team & Consultants
          </h2>
          <p className="text-xs text-slate-500">Directory of everyone working on this subdivision</p>
        </div>
        <Button variant="primary" size="sm" onClick={openNew} className="gap-1.5 shadow-sm">
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add Contact
        </Button>
      </div>

      {contacts.length === 0 ? (
        <div className="surface-card py-16 text-center border border-slate-100 rounded-2xl">
          <p className="text-sm font-semibold text-slate-500">
            No contacts added to this project yet.
          </p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Add members of your internal team or external consultants.</p>
          <Button variant="primary" size="sm" onClick={openNew}>
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Add Contact
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {internal.length > 0 && (
            <ContactGroup
              title="Cavi Property Team"
              icon={<ShieldCheck className="w-4 h-4 text-blue-600" />}
              contacts={internal}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}
          {external.length > 0 && (
            <ContactGroup
              title="External Consultants & Contractors"
              icon={<UserCheck className="w-4 h-4 text-indigo-600" />}
              contacts={external}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingContact ? "Edit Contact" : "Add Contact"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full name"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              autoFocus
            />
            <Input
              label="Initials"
              value={form.initials}
              onChange={(e) => setForm({ ...form, initials: e.target.value.toUpperCase() })}
              maxLength={3}
              placeholder="e.g. JD"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Title / role"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Town Planner"
            />
            <Input
              label="Organisation"
              value={form.organisation}
              onChange={(e) => setForm({ ...form, organisation: e.target.value })}
              placeholder="e.g. Smith Planning"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <Select
            label="Type"
            value={form.isInternal}
            onChange={(e) => setForm({ ...form, isInternal: e.target.value })}
            options={[
              { value: "false", label: "External (consultant / contractor)" },
              { value: "true", label: "Internal (Cavi Property)" },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isPending || !form.name.trim()}>
              {isPending ? "Saving…" : editingContact ? "Save Changes" : "Add Contact"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ContactGroup({
  title,
  icon,
  contacts,
  onEdit,
  onDelete,
}: {
  title: string;
  icon: React.ReactNode;
  contacts: Contact[];
  onEdit: (c: Contact) => void;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        {icon}
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {title}
        </h3>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
          {contacts.length}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map((c) => (
          <div
            key={c.id}
            className="surface-card group flex items-start gap-4 p-4 border border-slate-100 hover:border-slate-200/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-2xl bg-white"
          >
            <Avatar initials={c.initials} size="md" title={c.name} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[14px] font-bold text-slate-800 truncate leading-snug">
                  {c.name}
                </span>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => onEdit(c)} className="text-slate-400 hover:text-slate-600 cursor-pointer" aria-label="Edit">
                    <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                  <button onClick={() => onDelete(c.id, c.name)} className="text-red-400 hover:text-red-600 cursor-pointer" aria-label="Remove">
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>
              
              {c.title && (
                <p className="text-[12px] font-semibold text-slate-500 truncate mt-0.5 leading-snug">
                  {c.title}
                </p>
              )}
              {c.organisation && (
                <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1 truncate mt-0.5 leading-snug">
                  <Building2 className="w-3 h-3 shrink-0" />
                  {c.organisation}
                </p>
              )}
              
              <div className="flex gap-2 mt-3.5">
                {c.email && (
                  <a
                    href={`mailto:${c.email}`}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50/30 transition-all"
                    title={c.email}
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                )}
                {c.phone && (
                  <a
                    href={`tel:${c.phone}`}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50/30 transition-all"
                    title={c.phone}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
