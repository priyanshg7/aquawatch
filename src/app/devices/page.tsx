import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import DevicesClient from "./DevicesClient";

export default async function Devices() {
  const session = await getServerSession();

  if (!session) {
    redirect("/");
  }

  return <DevicesClient userId={session.user.id} />;
}
