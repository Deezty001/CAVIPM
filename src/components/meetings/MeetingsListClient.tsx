"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, CalendarDays, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MEETING_TYPE_LABELS } from "@/lib/utils";
import { formatAUDate } from "@/lib/dates";
import { NewMeetingModal } from "./NewMeetingModal";

type Project = NonNullable<Awaited<ReturnType<typeof import("@/actions/projects").getProject>>>;
type Meeting = Awaited<ReturnType<typeof import("@/actions/meetings").getMeetings>>[number];

export function MeetingsListClient({
  project,
  meetings,
}: {
  project: Project;
  meetings: Meeting[];
}) {
  const [newMeetingOpen, setNewMeetingOpen] = useState(false);

  return (
    <div className="app-page max-w-[1240px] px-4 py-8 md:px-8">
      {/* Breadcrumbs */}
      <Link
        href={`/projects/${project.id}`}
        className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider"
      >
        <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        {project.name}
      </Link>

      {/* Header Panel */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display sm:text-4xl">
            Meetings & Minutes
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            {meetings.length} record{meetings.length !== 1 ? "s" : ""} logged
          </p>
        </div>
        <Button variant="primary" onClick={() => setNewMeetingOpen(true)} className="gap-1.5 shadow-sm">
          <Plus className="w-4 h-4 stroke-[2.5]" />
          New Meeting
        </Button>
      </div>

      {/* Meetings List */}
      {meetings.length === 0 ? (
        <div className="surface-card py-20 text-center border border-slate-100 rounded-2xl">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 mb-4">
            <CalendarDays className="w-7 h-7" strokeWidth={1.5} />
          </div>
          <h2 className="text-base font-bold text-slate-800 font-display mb-1">
            No meeting records yet
          </h2>
          <p className="text-xs text-slate-500 max-w-[320px] mx-auto mb-6 leading-relaxed">
            Record minutes, attendees, agenda items, and track critical action items from your site and progress meetings.
          </p>
          <Button variant="primary" size="sm" onClick={() => setNewMeetingOpen(true)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            New Meeting
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {meetings.map((meeting) => (
            <Link
              key={meeting.id}
              href={`/projects/${project.id}/meetings/${meeting.id}`}
              className="surface-card flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-100 hover:border-slate-200/80 transition-all duration-300 hover:shadow-md hover:-translate-y-px rounded-2xl bg-white cursor-pointer gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
                  <CalendarDays className="h-5.5 w-5.5 text-blue-600" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-sm font-bold text-slate-800 font-display">
                      {MEETING_TYPE_LABELS[meeting.type] ?? meeting.type}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-100 bg-slate-50 text-slate-500 uppercase tracking-wider">
                      {meeting.attendees.length} attendees
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatAUDate(meeting.date)}{" "}
                      {meeting.date.toLocaleTimeString("en-AU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {meeting.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {meeting.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-[11px] font-bold text-slate-500 bg-slate-100/80 border border-slate-200/35 rounded-lg px-2.5 py-1 self-start sm:self-auto uppercase tracking-wider">
                {meeting.agendaItems.length} agenda items
              </div>
            </Link>
          ))}
        </div>
      )}

      <NewMeetingModal
        open={newMeetingOpen}
        onClose={() => setNewMeetingOpen(false)}
        projectId={project.id}
        contacts={project.contacts}
      />
    </div>
  );
}
