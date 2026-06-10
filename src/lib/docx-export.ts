import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  TableLayoutType,
  convertInchesToTwip,
  Header,
  ImageRun,
} from "docx";
import { formatAUDate } from "./dates";
import { MEETING_TYPE_LABELS } from "./utils";

type Meeting = {
  type: string;
  date: Date;
  endTime?: Date | null;
  location?: string | null;
  preparedBy?: string | null;
  nextMeeting?: Date | null;
  attendees: { name: string; initials: string; title?: string | null; organisation?: string | null }[];
  agendaItems: {
    number: string;
    title?: string | null;
    subItems: {
      number: string;
      description: string;
      action?: string | null;
      owner?: string | null;
    }[];
  }[];
  project: { name: string };
};

const TEAL = "0F766E";
const TEAL_LIGHT = "E6F4F3";
const WHITE = "FFFFFF";
const DARK = "1A1917";
const GRAY = "6B6560";
const LIGHT_GRAY = "F5F5F3";

function cell(
  text: string,
  opts: {
    bold?: boolean;
    color?: string;
    bg?: string;
    size?: number;
    font?: string;
    colspan?: number;
    align?: typeof AlignmentType[keyof typeof AlignmentType];
    width?: number;
  } = {}
): TableCell {
  return new TableCell({
    columnSpan: opts.colspan,
    shading: opts.bg
      ? { type: ShadingType.SOLID, color: opts.bg, fill: opts.bg }
      : undefined,
    width: opts.width
      ? { size: opts.width, type: WidthType.PERCENTAGE }
      : undefined,
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: opts.bold ?? false,
            color: opts.color ?? DARK,
            size: opts.size ?? 20,
            font: opts.font ?? "Calibri",
          }),
        ],
      }),
    ],
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
  });
}

function headerRow(labels: string[], bg: string = TEAL): TableRow {
  return new TableRow({
    tableHeader: true,
    children: labels.map((label) =>
      cell(label, { bold: true, bg, color: WHITE, size: 20 })
    ),
  });
}

