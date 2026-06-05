import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import StatisticsClient from "./StatisticsClient";

export default async function Statistics() {
  const session = await getServerSession();

  if (!session) {
    redirect("/");
  }

  return <StatisticsClient userId={session.user.id} />;
}
