import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileSpreadsheet, Printer, FileDown } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { currentMonth, daysInMonth, dmy, money, monthOrders, shareOf, useData } from "@/lib/store";
import { downloadHtml, exportMonthlyXlsx, monthlyStatementHtml, printHtml } from "@/lib/export";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "التقارير الشهرية — بوفيه يدكو" },
      { name: "description", content: "كشف شهري بصف لكل موظف وعمود لكل يوم مع تصدير Excel وطباعة مباشرة." },
      { property: "og:title", content: "التقارير الشهرية — بوفيه يدكو" },
      { property: "og:description", content: "استخرج كشف الشهر بصيغة Excel مرتبة وقابلة للطباعة." },
    ],
  }),
  component: Reports,
});

function Reports() {
  const data = useData();
  const { orders, meals, employees, settings } = data;
  const [month, setMonth] = useState(currentMonth());
  const list = monthOrders(orders, month);
  const days = daysInMonth(month);
  const activeDays = days.filter((d) => list.some((o) => o.date === d));
  const cols = activeDays.length ? activeDays : days;

  const rows = employees.map((e) => {
    const per = cols.map((d) =>
      list.filter((o) => o.date === d && o.participants.includes(e.id)).reduce((t, o) => t + shareOf(o, meals), 0),
    );
    const total = per.reduce((a, b) => a + b, 0);
    const discount = e.discount ?? 0;
    return { id: e.id, name: e.name, per, total, discount, net: total - discount };
  });
  const grand = rows.reduce((t, r) => t + r.total, 0);

  return (
    <AppLayout title="التقارير الشهرية">
      <div className="surface no-print flex flex-wrap items-end gap-3 p-5">
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
          إجمالي الشهر: {money(grand, settings.currency)}
        </span>
        <button
          onClick={() => exportMonthlyXlsx(data, month)}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
        >
          <FileSpreadsheet className="size-4" /> تصدير Excel
        </button>
        <button
          onClick={() => printHtml(monthlyStatementHtml(data, month))}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold"
        >
          <Printer className="size-4" /> طباعة الكشف
        </button>
        <button
          onClick={() => downloadHtml(monthlyStatementHtml(data, month), `كشف-حساب-${month}.html`)}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold"
        >
          <FileDown className="size-4" /> حفظ كصفحة طباعة
        </button>
      </div>

      <div className="surface mt-5 overflow-x-auto p-5">
        <h3 className="mb-3 font-semibold">كشف الشهر — صف لكل موظف وعمود لكل يوم</h3>
        <table className="w-full min-w-max text-right text-xs md:text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="sticky right-0 bg-card py-2 pl-3 text-right font-medium">الموظف</th>
              {cols.map((d) => (
                <th key={d} className="px-2 py-2 font-medium">
                  {dmy(d).slice(0, 5)}
                </th>
              ))}
              <th className="px-2 py-2 font-medium">الاجمالي</th>
              <th className="px-2 py-2 font-medium">الخصم</th>
              <th className="px-2 py-2 font-medium">الصافي</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/70">
                <td className="sticky right-0 bg-card py-2 pl-3">{r.name}</td>
                {r.per.map((v, i) => (
                  <td key={i} className="px-2 py-2 text-muted-foreground">
                    {v ? Math.round(v * 100) / 100 : "-"}
                  </td>
                ))}
                <td className="px-2 py-2 font-semibold">{Math.round(r.total * 100) / 100}</td>
                <td className="px-2 py-2">{r.discount}</td>
                <td className="px-2 py-2 font-semibold text-accent">{Math.round(r.net * 100) / 100}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
