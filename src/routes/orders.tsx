import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { actions, money, orderTotal, todayISO, useData } from "@/lib/store";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "الطلبات اليومية — بوفيه يدكو" },
      { name: "description", content: "تسجيل ومتابعة طلبات الوجبات اليومية للموظفين وحساب تكلفتها." },
      { property: "og:title", content: "الطلبات اليومية — بوفيه يدكو" },
      { property: "og:description", content: "سجّل طلبات الموظفين اليومية واحسب الإجمالي فورًا." },
    ],
  }),
  component: Orders,
});

function Orders() {
  const { orders, meals, employees, settings } = useData();
  const [date, setDate] = useState(todayISO());
  const [employeeId, setEmployeeId] = useState("");
  const [mealId, setMealId] = useState("");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const dayOrders = orders.filter((o) => o.date === date);
  const total = dayOrders.reduce((t, o) => t + orderTotal(o, meals), 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !mealId || qty < 1) return;
    actions.addOrder({ date, employeeId, mealId, qty, note });
    setQty(1);
    setNote("");
  };

  const field = "w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <AppLayout title="الطلبات اليومية">
      <form onSubmit={submit} className="surface grid gap-3 p-5 md:grid-cols-5">
        <label className="text-sm">
          التاريخ
          <input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="text-sm">
          الموظف
          <select className={field} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">اختر موظفًا</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          الوجبة
          <select className={field} value={mealId} onChange={(e) => setMealId(e.target.value)}>
            <option value="">اختر وجبة</option>
            {meals
              .filter((m) => m.active)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.price}
                </option>
              ))}
          </select>
        </label>
        <label className="text-sm">
          الكمية
          <input
            type="number"
            min={1}
            className={field}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
        </label>
        <label className="text-sm">
          ملاحظة
          <input className={field} value={note} onChange={(e) => setNote(e.target.value)} placeholder="اختياري" />
        </label>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground md:col-span-5"
        >
          <Plus className="size-4" /> إضافة الطلب
        </button>
      </form>

      <div className="surface mt-5 overflow-x-auto p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">طلبات يوم {date}</h3>
          <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold">
            الإجمالي: {money(total, settings.currency)}
          </span>
        </div>
        {dayOrders.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">لا توجد طلبات في هذا اليوم.</p>
        ) : (
          <table className="w-full text-right text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 font-medium">الموظف</th>
                <th className="py-2 font-medium">الوجبة</th>
                <th className="py-2 font-medium">الكمية</th>
                <th className="py-2 font-medium">الإجمالي</th>
                <th className="py-2 font-medium">ملاحظة</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {dayOrders.map((o) => (
                <tr key={o.id} className="border-b border-border/70">
                  <td className="py-2.5">{employees.find((e) => e.id === o.employeeId)?.name ?? "—"}</td>
                  <td className="py-2.5">{meals.find((m) => m.id === o.mealId)?.name ?? "—"}</td>
                  <td className="py-2.5">{o.qty}</td>
                  <td className="py-2.5 font-semibold">{money(orderTotal(o, meals), settings.currency)}</td>
                  <td className="py-2.5 text-muted-foreground">{o.note || "—"}</td>
                  <td className="py-2.5">
                    <button
                      onClick={() => actions.removeOrder(o.id)}
                      className="text-destructive"
                      aria-label="حذف الطلب"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}
