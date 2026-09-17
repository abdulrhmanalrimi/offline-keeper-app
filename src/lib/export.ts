import * as XLSX from "xlsx";
import {
  arabicMonth,
  daysInMonth,
  dmy,
  monthOrders,
  orderTotal,
  shareOf,
  type AppData,
  type Order,
} from "./store";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function rtl(ws: XLSX.WorkSheet) {
  ws["!views"] = [{ RTL: true }];
  return ws;
}

const invoiceNo = (o: Order, idx: number) =>
  `INV-${o.date.replaceAll("-", "")}-${String(idx + 1).padStart(3, "0")}`;

/** كشف الشهر: صف لكل موظف وعمود لكل يوم + الإجمالي */
export function exportMonthlyXlsx(data: AppData, month: string) {
  const { employees, meals, orders } = data;
  const list = monthOrders(orders, month).sort((a, b) => a.date.localeCompare(b.date));
  const days = daysInMonth(month);

  const header = ["الموظف", ...days.map(dmy), "الاجمالي", "الخصم الشهري", "صافي المستحق"];
  const rows = employees.map((e) => {
    const perDay = days.map((d) =>
      list
        .filter((o) => o.date === d && o.participants.includes(e.id))
        .reduce((t, o) => t + shareOf(o, meals), 0),
    );
    const total = perDay.reduce((a, b) => a + b, 0);
    const discount = e.discount ?? 0;
    return [e.name, ...perDay.map((v) => Math.round(v * 100) / 100), Math.round(total * 100) / 100, discount, Math.round((total - discount) * 100) / 100];
  });

  const totalsRow = [
    "الإجمالي العام",
    ...days.map((_, i) => rows.reduce((t, r) => t + Number(r[i + 1] || 0), 0)),
    rows.reduce((t, r) => t + Number(r[days.length + 1] || 0), 0),
    rows.reduce((t, r) => t + Number(r[days.length + 2] || 0), 0),
    rows.reduce((t, r) => t + Number(r[days.length + 3] || 0), 0),
  ];

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows, totalsRow]);
  ws["!cols"] = [{ wch: 30 }, ...days.map(() => ({ wch: 11 })), { wch: 12 }, { wch: 12 }, { wch: 14 }];
  ws["!freeze"] = { xSplit: 1, ySplit: 1 };
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: header.length - 1 } }) };
  rtl(ws);

  const detailHeader = [
    "رقم الفاتورة",
    "التاريخ",
    "الوجبة",
    "الكمية",
    "قيمة الوجبة",
    "عدد المشاركين",
    "نصيب المشارك",
    "المشاركون",
    "ملاحظة",
  ];
  const detailRows = list.map((o, i) => [
    invoiceNo(o, i),
    dmy(o.date),
    meals.find((m) => m.id === o.mealId)?.name ?? "—",
    o.qty,
    orderTotal(o, meals),
    o.participants.length,
    shareOf(o, meals),
    o.participants.map((id) => employees.find((e) => e.id === id)?.name ?? "—").join("، "),
    o.note ?? "",
  ]);
  const ws2 = XLSX.utils.aoa_to_sheet([detailHeader, ...detailRows]);
  ws2["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 50 }, { wch: 20 }];
  rtl(ws2);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `كشف ${month.replace("-", "_")}`);
  XLSX.utils.book_append_sheet(wb, ws2, "تفاصيل الطلبات");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  download(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `كشف-حساب-${month}.xlsx`);
}

