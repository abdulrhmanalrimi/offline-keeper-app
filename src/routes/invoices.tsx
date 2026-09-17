import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Printer } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { currentMonth, money, monthOf, orderTotal, useData } from "@/lib/store";

export const Route = createFileRoute("/invoices")({
  head: () => ({
    meta: [
      { title: "الفواتير — بوفيه يدكو" },
      { name: "description", content: "إصدار فاتورة شهرية مفصلة لكل موظف مع إمكانية الطباعة." },
      { property: "og:title", content: "الفواتير — بوفيه يدكو" },
      { property: "og:description", content: "فاتورة شهرية جاهزة للطباعة لكل موظف في البوفيه." },
    ],
  }),
  component: Invoices,
});

function Invoices() {
  const { orders, meals, employees, settings } = useData();
  const [month, setMonth] = useState(currentMonth());
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");

  const employee = employees.find((e) => e.id === employeeId);
  const list = orders.filter((o) => o.employeeId === employeeId && monthOf(o.date) === month);
  const total = list.reduce((t, o) => t + orderTotal(o, meals), 0);

  return (
    <AppLayout title="الفواتير">
      <div className="surface no-print flex flex-wrap items-end gap-3 p-5">
        <label className="text-sm">
          الموظف
          <select
            className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          الشهر
          <input
            type="month"
            className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
        >
          <Printer className="size-4" /> طباعة الفاتورة
        </button>
      </div>

      <div className="surface mt-5 p-6">
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-bold">{settings.shopName}</h2>
            <p className="text-sm text-muted-foreground">فاتورة وجبات شهر {month}</p>
          </div>
          <div className="text-left text-sm">
            <p className="font-semibold">{employee?.name ?? "—"}</p>
            <p className="text-muted-foreground">{employee?.dept}</p>
          </div>
        </div>

        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">لا توجد طلبات لهذا الموظف في هذا الشهر.</p>
        ) : (
          <table className="mt-4 w-full text-right text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 font-medium">التاريخ</th>
                <th className="py-2 font-medium">الوجبة</th>
                <th className="py-2 font-medium">الكمية</th>
                <th className="py-2 font-medium">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {[...list]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((o) => (
                  <tr key={o.id} className="border-b border-border/70">
                    <td className="py-2">{o.date}</td>
                    <td className="py-2">{meals.find((m) => m.id === o.mealId)?.name ?? "—"}</td>
                    <td className="py-2">{o.qty}</td>
                    <td className="py-2">{money(orderTotal(o, meals), settings.currency)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        <div className="mt-6 flex items-center justify-between rounded-xl bg-muted px-4 py-3">
          <span className="font-semibold">الإجمالي المستحق</span>
          <span className="text-lg font-bold">{money(total, settings.currency)}</span>
        </div>
      </div>
    </AppLayout>
  );
}
