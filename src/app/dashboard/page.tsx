import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function Dashboard() {
  const session = await getServerSession();

  if (!session) {
    redirect("/");
  }

  return <DashboardClient userId={session.user.id} />;
}