/** كشف موظف مفصل بصيغة Excel */
export function exportEmployeeXlsx(data: AppData, month: string, employeeId: string) {
  const { employees, meals, orders } = data;
  const emp = employees.find((e) => e.id === employeeId);
  if (!emp) return;
  const list = monthOrders(orders, month)
    .filter((o) => o.participants.includes(employeeId))
    .sort((a, b) => a.date.localeCompare(b.date));
  const total = list.reduce((t, o) => t + shareOf(o, meals), 0);
  const discount = emp.discount ?? 0;

  const aoa: (string | number)[][] = [
    ["كشف حساب موظف مفصل"],
    ["اسم الموظف", emp.name],
    ["الشهر", arabicMonth(month)],
    ["إجمالي نصيب الوجبات", Math.round(total * 100) / 100],
    ["الخصم الشهري", discount],
    ["صافي المستحق", Math.round((total - discount) * 100) / 100],
    [],
    ["رقم الفاتورة", "التاريخ", "الوجبة", "الكمية", "قيمة الوجبة", "نصيب الموظف"],
    ...list.map((o, i) => [
      invoiceNo(o, i),
      dmy(o.date),
      meals.find((m) => m.id === o.mealId)?.name ?? "—",
      o.qty,
      orderTotal(o, meals),
      shareOf(o, meals),
    ]),
  ];
  const ws = rtl(XLSX.utils.aoa_to_sheet(aoa));
  ws["!cols"] = [{ wch: 22 }, { wch: 26 }, { wch: 18 }, { wch: 10 }, { wch: 12 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "كشف الموظف");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  download(
    new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `كشف-${emp.name.replaceAll(" ", "_")}-${month}.xlsx`,
  );
}

const htmlShell = (title: string, body: string) => `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8" />
<title>${title}</title>
<style>
  @page { size: A4; margin: 14mm; }
  body { font-family: "Cairo", "Tahoma", sans-serif; color:#17201d; margin:0; padding:24px; background:#fff; }
  h1 { font-size:20px; margin:0 0 4px; }
  .muted { color:#6b7a74; font-size:12px; }
  .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #17201d; padding-bottom:12px; margin-bottom:16px; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th, td { border:1px solid #cfd8d3; padding:7px 9px; text-align:right; }
  thead th { background:#17201d; color:#fff; font-weight:600; }
  tbody tr:nth-child(even) { background:#f6f7f5; }
  .totals { margin-top:16px; display:flex; justify-content:flex-start; gap:24px; font-weight:700; background:#f2efe9; padding:12px 16px; border-radius:10px; }
  .accent { color:#d9743f; }
  @media print { .no-print { display:none } }
</style></head>
<body>${body}
<p class="muted" style="margin-top:28px">تم الإنشاء محليًا من نظام بوفيه يدكو</p>
<button class="no-print" onclick="window.print()" style="margin-top:12px;padding:8px 18px;border:0;border-radius:8px;background:#d9743f;color:#fff;font:inherit;cursor:pointer">طباعة</button>
</body></html>`;

export function employeeInvoiceHtml(data: AppData, month: string, employeeId: string) {
  const { employees, meals, orders } = data;
  const emp = employees.find((e) => e.id === employeeId);
  if (!emp) return "";
  const cur = data.settings.currency;
  const list = monthOrders(orders, month)
    .filter((o) => o.participants.includes(employeeId))
    .sort((a, b) => a.date.localeCompare(b.date));
  const total = list.reduce((t, o) => t + shareOf(o, meals), 0);
  const discount = emp.discount ?? 0;
  const rows = list
    .map(
      (o, i) => `<tr><td>${invoiceNo(o, i)}</td><td>${dmy(o.date)}</td><td>${
        meals.find((m) => m.id === o.mealId)?.name ?? "—"
      }</td><td>${o.qty}</td><td>${orderTotal(o, meals)}</td><td>${o.participants.length}</td><td>${shareOf(
        o,
        meals,
      )}</td></tr>`,
    )
    .join("");

  return htmlShell(
    `كشف ${emp.name} - ${month}`,
    `<div class="head">
      <div><h1>${data.settings.shopName}</h1><p class="muted">كشف حساب موظف مفصل — ${arabicMonth(month)}</p></div>
      <div style="text-align:left"><strong>${emp.name}</strong><p class="muted">${emp.dept}</p></div>
    </div>
    <table><thead><tr><th>رقم الفاتورة</th><th>التاريخ</th><th>الوجبة</th><th>الكمية</th><th>قيمة الوجبة</th><th>عدد المشاركين</th><th>نصيب الموظف</th></tr></thead>
    <tbody>${rows || `<tr><td colspan="7">لا توجد طلبات في هذا الشهر</td></tr>`}</tbody></table>
    <div class="totals"><span>إجمالي نصيب الوجبات: ${Math.round(total * 100) / 100} ${cur}</span>
    <span>الخصم الشهري: ${discount} ${cur}</span>
    <span class="accent">صافي المستحق: ${Math.round((total - discount) * 100) / 100} ${cur}</span></div>`,
  );
}

export function monthlyStatementHtml(data: AppData, month: string) {
  const { employees, meals, orders } = data;
  const cur = data.settings.currency;
  const days = daysInMonth(month);
  const list = monthOrders(orders, month);
  const activeDays = days.filter((d) => list.some((o) => o.date === d));
  const cols = activeDays.length ? activeDays : days.slice(0, 0);

  const body = employees
    .map((e) => {
      const per = cols.map((d) =>
        list.filter((o) => o.date === d && o.participants.includes(e.id)).reduce((t, o) => t + shareOf(o, meals), 0),
      );
      const total = per.reduce((a, b) => a + b, 0);
      const discount = e.discount ?? 0;
      return `<tr><td>${e.name}</td>${per
        .map((v) => `<td>${v ? Math.round(v * 100) / 100 : "-"}</td>`)
        .join("")}<td><strong>${Math.round(total * 100) / 100}</strong></td><td>${discount}</td><td><strong>${
        Math.round((total - discount) * 100) / 100
      }</strong></td></tr>`;
    })
    .join("");

  return htmlShell(
    `كشف حساب ${month}`,
    `<div class="head"><div><h1>${data.settings.shopName}</h1>
      <p class="muted">كشف حساب الشهر — ${arabicMonth(month)} (${cur})</p></div></div>
     <table><thead><tr><th>الموظف</th>${cols
       .map((d) => `<th>${dmy(d)}</th>`)
       .join("")}<th>الاجمالي</th><th>الخصم</th><th>الصافي</th></tr></thead><tbody>${body}</tbody></table>`,
  );
}

export function printHtml(html: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

export function downloadHtml(html: string, filename: string) {
  download(new Blob([html], { type: "text/html;charset=utf-8" }), filename);
}
