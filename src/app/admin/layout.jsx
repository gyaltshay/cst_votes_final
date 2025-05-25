"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import styles from "./admin.module.css";

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [status, session, router]);

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (confirmed) {
      await signOut({ 
        callbackUrl: '/login',
        redirect: true 
      });
    }
  };

  if (status === "loading") {
    return <div className={styles.loadingScreen}>Loading...</div>;
  }

  if (!session || session.user.role !== "ADMIN") {
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