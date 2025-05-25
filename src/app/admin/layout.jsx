"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import styles from "./admin.module.css";

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Debug log (remove in production if you want)
  useEffect(() => {
    console.log("Session:", session, "Status:", status);
  }, [session, status]);

  useEffect(() => {
    if (status === "loading") return; // Don't redirect while loading
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.replace("/");
    }
  }, [status, session, router]);

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (confirmed) {
      await signOut({ callbackUrl: '/login' });
    }
  };

  // Show loader while loading or session is not available
  if (status === "loading" || !session) {
    return <div className={styles.loadingScreen}>Loading...</div>;
  }

  // If authenticated but not admin, don't render children (redirect will happen)
  if (session?.user?.role !== "ADMIN") {
    return <div className={styles.loadingScreen}>Redirecting...</div>;
  }

  return (
    <div className={styles.adminLayout}>
      <div className={styles.adminHeader}>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </div>
      <main className={styles.adminMain}>{children}</main>
    </div>
  );
}