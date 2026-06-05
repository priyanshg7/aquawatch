import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import ActivityClient from "./ActivityClient";

export default async function PumpActivityLog() {
  const session = await getServerSession();

  if (!session) {
    redirect("/");
  }

  return <ActivityClient userId={session.user.id} />;
}
