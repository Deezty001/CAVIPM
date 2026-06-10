"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Building2, Mail, Phone } from "lucide-react";
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-base font-semibold"
          style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}
        >
          Project Team & Contacts
        </h2>
        <Button variant="primary" size="sm" onClick={openNew}>
          <Plus className="w-3.5 h-3.5" />
          Add Contact
        </Button>
      </div>

      {contacts.length === 0 ? (
        <div
          className="text-center py-12 rounded-xl border"
          style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No contacts yet — add your project team and consultants
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {internal.length > 0 && (
            <ContactGroup
              title="Cavi Property Team"
              contacts={internal}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}
          {external.length > 0 && (
            <ContactGroup
              title="Consultants & External"
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-2 gap-3">
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
          <div className="flex justify-end gap-2 pt-2">
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
  contacts,
  onEdit,
  onDelete,
}: {
  title: string;
  contacts: Contact[];
  onEdit: (c: Contact) => void;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <div>
      <h3
        className="text-xs font-semibold uppercase tracking-wider mb-3"
        style={{ color: "var(--text-muted)" }}
      >
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {contacts.map((c) => (
          <div
            key={c.id}
            className="flex items-start gap-3 p-3 rounded-xl border group transition-colors hover:bg-gray-50/50"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
            }}
          >
            <Avatar initials={c.initials} size="md" title={c.name} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {c.name}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => onEdit(c)} aria-label="Edit">
                    <Pencil className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                  </button>
                  <button onClick={() => onDelete(c.id, c.name)} aria-label="Remove">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
              {c.title && (
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                  {c.title}
                </p>
              )}
              {c.organisation && (
                <p
                  className="text-xs flex items-center gap-1 truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Building2 className="w-2.5 h-2.5 shrink-0" />
                  {c.organisation}
                </p>
              )}
              <div className="flex gap-2 mt-1">
                {c.email && (
                  <a
                    href={`mailto:${c.email}`}
                    className="text-xs hover:opacity-70 transition-opacity"
                    style={{ color: "var(--accent)" }}
                    title={c.email}
                  >
                    <Mail className="w-3 h-3" />
                  </a>
                )}
                {c.phone && (
                  <a
                    href={`tel:${c.phone}`}
                    className="text-xs hover:opacity-70 transition-opacity"
                    style={{ color: "var(--accent)" }}
                    title={c.phone}
                  >
                    <Phone className="w-3 h-3" />
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
