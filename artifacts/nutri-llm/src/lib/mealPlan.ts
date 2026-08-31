const KEY = "nutri_mealplan_v1";

export type WeekDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export const WEEK_DAYS: { key: WeekDay; label: string }[] = [
  { key: "mon", label: "Mon" }, { key: "tue", label: "Tue" }, { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" }, { key: "fri", label: "Fri" }, { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

export interface PlanSlot { recipeId: string; recipeName: string; }
export type WeekPlan = Record<WeekDay, PlanSlot[]>;
const EMPTY: WeekPlan = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };

export function loadPlan(): WeekPlan {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ...EMPTY };
    const out: WeekPlan = { ...EMPTY };
    (Object.keys(EMPTY) as WeekDay[]).forEach(d => { out[d] = Array.isArray(parsed[d]) ? parsed[d] : []; });
    return out;
  } catch { return { ...EMPTY }; }
}

function savePlan(plan: WeekPlan) { try { localStorage.setItem(KEY, JSON.stringify(plan)); } catch {} }

export function addToPlan(day: WeekDay, slot: PlanSlot): WeekPlan {
  const plan = loadPlan();
  plan[day] = [...plan[day], slot];
  savePlan(plan);
  return plan;
}

export function removeFromPlan(day: WeekDay, index: number): WeekPlan {
  const plan = loadPlan();
  plan[day] = plan[day].filter((_, i) => i !== index);
  savePlan(plan);
  return plan;
}

export function clearPlan(): WeekPlan { savePlan({ ...EMPTY }); return { ...EMPTY }; }
