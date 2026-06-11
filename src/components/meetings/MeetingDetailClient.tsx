"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, Download, Clock, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { MEETING_TYPE_LABELS } from "@/lib/utils";
import { formatAUDate } from "@/lib/dates";

type Meeting = NonNullable<Awaited<ReturnType<typeof import("@/actions/meetings").getMeeting>>>;

export function MeetingDetailClient({ meeting }: { meeting: Meeting }) {
  const [isExporting, startExport] = useTransition();

  async function handleExport() {
    startExport(async () => {
      const { exportMeetingMinutes } = await import("@/lib/docx-export");
      const blob = await exportMeetingMinutes({
        ...meeting,
        project: meeting.project,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = meeting.date.toLocaleDateString("en-AU").replace(/\//g, "-");
      a.href = url;
      a.download = `${meeting.project.name} - ${MEETING_TYPE_LABELS[meeting.type] ?? meeting.type} - ${dateStr}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  const meetingTypeLabel = MEETING_TYPE_LABELS[meeting.type] ?? meeting.type;
  const timeStr = meeting.date.toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTimeStr = meeting.endTime
    ? meeting.endTime.toLocaleTimeString("en-AU", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  // Compile actions
  const allActions: { number: number; action: string; owner: string }[] = [];
  let actionIdx = 1;
  for (const item of meeting.agendaItems) {
    for (const sub of item.subItems) {
      if (sub.action && sub.action.toLowerCase() !== "note") {
        allActions.push({ number: actionIdx++, action: sub.action, owner: sub.owner ?? "" });
      }
    }
  }

  return (
    <div className="app-page max-w-[1120px]">
      {/* Breadcrumb */}
      <Link
        href={`/projects/${meeting.projectId}/meetings`}
        className="mb-5 inline-flex items-center gap-1.5 text-xs text-[#6b6b6b] transition-colors hover:text-[#111111]"
      >
        <ChevronLeft className="w-4 h-4" />
        Meetings
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1
            className="page-title mb-2"
          >
            {meetingTypeLabel}
          </h1>
          <div
            className="flex items-center gap-3 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatAUDate(meeting.date)} · {timeStr}{endTimeStr && ` – ${endTimeStr}`}
            </span>
            {meeting.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {meeting.location}
              </span>
            )}
            {meeting.preparedBy && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {meeting.preparedBy}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="primary"
          onClick={handleExport}
          disabled={isExporting}
          className="gap-2 shrink-0"
        >
          <Download className="w-4 h-4" />
          {isExporting ? "Exporting…" : "Export .docx"}
        </Button>
      </div>

      <div className="flex flex-col gap-5">
        {/* Info table */}
        <div
          className="surface-card overflow-hidden"
        >
          <table className="w-full text-sm">
            <tbody>
              <InfoRow label="Project" value={meeting.project.name} />
              <InfoRow label="Meeting type" value={meetingTypeLabel} />
              <InfoRow
                label="Date & time"
                value={`${formatAUDate(meeting.date)} · ${timeStr}${endTimeStr ? ` – ${endTimeStr}` : ""}`}
              />
              <InfoRow label="Location" value={meeting.location ?? "—"} />
              <InfoRow label="Prepared by" value={meeting.preparedBy ?? "—"} />
              <InfoRow
                label="Next meeting"
                value={
                  meeting.nextMeeting ? formatAUDate(meeting.nextMeeting) : "TBA"
                }
                last
              />
            </tbody>
          </table>
        </div>

        {/* Attendees */}
        {meeting.attendees.length > 0 && (
          <section>
            <h2
              className="section-title mb-3"
            >
              Attendees
            </h2>
            <div
              className="surface-card overflow-hidden"
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--bg-dark)" }}>
                    {["Name", "Initials", "Title", "Organisation"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-xs font-semibold text-white"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {meeting.attendees.map((a, i) => (
                    <tr
                      key={i}
                      className="border-t"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td className="px-4 py-2.5 flex items-center gap-2">
                        <Avatar initials={a.initials} size="xs" />
                        {a.name}
                      </td>
                      <td
                        className="px-4 py-2.5 font-mono text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {a.initials}
                      </td>
                      <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
                        {a.title ?? "—"}
                      </td>
                      <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
                        {a.organisation ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Minutes */}
        {meeting.agendaItems.length > 0 && (
          <section>
            <h2
              className="section-title mb-3"
            >
              Minutes
            </h2>
            <div
              className="surface-card overflow-hidden"
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--bg-dark)" }}>
                    {["Item", "Description", "Action", "Owner"].map((h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-2.5 text-left text-xs font-semibold text-white ${
                          i === 0 ? "w-16" : i === 3 ? "w-16" : ""
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {meeting.agendaItems.map((item) => (
                    <>
                      {/* Section header row */}
                      <tr
                        key={`section-${item.id}`}
                        style={{ background: "var(--accent-blue-light)", borderTop: "1px solid var(--divider)" }}
                      >
                        <td
                          colSpan={4}
                          className="px-4 py-2.5 font-semibold text-xs"
                          style={{ color: "var(--accent-blue-dark)" }}
                        >
                          {item.number} {item.title}
                        </td>
                      </tr>
                      {/* Sub items */}
                      {item.subItems.map((sub) => (
                        <tr
                          key={sub.id}
                          className="border-t"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <td
                            className="px-4 py-2.5 text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {sub.number}
                          </td>
                          <td
                            className="px-4 py-2.5"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {sub.description}
                          </td>
                          <td
                            className="px-4 py-2.5"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {sub.action ?? "—"}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {sub.owner && (
                              <Avatar initials={sub.owner} size="xs" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Actions arising */}
        {allActions.length > 0 && (
          <section>
            <h2
              className="section-title mb-3"
            >
              Actions Arising
            </h2>
            <div
              className="surface-card overflow-hidden"
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--bg-dark)" }}>
                    {["#", "Action", "Owner", "Date"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-xs font-semibold text-white"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allActions.map((a) => (
                    <tr
                      key={a.number}
                      className="border-t"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td
                        className="px-4 py-2.5 text-xs tabular-nums"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {a.number}
                      </td>
                      <td className="px-4 py-2.5">{a.action}</td>
                      <td className="px-4 py-2.5">
                        {a.owner && <Avatar initials={a.owner} size="xs" />}
                      </td>
                      <td className="px-4 py-2.5" style={{ color: "var(--text-muted)" }}>
                        —
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <tr
      className={last ? "" : "border-b"}
      style={{ borderColor: "var(--border)" }}
    >
      <td
        className="px-4 py-2.5 text-xs font-medium w-36"
        style={{ color: "var(--text-muted)", background: "var(--bg-muted)" }}
      >
        {label}
      </td>
      <td className="px-4 py-2.5 text-sm" style={{ color: "var(--text-primary)" }}>
        {value}
      </td>
    </tr>
  );
}
