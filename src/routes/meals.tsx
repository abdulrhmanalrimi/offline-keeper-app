import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { actions, money, useData } from "@/lib/store";

export const Route = createFileRoute("/meals")({
  head: () => ({
    meta: [
      { title: "الوجبات والأسعار — بوفيه يدكو" },
      { name: "description", content: "إدارة قائمة وجبات البوفيه وأسعارها وتفعيلها أو إيقافها." },
      { property: "og:title", content: "الوجبات والأسعار — بوفيه يدكو" },
      { property: "og:description", content: "أضف الوجبات وحدّث أسعارها بسهولة على جهازك." },
    ],
  }),
  component: Meals,
});

function Meals() {
  const { meals, settings } = useData();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const field = "w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <AppLayout title="الوجبات والأسعار">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          actions.addMeal(name.trim(), Number(price) || 0);
          setName("");
          setPrice("");
        }}
        className="surface grid gap-3 p-5 md:grid-cols-3"
      >
        <label className="text-sm">
          اسم الوجبة
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="text-sm">
          السعر
          <input
            type="number"
            min={0}
            className={field}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>
        <button className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground">
          <Plus className="size-4" /> إضافة وجبة
        </button>
      </form>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {meals.map((m) => (
          <div key={m.id} className="surface p-5">
            <div className="flex items-start justify-between">
              <input
                className="w-full bg-transparent text-base font-semibold outline-none"
                value={m.name}
                onChange={(e) => actions.updateMeal(m.id, { name: e.target.value })}
              />
              <button onClick={() => actions.removeMeal(m.id)} className="text-destructive" aria-label="حذف">
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="number"
                className="w-28 rounded-lg border border-input bg-card px-2 py-1.5"
                value={m.price}
                onChange={(e) => actions.updateMeal(m.id, { price: Number(e.target.value) })}
              />
              <span className="text-muted-foreground">{settings.currency}</span>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={m.active}
                onChange={(e) => actions.updateMeal(m.id, { active: e.target.checked })}
              />
              متاحة اليوم
            </label>
            <p className="mt-2 text-xs text-muted-foreground">السعر الحالي: {money(m.price, settings.currency)}</p>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
