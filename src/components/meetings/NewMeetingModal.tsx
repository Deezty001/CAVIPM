"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { createMeeting } from "@/actions/meetings";
import { MEETING_TYPE_LABELS } from "@/lib/utils";
import { generateInitials } from "@/lib/utils";

type Contact = {
  id: string;
  name: string;
  initials: string;
  title: string | null;
  organisation: string | null;
};

type Attendee = { name: string; initials: string; title: string; organisation: string };
type SubItem = { number: string; description: string; action: string; owner: string };
type AgendaItem = { number: string; title: string; subItems: SubItem[] };

interface NewMeetingModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  contacts: Contact[];
}

const MEETING_TYPE_OPTIONS = Object.entries(MEETING_TYPE_LABELS).map(([v, l]) => ({
  value: v,
  label: l,
}));

const defaultAgendaItems: AgendaItem[] = [
  {
    number: "1.0",
    title: "Introduction & Current Status",
    subItems: [{ number: "1.1", description: "", action: "", owner: "" }],
  },
  {
    number: "2.0",
    title: "Programme",
    subItems: [{ number: "2.1", description: "", action: "", owner: "" }],
  },
  {
    number: "3.0",
    title: "Next Steps",
    subItems: [{ number: "3.1", description: "", action: "", owner: "" }],
  },
];

