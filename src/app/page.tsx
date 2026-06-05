import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";

export default async function Home() {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <AuthForm />
    </div>
  );
}
