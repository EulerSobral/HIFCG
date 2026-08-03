import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const userId = useStore((s) => s.currentUserId);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // Wait one tick for zustand persist to rehydrate from localStorage
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated && !userId) navigate({ to: "/" });
  }, [hydrated, userId, navigate]);
  if (!hydrated) return null;
  if (!userId) return null;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}