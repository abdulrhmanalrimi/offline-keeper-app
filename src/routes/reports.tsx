import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { currentMonth, money, monthOf, orderTotal, useData } from "@/lib/store";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "التقارير الشهرية — بوفيه يدكو" },
      { name: "description", content: "تقرير شهري لتكلفة وجبات البوفيه لكل موظف ولكل وجبة." },
      { property: "og:title", content: "التقارير الشهرية — بوفيه يدكو" },
      { property: "og:description", content: "استخرج تكلفة الشهر لكل موظف ووجبة بضغطة واحدة." },
    ],
  }),
  component: Reports,
});

function Reports() {
  const { orders, meals, employees, settings } = useData();
  const [month, setMonth] = useState(currentMonth());
  const list = orders.filter((o) => monthOf(o.date) === month);
  const total = list.reduce((t, o) => t + orderTotal(o, meals), 0);

  const byEmployee = employees
    .map((e) => {
      const own = list.filter((o) => o.employeeId === e.id);
      return {
        name: e.name,
        dept: e.dept,
        count: own.reduce((t, o) => t + o.qty, 0),
        amount: own.reduce((t, o) => t + orderTotal(o, meals), 0),
      };
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.amount - a.amount);

  const byMeal = meals
    .map((m) => {
      const own = list.filter((o) => o.mealId === m.id);
      return {
        name: m.name,
        count: own.reduce((t, o) => t + o.qty, 0),
        amount: own.reduce((t, o) => t + orderTotal(o, meals), 0),
      };
    })
    .filter((r) => r.count > 0);

  const exportCsv = () => {
    const rows = [["الموظف", "القسم", "عدد الوجبات", "الإجمالي"], ...byEmployee.map((r) => [r.name, r.dept, String(r.count), String(r.amount)])];
    const csv = "\uFEFF" + rows.map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `تقرير-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout title="التقارير الشهرية">
      <div className="surface flex flex-wrap items-end gap-3 p-5">
        <label className="text-sm">
          الشهر
          <input
            type="month"
            className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
        <span className="rounded-full bg-muted px-4 py-2 text-sm font-semibold">
          إجمالي الشهر: {money(total, settings.currency)}
        </span>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
        >
          <Download className="size-4" /> تصدير CSV
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="surface p-5">
          <h3 className="mb-3 font-semibold">حسب الموظف</h3>
          {byEmployee.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">لا توجد بيانات لهذا الشهر.</p>
          ) : (
            <table className="w-full text-right text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 font-medium">الموظف</th>
                  <th className="py-2 font-medium">عدد الوجبات</th>
                  <th className="py-2 font-medium">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {byEmployee.map((r) => (
                  <tr key={r.name} className="border-b border-border/70">
                    <td className="py-2">
                      {r.name}
                      <span className="block text-xs text-muted-foreground">{r.dept}</span>
                    </td>
                    <td className="py-2">{r.count}</td>
                    <td className="py-2 font-semibold">{money(r.amount, settings.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="surface p-5">
          <h3 className="mb-3 font-semibold">حسب الوجبة</h3>
          {byMeal.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">لا توجد بيانات لهذا الشهر.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {byMeal.map((r) => (
                <li key={r.name} className="flex items-center justify-between py-2.5">
                  <span>
                    {r.name}
                    <span className="block text-xs text-muted-foreground">{r.count} وجبة</span>
                  </span>
                  <span className="font-semibold">{money(r.amount, settings.currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
