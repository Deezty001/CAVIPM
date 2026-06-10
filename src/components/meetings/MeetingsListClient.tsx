"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, CalendarDays, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MEETING_TYPE_LABELS, PROJECT_TYPE_LABELS } from "@/lib/utils";
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
    <div className="max-w-screen-xl mx-auto px-6 py-6">
      <Link
        href={`/projects/${project.id}`}
        className="inline-flex items-center gap-1.5 text-sm mb-5 transition-colors hover:opacity-70"
        style={{ color: "var(--text-muted)" }}
      >
        <ChevronLeft className="w-4 h-4" />
        {project.name}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}
          >
            Meetings
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {meetings.length} record{meetings.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="primary" onClick={() => setNewMeetingOpen(true)}>
          <Plus className="w-4 h-4" />
          New Meeting
        </Button>
      </div>

      {meetings.length === 0 ? (
        <div
          className="text-center py-16 rounded-xl border"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <CalendarDays
            className="w-10 h-10 mx-auto mb-3"
            style={{ color: "var(--text-muted)" }}
          />
          <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
            No meeting records yet
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Create your first meeting minutes document
          </p>
          <Button variant="primary" size="sm" onClick={() => setNewMeetingOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            New Meeting
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {meetings.map((meeting) => (
            <Link
              key={meeting.id}
              href={`/projects/${project.id}/meetings/${meeting.id}`}
              className="flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-sm hover:-translate-y-px"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "var(--accent-light)" }}
                >
                  <CalendarDays className="w-5 h-5" style={{ color: "var(--accent)" }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {MEETING_TYPE_LABELS[meeting.type] ?? meeting.type}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full border"
                      style={{
                        background: "var(--bg-muted)",
                        borderColor: "var(--border)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {meeting.attendees.length} attendees
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-3 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatAUDate(meeting.date)}{" "}
                      {meeting.date.toLocaleTimeString("en-AU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {meeting.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {meeting.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
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
