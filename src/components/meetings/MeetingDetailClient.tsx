"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, Download, Clock, MapPin, User, Building, FileText, CalendarDays } from "lucide-react";
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
    <div className="app-page max-w-[1120px] px-4 py-8 md:px-8">
      {/* Breadcrumb */}
      <Link
        href={`/projects/${meeting.projectId}/meetings`}
        className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider"
      >
        <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        Meetings
      </Link>

      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display sm:text-4xl">
            {meetingTypeLabel}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 font-semibold mt-2">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              {formatAUDate(meeting.date)} · {timeStr}{endTimeStr && ` – ${endTimeStr}`}
            </span>
            {meeting.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                {meeting.location}
              </span>
            )}
            {meeting.preparedBy && (
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" />
                Prepared by: {meeting.preparedBy}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="primary"
          onClick={handleExport}
          disabled={isExporting}
          className="gap-2 shrink-0 shadow-md hover:shadow-lg active:scale-[0.98] self-start sm:self-auto"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          {isExporting ? "Exporting…" : "Export Word Doc"}
        </Button>
      </div>

      <div className="space-y-8">
        {/* Info Grid (Apple style metrics box) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <InfoCard label="Project" value={meeting.project.name} icon={<Building className="w-4 h-4" />} />
          <InfoCard label="Meeting Type" value={meetingTypeLabel} icon={<FileText className="w-4 h-4" />} />
          <InfoCard label="Date" value={formatAUDate(meeting.date)} icon={<CalendarDays className="w-4 h-4" />} />
          <InfoCard label="Time" value={`${timeStr}${endTimeStr ? ` – ${endTimeStr}` : ""}`} icon={<Clock className="w-4 h-4" />} />
          <InfoCard label="Prepared By" value={meeting.preparedBy ?? "—"} icon={<User className="w-4 h-4" />} />
          <InfoCard label="Next Meeting" value={meeting.nextMeeting ? formatAUDate(meeting.nextMeeting) : "TBA"} icon={<CalendarDays className="w-4 h-4" />} />
        </div>

        {/* Attendees */}
        {meeting.attendees.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-display px-1">
              Attendees
            </h2>
            <div className="w-full overflow-x-auto rounded-2xl border border-slate-100 shadow-sm bg-white scrollbar-thin">
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[10px] font-bold text-white uppercase tracking-wider">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Initials</th>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Organisation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {meeting.attendees.map((a, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 flex items-center gap-2.5 font-semibold text-slate-850">
                        <Avatar initials={a.initials} size="xs" />
                        {a.name}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-400">
                        {a.initials}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 font-semibold">
                        {a.title ?? "—"}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 font-medium">
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
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-display px-1">
              Meeting Minutes
            </h2>
            <div className="w-full overflow-x-auto rounded-2xl border border-slate-100 shadow-sm bg-white scrollbar-thin">
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[10px] font-bold text-white uppercase tracking-wider">
                    <th className="px-6 py-4 w-20">Item</th>
                    <th className="px-6 py-4 min-w-[300px]">Description & Discussion</th>
                    <th className="px-6 py-4 w-48">Action</th>
                    <th className="px-6 py-4 w-28 text-center">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {meeting.agendaItems.map((item) => (
                    <div key={item.id} className="contents">
                      {/* Section header row */}
                      <tr className="bg-blue-50/50 border-t border-slate-200 first:border-t-0">
                        <td colSpan={4} className="px-6 py-3.5 font-extrabold text-xs text-blue-700 tracking-tight font-display">
                          {item.number} {item.title}
                        </td>
                      </tr>
                      {/* Sub items */}
                      {item.subItems.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-3.5 text-xs font-bold text-slate-400 tabular-nums">
                            {sub.number}
                          </td>
                          <td className="px-6 py-3.5 text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                            {sub.description}
                          </td>
                          <td className="px-6 py-3.5 text-slate-500 font-semibold italic text-xs">
                            {sub.action ?? "—"}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            {sub.owner ? (
                              <div className="inline-flex">
                                <Avatar initials={sub.owner} size="xs" title={sub.owner} />
                              </div>
                            ) : (
                              <span className="text-slate-300 font-bold text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </div>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Actions arising */}
        {allActions.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-display px-1">
              Summary of Actions Arising
            </h2>
            <div className="w-full overflow-x-auto rounded-2xl border border-slate-100 shadow-sm bg-white scrollbar-thin">
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[10px] font-bold text-white uppercase tracking-wider">
                    <th className="px-6 py-4 w-16">#</th>
                    <th className="px-6 py-4">Action Required</th>
                    <th className="px-6 py-4 w-28 text-center">Owner</th>
                    <th className="px-6 py-4 w-32">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allActions.map((a) => (
                    <tr key={a.number} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 text-xs font-bold text-slate-400 tabular-nums">
                        {a.number}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-slate-800">{a.action}</td>
                      <td className="px-6 py-3.5 text-center">
                        {a.owner ? (
                          <div className="inline-flex">
                            <Avatar initials={a.owner} size="xs" title={a.owner} />
                          </div>
                        ) : (
                          <span className="text-slate-350">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-xs font-bold text-slate-450">
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

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <p className="mb-1.5 flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
        <span className="text-slate-300">{icon}</span>
        {label}
      </p>
      <p className="text-[12px] font-bold text-slate-800 truncate leading-snug">
        {value}
      </p>
    </div>
  );
}
