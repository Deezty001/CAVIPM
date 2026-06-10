import { notFound } from "next/navigation";
import { getMeeting } from "@/actions/meetings";
import { MeetingDetailClient } from "@/components/meetings/MeetingDetailClient";

export const dynamic = "force-dynamic";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string; meetingId: string }>;
}) {
  const { meetingId } = await params;
  const meeting = await getMeeting(meetingId);
  if (!meeting) notFound();
  return <MeetingDetailClient meeting={meeting} />;
}
