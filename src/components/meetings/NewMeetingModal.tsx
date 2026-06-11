"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2, UserPlus, Sparkles } from "lucide-react";
import { createMeeting } from "@/actions/meetings";
import { MEETING_TYPE_LABELS, generateInitials } from "@/lib/utils";

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

  // Remove attendee
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
    <Modal open={open} onClose={onClose} title="New Meeting Minutes" size="xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* Basic info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            placeholder="e.g. Site office, Microsoft Teams"
          />
        </div>
        
        {/* Date / Time Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
            placeholder="e.g. Adam Karim"
          />
        </div>

        {/* Attendees Directory Section */}
        <div className="border-t border-slate-100 pt-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Attendees
              </label>
              <p className="text-xs text-slate-400">Add attendees from directory or manually</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold mr-1">Quick Add:</span>
              <div className="flex flex-wrap gap-1.5 max-w-xs md:max-w-md">
                {contacts.slice(0, 5).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => addAttendeeFromContact(c)}
                    title={c.name}
                    className="w-7 h-7 rounded-xl text-xs font-bold flex items-center justify-center border transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 cursor-pointer"
                    style={{
                      background: attendees.find((a) => a.name === c.name) ? "var(--bg-hover)" : "white",
                      color: attendees.find((a) => a.name === c.name) ? "var(--text-disabled)" : "var(--text-secondary)",
                      borderColor: attendees.find((a) => a.name === c.name) ? "transparent" : "var(--border)",
                      opacity: attendees.find((a) => a.name === c.name) ? 0.5 : 1,
                    }}
                  >
                    {c.initials}
                  </button>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addBlankAttendee}
                className="gap-1 ml-2 border border-slate-200 bg-white"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Blank
              </Button>
            </div>
          </div>

          {/* Attendees list editor */}
          {attendees.length > 0 && (
            <div className="rounded-2xl border border-slate-100 p-2.5 bg-slate-50/50 space-y-3">
              {attendees.map((a, i) => (
                <div 
                  key={i} 
                  className="grid grid-cols-1 md:grid-cols-[2fr_80px_2.2fr_2.2fr_auto] gap-3 px-4 py-4 md:py-2 md:px-3 items-center bg-white md:bg-transparent border border-slate-100 md:border-0 rounded-xl relative shadow-sm md:shadow-none"
                >
                  <input
                    value={a.name}
                    onChange={(e) => updateAttendee(i, "name", e.target.value)}
                    placeholder="Full name"
                    className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] outline-none transition-all duration-200 w-full"
                  />
                  <input
                    value={a.initials}
                    onChange={(e) =>
                      updateAttendee(i, "initials", e.target.value.toUpperCase())
                    }
                    placeholder="Init."
                    maxLength={3}
                    className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] outline-none transition-all duration-200 text-center w-full"
                  />
                  <input
                    value={a.title}
                    onChange={(e) => updateAttendee(i, "title", e.target.value)}
                    placeholder="Title / role (e.g. Planner)"
                    className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] outline-none transition-all duration-200 w-full"
                  />
                  <input
                    value={a.organisation}
                    onChange={(e) => updateAttendee(i, "organisation", e.target.value)}
                    placeholder="Company name"
                    className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] outline-none transition-all duration-200 w-full"
                  />
                  <button
                    type="button"
                    onClick={() => removeAttendee(i)}
                    className="text-red-400 hover:text-red-600 transition-colors p-1.5 md:p-1 hover:bg-red-50 rounded-lg absolute top-2 right-2 md:relative md:top-auto md:right-auto cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agenda Section */}
        <div className="border-t border-slate-100 pt-5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
            Minutes & Agenda Items
          </label>
          
          <div className="flex flex-col gap-4">
            {agenda.map((section, si) => (
              <div
                key={si}
                className="rounded-2xl border border-slate-250 bg-slate-50/20 overflow-hidden shadow-sm"
              >
                {/* Section Header Row */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                  <span className="text-xs font-bold w-8 shrink-0 text-blue-600 font-display">
                    {section.number}
                  </span>
                  <input
                    value={section.title}
                    onChange={(e) => updateAgendaTitle(si, e.target.value)}
                    placeholder="Section / Subject Title (e.g. Design issues)"
                    className="flex-1 text-sm font-bold bg-transparent border-0 outline-none text-slate-800 font-display focus:text-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => removeSection(si)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg p-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Sub items list */}
                <div className="divide-y divide-slate-100 p-2 sm:p-3 space-y-3 sm:space-y-0 bg-white">
                  {section.subItems.map((sub, subi) => (
                    <div 
                      key={subi} 
                      className="grid grid-cols-1 md:grid-cols-[40px_2fr_1.5fr_100px_auto] gap-3 p-4 md:p-2 items-start bg-slate-50/50 md:bg-transparent border border-slate-100 md:border-0 rounded-xl relative"
                    >
                      <span className="text-xs font-bold text-slate-400 pt-2 tabular-nums">
                        {sub.number}
                      </span>
                      <textarea
                        value={sub.description}
                        onChange={(e) =>
                          updateSubItem(si, subi, "description", e.target.value)
                        }
                        placeholder="Discussion / minutes description"
                        rows={2}
                        className="text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] outline-none resize-none transition-all duration-200 leading-relaxed w-full"
                      />
                      <input
                        value={sub.action}
                        onChange={(e) => updateSubItem(si, subi, "action", e.target.value)}
                        placeholder="Action item details"
                        className="text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] outline-none transition-all duration-200 w-full"
                      />
                      <select
                        value={sub.owner}
                        onChange={(e) => updateSubItem(si, subi, "owner", e.target.value)}
                        className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] outline-none transition-all duration-200 w-full cursor-pointer h-9"
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
                        className="text-red-400 hover:text-red-600 transition-colors p-1.5 md:p-1 hover:bg-red-50 rounded-lg absolute top-2 right-2 md:relative md:top-auto md:right-auto cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="px-4 py-2.5 bg-slate-50/30 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => addSubItem(si)}
                    className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    Add Minute Item
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addAgendaSection}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors mt-1 cursor-pointer self-start"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Add Agenda Section
            </button>
          </div>
        </div>

        {/* Next meeting date */}
        <div className="border-t border-slate-100 pt-5">
          <Input
            label="Next meeting date (optional)"
            type="date"
            value={nextMeeting}
            onChange={(e) => setNextMeeting(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
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