export async function exportMeetingMinutes(meeting: Meeting): Promise<Blob> {
  const meetingTypeLabel =
    MEETING_TYPE_LABELS[meeting.type] ?? meeting.type;

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
  type Action = { number: string; action: string; owner: string };
  const actions: Action[] = [];
  let actionIdx = 1;
  for (const item of meeting.agendaItems) {
    for (const sub of item.subItems) {
      if (sub.action && sub.action.toLowerCase() !== "note") {
        actions.push({
          number: String(actionIdx++),
          action: sub.action,
          owner: sub.owner ?? "",
        });
      }
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 20, color: DARK },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.25),
              right: convertInchesToTwip(1.25),
            },
          },
        },
        children: [
          // Company name heading
          new Paragraph({
            children: [
              new TextRun({
                text: "CAVI PROPERTY",
                bold: true,
                size: 32,
                color: TEAL,
                font: "Calibri",
              }),
            ],
            spacing: { after: 100 },
          }),

          // Main heading
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: "Meeting Minutes",
                bold: true,
                size: 48,
                color: DARK,
                font: "Calibri",
              }),
            ],
            spacing: { after: 80 },
          }),

          // Subtitle
          new Paragraph({
            children: [
              new TextRun({
                text: `${meeting.project.name} — ${meetingTypeLabel}`,
                size: 24,
                color: GRAY,
                font: "Calibri",
              }),
            ],
            spacing: { after: 300 },
          }),

          // Info table
          new Table({
            layout: TableLayoutType.FIXED,
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  cell("Project", { bold: true, bg: LIGHT_GRAY, width: 15 }),
                  cell(meeting.project.name, { width: 35 }),
                  cell("Document", { bold: true, bg: LIGHT_GRAY, width: 15 }),
                  cell(meetingTypeLabel, { width: 35 }),
                ],
              }),
              new TableRow({
                children: [
                  cell("Date", { bold: true, bg: LIGHT_GRAY }),
                  cell(formatAUDate(meeting.date)),
                  cell("Time", { bold: true, bg: LIGHT_GRAY }),
                  cell(`${timeStr}${endTimeStr ? ` – ${endTimeStr}` : ""}`),
                ],
              }),
              new TableRow({
                children: [
                  cell("Location", { bold: true, bg: LIGHT_GRAY }),
                  cell(meeting.location ?? "—"),
                  cell("Prepared by", { bold: true, bg: LIGHT_GRAY }),
                  cell(meeting.preparedBy ?? "—"),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 200 } }),

          // Attendees heading
          new Paragraph({
            children: [
              new TextRun({
                text: "Attendees",
                bold: true,
                size: 26,
                color: TEAL,
                font: "Calibri",
              }),
            ],
            spacing: { after: 120 },
          }),

          // Attendees table
          new Table({
            layout: TableLayoutType.FIXED,
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              headerRow(["Name", "Initial", "Title", "Organisation"], TEAL),
              ...meeting.attendees.map(
                (a) =>
                  new TableRow({
                    children: [
                      cell(a.name),
                      cell(a.initials, { align: AlignmentType.CENTER }),
                      cell(a.title ?? ""),
                      cell(a.organisation ?? ""),
                    ],
                  })
              ),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 200 } }),

          // Minutes heading
          new Paragraph({
            children: [
              new TextRun({
                text: "Minutes",
                bold: true,
                size: 26,
                color: TEAL,
                font: "Calibri",
              }),
            ],
            spacing: { after: 120 },
          }),

          // Minutes table
          new Table({
            layout: TableLayoutType.FIXED,
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              headerRow(["Item", "Description", "Action", "Owner"]),
              ...meeting.agendaItems.flatMap((item) => [
                // Section header row
                new TableRow({
                  children: [
                    new TableCell({
                      columnSpan: 4,
                      shading: {
                        type: ShadingType.SOLID,
                        color: TEAL_LIGHT,
                        fill: TEAL_LIGHT,
                      },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: `${item.number}  ${item.title ?? ""}`,
                              bold: true,
                              size: 22,
                              color: TEAL,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
                      margins: { top: 80, bottom: 80, left: 100, right: 100 },
                    }),
                  ],
                }),
                // Sub items
                ...item.subItems.map(
                  (sub) =>
                    new TableRow({
                      children: [
                        cell(sub.number, { color: GRAY, size: 18 }),
                        cell(sub.description),
                        cell(sub.action ?? ""),
                        cell(sub.owner ?? "", { align: AlignmentType.CENTER }),
                      ],
                    })
                ),
              ]),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 200 } }),

          // Actions arising
          ...(actions.length > 0
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Actions Arising",
                      bold: true,
                      size: 26,
                      color: TEAL,
                      font: "Calibri",
                    }),
                  ],
                  spacing: { after: 120 },
                }),
                new Table({
                  layout: TableLayoutType.FIXED,
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    headerRow(
                      ["Item", "Actions Arising from Meeting", "Responsibility", "Date"]
                    ),
                    ...actions.map(
                      (a) =>
                        new TableRow({
                          children: [
                            cell(a.number, { align: AlignmentType.CENTER }),
                            cell(a.action),
                            cell(a.owner, { align: AlignmentType.CENTER }),
                            cell(""),
                          ],
                        })
                    ),
                  ],
                }),
                new Paragraph({ text: "", spacing: { after: 200 } }),
              ]
            : []),

          // Next meeting
          new Paragraph({
            children: [
              new TextRun({
                text: "Next Meeting: ",
                bold: true,
                size: 20,
                font: "Calibri",
              }),
              new TextRun({
                text: meeting.nextMeeting
                  ? formatAUDate(meeting.nextMeeting)
                  : "TBA",
                size: 20,
                font: "Calibri",
              }),
            ],
            spacing: { before: 200 },
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  return buffer;
}
