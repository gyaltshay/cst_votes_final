"use client";

import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dashStyles from './adminDashboard.module.css';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVotes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchStats();
      // Set up polling every 30 seconds
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [status, session]);

  async function fetchStats() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/stats", {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch stats");
      }
      
      const data = await res.json();
      setStats(data);
      setError("");
      setRetryCount(0);
    } catch (e) {
      console.error("Error fetching stats:", e);
      setError(e.message);
      // Retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchStats();
        }, delay);
      }
    } finally {
      setLoading(false);
    }
  }

  const quickLinks = [
    { href: '/admin/settings', label: 'Election Settings', description: 'Configure election parameters and rules' },
    { href: '/admin/users', label: 'User Management', description: 'Manage student and admin accounts' },
    { href: '/admin/candidates', label: 'Candidate Management', description: 'Add and manage election candidates' },
    { href: '/admin/election-status', label: 'Election Status', description: 'Monitor election progress and results' },
    { href: '/admin/support-messages', label: 'Support Messages', description: 'View and respond to user inquiries' }
  ];

  if (status === "loading" || loading) {
    return <div className={dashStyles.dashboardContainer}>Loading...</div>;
  }

  if (status === "authenticated" && session?.user?.role !== "ADMIN") {
    return <div className={dashStyles.dashboardContainer}>Access Denied</div>;
  }

  return (
    <div className={dashStyles.dashboardContainer}>
      <h1 className={dashStyles.dashboardHeader}>Admin Dashboard</h1>
      {error && (
        <div className={dashStyles.errorMessage}>
          {error}
          {retryCount < 3 && <span> Retrying...</span>}
        </div>
      )}
      <div className={dashStyles.statsGrid}>
        <div className={dashStyles.statCard}>
          <div className={dashStyles.statTitle}>Total Users</div>
          <div className={dashStyles.statValue}>{stats.totalUsers}</div>
          <div className={dashStyles.statDescription}>Registered students in the system</div>
        </div>
        <div className={dashStyles.statCard}>
          <div className={dashStyles.statTitle}>Total Votes</div>
          <div className={dashStyles.statValue}>{stats.totalVotes}</div>
          <div className={dashStyles.statDescription}>Total votes cast</div>
        </div>
      </div>

      <div className={dashStyles.quickLinksCard}>
        <div className={dashStyles.quickLinksHeader}>Quick Links</div>
        <div className={dashStyles.quickLinksGrid}>
          {quickLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className={dashStyles.quickLink}
            >
              <div className={dashStyles.quickLinkTitle}>{link.label}</div>
              <div className={dashStyles.quickLinkDesc}>{link.description}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
} 