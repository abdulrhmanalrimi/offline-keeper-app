import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, Plus, Users } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { actions, money, orderTotal, shareOf, todayISO, useData } from "@/lib/store";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "الطلبات اليومية — بوفيه يدكو" },
      { name: "description", content: "تسجيل طلبات الوجبات اليومية وتقسيم قيمتها بالتساوي بين المشاركين." },
      { property: "og:title", content: "الطلبات اليومية — بوفيه يدكو" },
      { property: "og:description", content: "سجّل طلبات الموظفين اليومية واقسم تكلفة الوجبة المشتركة تلقائيًا." },
    ],
  }),
  component: Orders,
});

function Orders() {
  const { orders, meals, employees, settings } = useData();
  const [date, setDate] = useState(todayISO());
  const [participants, setParticipants] = useState<string[]>([]);
  const [mealId, setMealId] = useState("");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const dayOrders = orders.filter((o) => o.date === date);
  const total = dayOrders.reduce((t, o) => t + orderTotal(o, meals), 0);
  const meal = meals.find((m) => m.id === mealId);
  const preview = (meal?.price ?? 0) * qty;
  const perHead = participants.length ? Math.round((preview / participants.length) * 100) / 100 : 0;

  const toggle = (id: string) =>
    setParticipants((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealId || participants.length === 0 || qty < 1) return;
    actions.addOrder({ date, participants, mealId, qty, note });
    setQty(1);
    setNote("");
    setParticipants([]);
  };

  const field = "w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <AppLayout title="الطلبات اليومية">
      <form onSubmit={submit} className="surface grid gap-4 p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="text-sm">
            التاريخ
            <input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} />
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
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium">
              <Users className="size-4" /> المشاركون في الوجبة ({participants.length})
            </span>
            <button
              type="button"
              className="text-xs text-accent"
              onClick={() =>
                setParticipants(participants.length === employees.length ? [] : employees.map((e) => e.id))
              }
            >
              {participants.length === employees.length ? "إلغاء تحديد الكل" : "تحديد الكل"}
            </button>
          </div>
          <div className="grid max-h-56 gap-1.5 overflow-y-auto rounded-xl border border-border p-3 sm:grid-cols-2 lg:grid-cols-3">
            {employees.map((e) => (
              <label key={e.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
                <input type="checkbox" checked={participants.includes(e.id)} onChange={() => toggle(e.id)} />
                {e.name}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3 text-sm">
          <span>
            قيمة الطلب: <strong>{money(preview, settings.currency)}</strong>
          </span>
          <span>
            نصيب كل مشارك: <strong className="text-accent">{money(perHead, settings.currency)}</strong>
          </span>
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground"
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
                <th className="py-2 font-medium">الوجبة</th>
                <th className="py-2 font-medium">الكمية</th>
                <th className="py-2 font-medium">المشاركون</th>
                <th className="py-2 font-medium">قيمة الوجبة</th>
                <th className="py-2 font-medium">نصيب الفرد</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {dayOrders.map((o) => (
                <tr key={o.id} className="border-b border-border/70 align-top">
                  <td className="py-2.5">{meals.find((m) => m.id === o.mealId)?.name ?? "—"}</td>
                  <td className="py-2.5">{o.qty}</td>
                  <td className="max-w-md py-2.5 text-muted-foreground">
                    {o.participants
                      .map((id) => employees.find((e) => e.id === id)?.name ?? "—")
                      .join("، ")}
                  </td>
                  <td className="py-2.5 font-semibold">{money(orderTotal(o, meals), settings.currency)}</td>
                  <td className="py-2.5 text-accent">{money(shareOf(o, meals), settings.currency)}</td>
                  <td className="py-2.5">
                    <button onClick={() => actions.removeOrder(o.id)} className="text-destructive" aria-label="حذف الطلب">
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
