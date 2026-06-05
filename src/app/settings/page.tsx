import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div style={{ padding: "32px 0", maxWidth: "800px", margin: "0 auto" }}>
      <SettingsClient user={session.user} />
    </div>
  );
}
