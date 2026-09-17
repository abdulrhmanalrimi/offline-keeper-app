import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid,
  ClipboardList,
  Utensils,
  Users,
  BarChart3,
  Receipt,
  Coffee,
  Wifi,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { loadFromDisk, useData } from "@/lib/store";

const nav = [
  { to: "/", label: "نظرة عامة", icon: LayoutGrid },
  { to: "/orders", label: "الطلبات اليومية", icon: ClipboardList },
  { to: "/meals", label: "الوجبات والأسعار", icon: Utensils },
  { to: "/employees", label: "الموظفون", icon: Users },
  { to: "/reports", label: "التقارير الشهرية", icon: BarChart3 },
  { to: "/invoices", label: "الفواتير", icon: Receipt },
] as const;

export function AppLayout({ title, children }: { title: string; children: ReactNode }) {
  const { settings } = useData();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    loadFromDisk();
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-background lg:flex">
      <aside className="no-print bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-sidebar-accent text-sidebar-accent-foreground">
            <Coffee className="size-5" />
          </span>
          <span>
            <span className="block text-lg font-bold">{settings.shopName.split(" ")[1] ?? "يدكو"}</span>
            <span className="block text-xs opacity-70">نظام البوفيه</span>
          </span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col lg:overflow-visible">
          {nav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  "flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                    : "opacity-80 hover:bg-white/10",
                ].join(" ")}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex items-center justify-between gap-4 border-b border-border bg-card px-5 py-4">
          <div>
            <p className="text-xs text-muted-foreground">مساحة الإدارة / {title}</p>
            <h1 className="text-lg font-bold">{title}</h1>
          </div>
          <span className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
            <Wifi className="size-3.5 text-accent" />
            يعمل محليًا بدون إنترنت
          </span>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
        <footer className="no-print border-t border-border px-5 py-4 text-center text-xs text-muted-foreground">
          {settings.shopName} — البيانات محفوظة على هذا الجهاز
        </footer>
      </div>
    </div>
  );
}
