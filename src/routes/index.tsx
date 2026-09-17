import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, Coins, Users, CalendarRange, Plus } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useData, money, orderTotal, todayISO, currentMonth, monthOf } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "نظام بوفيه يدكو — لوحة التشغيل اليومية" },
      {
        name: "description",
        content: "نظام محلي لإدارة وجبات البوفيه والطلبات اليومية وتقارير الموظفين بدون إنترنت.",
      },
      { property: "og:title", content: "نظام بوفيه يدكو — لوحة التشغيل اليومية" },
      {
        property: "og:description",
        content: "سجّل الطلبات ووزّع التكلفة على الموظفين واستخرج التقارير خلال ثوانٍ.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { orders, meals, employees, settings } = useData();
  const today = todayISO();
  const todays = orders.filter((o) => o.date === today);
  const monthOrders = orders.filter((o) => monthOf(o.date) === currentMonth());
  const sum = (list: typeof orders) => list.reduce((t, o) => t + orderTotal(o, meals), 0);

  const stats = [
    { label: "طلبات اليوم", value: String(todays.length), hint: "طلب مسجل", icon: ClipboardList },
    { label: "إجمالي اليوم", value: money(sum(todays), settings.currency), hint: "قيمة الطلبات", icon: Coins },
    { label: "الموظفون", value: String(employees.length), hint: "موظف في القائمة", icon: Users },
    {
      label: "إجمالي الشهر",
      value: money(sum(monthOrders), settings.currency),
      hint: "من بداية الشهر",
      icon: CalendarRange,
    },
  ];

  return (
    <AppLayout title="نظرة عامة">
      <section className="hero-panel p-6 md:p-10">
        <p className="text-sm opacity-80">لوحة التشغيل اليومية</p>
        <h2 className="mt-2 max-w-xl text-2xl font-bold leading-relaxed md:text-3xl">
          كل ما تحتاجه لإدارة <span className="text-accent">{settings.shopName}</span> في مكان واحد.
        </h2>
        <p className="mt-3 max-w-xl text-sm opacity-80">
          سجّل الطلبات، وزّع التكلفة على الموظفين، واستخرج التقارير خلال ثوانٍ — كل البيانات تُحفظ على جهازك.
        </p>
        <Link
          to="/orders"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" /> تسجيل طلب جديد
        </Link>
      </section>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="surface p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-accent">
                <s.icon className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">آخر الطلبات</h3>
            <Link to="/orders" className="text-sm text-accent">
              عرض الكل
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              لا توجد طلبات حتى الآن. ابدأ بتسجيل طلب وجبة جديد ليظهر هنا.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {orders.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                  <span>
                    <span className="font-medium">
                      {employees.find((e) => e.id === o.employeeId)?.name ?? "—"}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {meals.find((m) => m.id === o.mealId)?.name} × {o.qty} — {o.date}
                    </span>
                  </span>
                  <span className="font-semibold">{money(orderTotal(o, meals), settings.currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="surface p-5">
          <h3 className="font-semibold">اختصارات سريعة</h3>
          <div className="mt-4 grid gap-3">
            <Link to="/meals" className="rounded-xl border border-border p-3 text-sm hover:bg-muted">
              الوجبات والأسعار
              <span className="block text-xs text-muted-foreground">
                {meals.filter((m) => m.active).length} وجبة نشطة اليوم
              </span>
            </Link>
            <Link to="/employees" className="rounded-xl border border-border p-3 text-sm hover:bg-muted">
              الموظفون
              <span className="block text-xs text-muted-foreground">إضافة وتعديل قائمة الموظفين</span>
            </Link>
            <Link to="/invoices" className="rounded-xl border border-border p-3 text-sm hover:bg-muted">
              الفواتير
              <span className="block text-xs text-muted-foreground">فاتورة شهرية لكل موظف</span>
            </Link>
          </div>
          <div className="mt-4 rounded-xl border border-dashed border-accent/50 bg-accent/5 p-3 text-xs text-muted-foreground">
            نصيحة: حدّث أسعار الوجبات قبل بداية كل شهر لتكون التقارير دقيقة.
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
