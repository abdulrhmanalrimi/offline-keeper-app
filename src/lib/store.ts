import { useSyncExternalStore } from "react";

export type Meal = { id: string; name: string; price: number; active: boolean };
export type Employee = { id: string; name: string; dept: string; discount?: number };
export type Order = {
  id: string;
  date: string; // YYYY-MM-DD
  participants: string[]; // employee ids sharing the meal
  mealId: string;
  qty: number;
  note?: string;
  createdAt: number;
};

export type AppData = {
  meals: Meal[];
  employees: Employee[];
  orders: Order[];
  settings: { shopName: string; owner: string; currency: string };
};

const KEY = "yadco-cafeteria-v1";

const uid = () => Math.random().toString(36).slice(2, 10);

export const defaultData = (): AppData => ({
  meals: [
    { id: "m1", name: "فول بالزيت", price: 500, active: true },
    { id: "m2", name: "فاصوليا", price: 600, active: true },
    { id: "m3", name: "بيض مقلي", price: 700, active: true },
  ],
  employees: [
    { id: "e1", name: "عبدالرحمن الريمي", dept: "الإدارة", discount: 0 },
    { id: "e2", name: "محمد علي", dept: "الإنتاج", discount: 0 },
    { id: "e3", name: "سامي أحمد", dept: "الصيانة", discount: 0 },
  ],
  orders: [],
  settings: { shopName: "بوفيه يدكو", owner: "عبدالرحمن", currency: "ر.ي" },
});

type LegacyOrder = Order & { employeeId?: string };

function migrate(raw: AppData): AppData {
  return {
    ...defaultData(),
    ...raw,
    employees: (raw.employees ?? []).map((e) => ({ discount: 0, ...e })),
    orders: (raw.orders ?? []).map((o: LegacyOrder) => ({
      ...o,
      participants:
        o.participants && o.participants.length > 0
          ? o.participants
          : o.employeeId
            ? [o.employeeId]
            : [],
    })),
  };
}

let data: AppData = defaultData();
let loaded = false;
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function loadFromDisk() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = migrate(JSON.parse(raw) as AppData);
  } catch {
    /* ignore */
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const serverSnapshot = defaultData();

export function useData(): AppData {
  return useSyncExternalStore(
    subscribe,
    () => data,
    () => serverSnapshot,
  );
}

function update(fn: (d: AppData) => AppData) {
  data = fn(data);
  persist();
  emit();
}

export const actions = {
  addMeal: (name: string, price: number) =>
    update((d) => ({ ...d, meals: [...d.meals, { id: uid(), name, price, active: true }] })),
  updateMeal: (id: string, patch: Partial<Meal>) =>
    update((d) => ({ ...d, meals: d.meals.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
  removeMeal: (id: string) => update((d) => ({ ...d, meals: d.meals.filter((m) => m.id !== id) })),

  addEmployee: (name: string, dept: string) =>
    update((d) => ({ ...d, employees: [...d.employees, { id: uid(), name, dept, discount: 0 }] })),
  updateEmployee: (id: string, patch: Partial<Employee>) =>
    update((d) => ({
      ...d,
      employees: d.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),
  removeEmployee: (id: string) =>
    update((d) => ({ ...d, employees: d.employees.filter((e) => e.id !== id) })),

  addOrder: (o: Omit<Order, "id" | "createdAt">) =>
    update((d) => ({ ...d, orders: [{ ...o, id: uid(), createdAt: Date.now() }, ...d.orders] })),
  removeOrder: (id: string) =>
    update((d) => ({ ...d, orders: d.orders.filter((o) => o.id !== id) })),

  setSettings: (patch: Partial<AppData["settings"]>) =>
    update((d) => ({ ...d, settings: { ...d.settings, ...patch } })),

  importAll: (next: AppData) => update(() => migrate(next)),
  resetAll: () => update(() => defaultData()),
};

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const monthOf = (iso: string) => iso.slice(0, 7);
export const currentMonth = () => todayISO().slice(0, 7);

export function money(n: number, currency = "ر.ي") {
  return `${Math.round(n * 100) / 100} ${currency}`;
}

export function orderTotal(o: Order, meals: Meal[]) {
  const meal = meals.find((m) => m.id === o.mealId);
  return (meal?.price ?? 0) * o.qty;
}

/** نصيب الموظف الواحد من الطلب (يقسّم بالتساوي على المشاركين) */
export function shareOf(o: Order, meals: Meal[]) {
  const n = o.participants.length || 1;
  return Math.round((orderTotal(o, meals) / n) * 100) / 100;
}

export function monthOrders(orders: Order[], month: string) {
  return orders.filter((o) => monthOf(o.date) === month);
}

export function employeeShare(orders: Order[], meals: Meal[], employeeId: string) {
  return orders
    .filter((o) => o.participants.includes(employeeId))
    .reduce((t, o) => t + shareOf(o, meals), 0);
}

export function daysInMonth(month: string) {
  const [y = 0, m = 1] = month.split("-").map(Number);
  const count = new Date(y, m, 0).getDate();
  return Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
}

export const arabicMonth = (month: string) => {
  const [y = 0, m = 1] = month.split("-").map(Number);
  const names = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];
  return `${names[m - 1] ?? ""} ${y}`;
};

export const dmy = (iso: string) => iso.split("-").reverse().join("/");
