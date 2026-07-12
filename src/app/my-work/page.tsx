import { getMyWork } from "@/actions/my-work";
import { MyWorkClient } from "@/components/work/MyWorkClient";

export const dynamic = "force-dynamic";

export default async function MyWorkPage() {
  const data = await getMyWork();
  return <MyWorkClient data={data} />;
}