export function NewMeetingModal({
  open,
  onClose,
  projectId,
  contacts,
}: NewMeetingModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState("PROGRESS_MEETING");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [nextMeeting, setNextMeeting] = useState("");
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [agenda, setAgenda] = useState<AgendaItem[]>(defaultAgendaItems);

  function addAttendeeFromContact(c: Contact) {
    if (attendees.find((a) => a.name === c.name)) return;
    setAttendees((prev) => [
      ...prev,
      {
        name: c.name,
        initials: c.initials,
        title: c.title ?? "",
        organisation: c.organisation ?? "",
      },
    ]);
  }

  function addBlankAttendee() {
    setAttendees((prev) => [
      ...prev,
      { name: "", initials: "", title: "", organisation: "" },
    ]);
  }

  function removeAttendee(i: number) {
    setAttendees((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateAttendee(i: number, field: keyof Attendee, val: string) {
    setAttendees((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: val };
      if (field === "name" && !next[i].initials) {
        next[i].initials = generateInitials(val);
      }
      return next;
    });
  }

  function addAgendaSection() {
    const next = agenda.length + 1;
    setAgenda((prev) => [
      ...prev,
      {
        number: `${next}.0`,
        title: "",
        subItems: [{ number: `${next}.1`, description: "", action: "", owner: "" }],
      },
    ]);
  }

  function updateAgendaTitle(i: number, title: string) {
    setAgenda((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], title };
      return next;
    });
  }

  function addSubItem(sectionIdx: number) {
    setAgenda((prev) => {
      const next = [...prev];
      const section = next[sectionIdx];
      const subNum = section.subItems.length + 1;
      section.subItems = [
        ...section.subItems,
        {
          number: `${sectionIdx + 1}.${subNum}`,
          description: "",
          action: "",
          owner: "",
        },
      ];
      return next;
    });
  }

  function updateSubItem(
    sectionIdx: number,
    subIdx: number,
    field: keyof SubItem,
    val: string
  ) {
    setAgenda((prev) => {
      const next = [...prev];
      const sub = [...next[sectionIdx].subItems];
      sub[subIdx] = { ...sub[subIdx], [field]: val };
      next[sectionIdx].subItems = sub;
      return next;
    });
  }

  function removeSubItem(sectionIdx: number, subIdx: number) {
    setAgenda((prev) => {
      const next = [...prev];
      next[sectionIdx].subItems = next[sectionIdx].subItems.filter(
        (_, i) => i !== subIdx
      );
      return next;
    });
  }

  function removeSection(i: number) {
    setAgenda((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;

    const [year, month, day] = date.split("-").map(Number);
    const [h, m] = time.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const meetingDate = new Date(year, month - 1, day, h, m);
    const meetingEndTime = new Date(year, month - 1, day, eh, em);
    const nextMeetingDate = nextMeeting
      ? new Date(nextMeeting)
      : undefined;

    startTransition(async () => {
      const meeting = await createMeeting({
        projectId,
        type,
        date: meetingDate,
        endTime: meetingEndTime,
        location: location.trim() || undefined,
        preparedBy: preparedBy.trim() || undefined,
        nextMeeting: nextMeetingDate,
        attendees: attendees.filter((a) => a.name.trim()),
        agendaItems: agenda
          .filter((a) => a.title.trim() || a.subItems.some((s) => s.description.trim()))
          .map((item, i) => ({
            number: item.number,
            title: item.title,
            order: i,
            subItems: item.subItems
              .filter((s) => s.description.trim())
              .map((s, j) => ({
                number: s.number,
                description: s.description,
                action: s.action || undefined,
                owner: s.owner || undefined,
                order: j,
              })),
          })),
      });
      onClose();
      router.push(`/projects/${projectId}/meetings/${meeting.id}`);
    });
  }

  const attendeeInitials = attendees.map((a) => a.initials).filter(Boolean);

  return (
    <Modal open={open} onClose={onClose} title="New Meeting" size="xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Basic info */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Meeting type"
            options={MEETING_TYPE_OPTIONS}
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
          <Input
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Site office, Teams"
          />
        </div>
        <div className="grid grid-cols-4 gap-3">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            label="Start time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <Input
            label="End time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
          <Input
            label="Prepared by"
            value={preparedBy}
            onChange={(e) => setPreparedBy(e.target.value)}
            placeholder="Name"
          />
        </div>

        {/* Attendees */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Attendees
            </label>
            <div className="flex gap-1.5">
              {contacts.slice(0, 8).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => addAttendeeFromContact(c)}
                  title={c.name}
                  className="w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center transition-opacity hover:opacity-70"
                  style={{
                    background: "var(--accent-light)",
                    color: "var(--accent)",
                    opacity: attendees.find((a) => a.name === c.name) ? 0.4 : 1,
                  }}
                >
                  {c.initials}
                </button>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addBlankAttendee}
                className="gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add
              </Button>
            </div>
          </div>
          {attendees.length > 0 && (
            <div
              className="rounded-lg border divide-y"
              style={{ borderColor: "var(--border)" }}
            >
              {attendees.map((a, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_1fr_1fr_auto] gap-2 px-3 py-2 items-center">
                  <input
                    value={a.name}
                    onChange={(e) => updateAttendee(i, "name", e.target.value)}
                    placeholder="Full name"
                    className="text-sm px-2 py-1 rounded border"
                    style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
                  />
                  <input
                    value={a.initials}
                    onChange={(e) =>
                      updateAttendee(i, "initials", e.target.value.toUpperCase())
                    }
                    placeholder="Init."
                    maxLength={3}
                    className="text-sm px-2 py-1 rounded border text-center"
                    style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
                  />
                  <input
                    value={a.title}
                    onChange={(e) => updateAttendee(i, "title", e.target.value)}
                    placeholder="Title"
                    className="text-sm px-2 py-1 rounded border"
                    style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
                  />
                  <input
                    value={a.organisation}
                    onChange={(e) => updateAttendee(i, "organisation", e.target.value)}
                    placeholder="Organisation"
                    className="text-sm px-2 py-1 rounded border"
                    style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeAttendee(i)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agenda */}
        <div>
          <label
            className="text-sm font-medium mb-2 block"
            style={{ color: "var(--text-secondary)" }}
          >
            Agenda
          </label>
          <div className="flex flex-col gap-3">
            {agenda.map((section, si) => (
              <div
                key={si}
                className="rounded-lg border"
                style={{ borderColor: "var(--border)", background: "var(--bg-muted)" }}
              >
                {/* Section header */}
                <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
                  <span
                    className="text-xs font-bold w-8 shrink-0"
                    style={{ color: "var(--accent)" }}
                  >
                    {section.number}
                  </span>
                  <input
                    value={section.title}
                    onChange={(e) => updateAgendaTitle(si, e.target.value)}
                    placeholder="Section title"
                    className="flex-1 text-sm font-medium bg-transparent border-0 outline-none"
                    style={{ color: "var(--text-primary)" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeSection(si)}
                    className="text-red-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sub items */}
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {section.subItems.map((sub, subi) => (
                    <div key={subi} className="grid grid-cols-[40px_1fr_1fr_80px_auto] gap-2 px-3 py-2 items-start">
                      <span
                        className="text-xs pt-1.5 shrink-0"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {sub.number}
                      </span>
                      <textarea
                        value={sub.description}
                        onChange={(e) =>
                          updateSubItem(si, subi, "description", e.target.value)
                        }
                        placeholder="Description / discussion"
                        rows={2}
                        className="text-sm px-2 py-1 rounded border resize-none"
                        style={{
                          borderColor: "var(--border)",
                          background: "var(--bg-surface)",
                          color: "var(--text-primary)",
                        }}
                      />
                      <input
                        value={sub.action}
                        onChange={(e) => updateSubItem(si, subi, "action", e.target.value)}
                        placeholder="Action (or 'Note')"
                        className="text-sm px-2 py-1 rounded border"
                        style={{
                          borderColor: "var(--border)",
                          background: "var(--bg-surface)",
                          color: "var(--text-primary)",
                        }}
                      />
                      <select
                        value={sub.owner}
                        onChange={(e) => updateSubItem(si, subi, "owner", e.target.value)}
                        className="text-sm px-2 py-1 rounded border"
                        style={{
                          borderColor: "var(--border)",
                          background: "var(--bg-surface)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <option value="">Owner</option>
                        {attendeeInitials.map((init) => (
                          <option key={init} value={init}>
                            {init}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeSubItem(si, subi)}
                        className="text-red-300 hover:text-red-500 transition-colors mt-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => addSubItem(si)}
                    className="text-xs flex items-center gap-1 transition-opacity hover:opacity-70"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Plus className="w-3 h-3" />
                    Add item
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addAgendaSection}
              className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70 mt-1"
              style={{ color: "var(--accent)" }}
            >
              <Plus className="w-4 h-4" />
              Add section
            </button>
          </div>
        </div>

        {/* Next meeting */}
        <Input
          label="Next meeting date (optional)"
          type="date"
          value={nextMeeting}
          onChange={(e) => setNextMeeting(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isPending || !date}>
            {isPending ? "Saving…" : "Create Minutes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
