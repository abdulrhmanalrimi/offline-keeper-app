import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { actions, useData } from "@/lib/store";

export const Route = createFileRoute("/employees")({
  head: () => ({
    meta: [
      { title: "الموظفون — بوفيه يدكو" },
      { name: "description", content: "قائمة موظفي الشركة المشتركين في البوفيه مع أقسامهم." },
      { property: "og:title", content: "الموظفون — بوفيه يدكو" },
      { property: "og:description", content: "أضف الموظفين وحدّد أقسامهم لتوزيع تكلفة الوجبات." },
    ],
  }),
  component: Employees,
});

function Employees() {
  const { employees, orders } = useData();
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");

  const field = "w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <AppLayout title="الموظفون">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          actions.addEmployee(name.trim(), dept.trim() || "عام");
          setName("");
          setDept("");
        }}
        className="surface grid gap-3 p-5 md:grid-cols-3"
      >
        <label className="text-sm">
          اسم الموظف
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="text-sm">
          القسم
          <input className={field} value={dept} onChange={(e) => setDept(e.target.value)} />
        </label>
        <button className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground">
          <Plus className="size-4" /> إضافة موظف
        </button>
      </form>

      <div className="surface mt-5 overflow-x-auto p-5">
        <table className="w-full text-right text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2 font-medium">الاسم</th>
              <th className="py-2 font-medium">القسم</th>
              <th className="py-2 font-medium">عدد الطلبات</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-b border-border/70">
                <td className="py-2">
                  <input
                    className="w-full bg-transparent outline-none"
                    value={e.name}
                    onChange={(ev) => actions.updateEmployee(e.id, { name: ev.target.value })}
                  />
                </td>
                <td className="py-2">
                  <input
                    className="w-full bg-transparent text-muted-foreground outline-none"
                    value={e.dept}
                    onChange={(ev) => actions.updateEmployee(e.id, { dept: ev.target.value })}
                  />
                </td>
                <td className="py-2">{orders.filter((o) => o.participants.includes(e.id)).length}</td>
                <td className="py-2">
                  <button onClick={() => actions.removeEmployee(e.id)} className="text-destructive" aria-label="حذف">
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {employees.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">لا يوجد موظفون بعد.</p>
        )}
      </div>
    </AppLayout>
  );
}
