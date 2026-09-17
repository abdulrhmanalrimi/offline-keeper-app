import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Printer, FileDown, FileSpreadsheet } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { currentMonth, dmy, money, monthOrders, orderTotal, shareOf, useData } from "@/lib/store";
import { downloadHtml, employeeInvoiceHtml, exportEmployeeXlsx, printHtml } from "@/lib/export";

export const Route = createFileRoute("/invoices")({
  head: () => ({
    meta: [
      { title: "الفواتير — بوفيه يدكو" },
      { name: "description", content: "فاتورة شهرية مفصلة لكل موظف قابلة للطباعة والحفظ." },
      { property: "og:title", content: "الفواتير — بوفيه يدكو" },
      { property: "og:description", content: "أصدر فاتورة شهرية مرتبة لكل موظف واطبعها مباشرة." },
    ],
  }),
  component: Invoices,
});

function Invoices() {
  const data = useData();
  const { orders, meals, employees, settings } = data;
  const [month, setMonth] = useState(currentMonth());
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");

  const employee = employees.find((e) => e.id === employeeId);
  const list = monthOrders(orders, month)
    .filter((o) => o.participants.includes(employeeId))
    .sort((a, b) => a.date.localeCompare(b.date));
  const total = list.reduce((t, o) => t + shareOf(o, meals), 0);
  const discount = employee?.discount ?? 0;

  const safeName = (employee?.name ?? "موظف").replaceAll(" ", "_");

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
        <label className="text-sm">
          الخصم الشهري
          <input
            type="number"
            className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
            value={discount}
            onChange={(e) =>
              employee && void import("@/lib/store").then((m) =>
                m.actions.updateEmployee(employee.id, { discount: Number(e.target.value) }),
              )
            }
          />
        </label>
        <button
          onClick={() => printHtml(employeeInvoiceHtml(data, month, employeeId))}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
        >
          <Printer className="size-4" /> طباعة الفاتورة
        </button>
        <button
          onClick={() =>
            downloadHtml(employeeInvoiceHtml(data, month, employeeId), `كشف-${safeName}-${month}.html`)
          }
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold"
        >
          <FileDown className="size-4" /> تحميل HTML
        </button>
        <button
          onClick={() => exportEmployeeXlsx(data, month, employeeId)}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold"
        >
          <FileSpreadsheet className="size-4" /> تحميل Excel
        </button>
      </div>

      <div className="surface mt-5 p-6">
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-bold">{settings.shopName}</h2>
            <p className="text-sm text-muted-foreground">كشف حساب موظف مفصل — {month}</p>
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
                <th className="py-2 font-medium">قيمة الوجبة</th>
                <th className="py-2 font-medium">المشاركون</th>
                <th className="py-2 font-medium">نصيب الموظف</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} className="border-b border-border/70">
                  <td className="py-2">{dmy(o.date)}</td>
                  <td className="py-2">{meals.find((m) => m.id === o.mealId)?.name ?? "—"}</td>
                  <td className="py-2">{o.qty}</td>
                  <td className="py-2">{money(orderTotal(o, meals), settings.currency)}</td>
                  <td className="py-2">{o.participants.length}</td>
                  <td className="py-2 font-semibold">{money(shareOf(o, meals), settings.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-6 grid gap-3 rounded-xl bg-muted px-4 py-3 sm:grid-cols-3">
          <span className="text-sm">
            إجمالي نصيب الوجبات: <strong>{money(total, settings.currency)}</strong>
          </span>
          <span className="text-sm">
            الخصم الشهري: <strong>{money(discount, settings.currency)}</strong>
          </span>
          <span className="text-sm">
            صافي المستحق: <strong className="text-accent">{money(total - discount, settings.currency)}</strong>
          </span>
        </div>
      </div>
    </AppLayout>
  );
}
