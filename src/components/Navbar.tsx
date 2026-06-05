"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import styles from "./Navbar.module.css";
import { Droplet, LayoutDashboard, Settings, BarChart3, LogOut, User, Activity } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Droplet className={styles.icon} />
        <span className="text-gradient">AquaWatch</span>
      </div>
      <div className={styles.links}>
        <Link href="/dashboard" className={styles.link}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </Link>
        <Link href="/statistics" className={styles.link}>
          <BarChart3 size={18} />
          <span>Statistics</span>
        </Link>
        <Link href="/activity" className={styles.link}>
          <Activity size={18} />
          <span>Activity Log</span>
        </Link>
        <Link href="/devices" className={styles.link}>
          <Settings size={18} />
          <span>Devices</span>
        </Link>
        <Link href="/settings" className={styles.link}>
          <User size={18} />
          <span>Profile</span>
        </Link>
        <button onClick={() => signOut()} className={styles.logoutBtn}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
