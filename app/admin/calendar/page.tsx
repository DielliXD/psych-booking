"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const PSYCHOLOGIST_ID = process.env.NEXT_PUBLIC_PSYCHOLOGIST_ID ?? "";
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Rule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface Exception {
  id: string;
  date: string;
  reason: string | null;
}

export default function AdminCalendarPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);

  // New rule form state
  const [newDay, setNewDay] = useState(1);
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("17:00");

  // New blocked date form state
  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");

  async function loadData() {
    setLoading(true);
    const [{ data: r }, { data: e }] = await Promise.all([
      supabase
        .from("availability_rules")
        .select("*")
        .eq("psychologist_id", PSYCHOLOGIST_ID)
        .order("day_of_week"),
      supabase
        .from("availability_exceptions")
        .select("*")
        .eq("psychologist_id", PSYCHOLOGIST_ID)
        .order("date"),
    ]);
    setRules(r ?? []);
    setExceptions(e ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function addRule() {
    await supabase.from("availability_rules").insert({
      psychologist_id: PSYCHOLOGIST_ID,
      day_of_week: newDay,
      start_time: newStart,
      end_time: newEnd,
    });
    loadData();
  }

  async function removeRule(id: string) {
    await supabase.from("availability_rules").delete().eq("id", id);
    loadData();
  }

  async function addException() {
    if (!blockDate) return;
    await supabase.from("availability_exceptions").insert({
      psychologist_id: PSYCHOLOGIST_ID,
      date: blockDate,
      reason: blockReason || null,
    });
    setBlockDate("");
    setBlockReason("");
    loadData();
  }

  async function removeException(id: string) {
    await supabase.from("availability_exceptions").delete().eq("id", id);
    loadData();
  }

  const inputClass =
    "rounded-lg border border-pine/15 dark:border-sage/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-pine dark:focus:border-sage";

  if (loading) return <p className="text-sm text-ink/50 dark:text-mist/50">Loading...</p>;

  return (
    <div className="space-y-16">
      <section>
        <h1 className="text-2xl mb-6 text-ink dark:text-mist">Weekly Availability</h1>

        <div className="space-y-2 mb-8">
          {rules.length === 0 && (
            <p className="text-sm text-ink/50 dark:text-mist/50">No weekly hours set yet — add one below.</p>
          )}
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between rounded-lg border border-pine/10 dark:border-sage/10 px-4 py-3 text-sm"
            >
              <span>
                {DAYS[rule.day_of_week]} · {rule.start_time.slice(0, 5)}–{rule.end_time.slice(0, 5)}
              </span>
              <button onClick={() => removeRule(rule.id)} className="text-clay text-xs hover:underline">
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-ink/50 dark:text-mist/50 mb-1">Day</label>
            <select value={newDay} onChange={(e) => setNewDay(Number(e.target.value))} className={inputClass}>
              {DAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink/50 dark:text-mist/50 mb-1">Start</label>
            <input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-ink/50 dark:text-mist/50 mb-1">End</label>
            <input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className={inputClass} />
          </div>
          <button
            onClick={addRule}
            className="rounded-full bg-pine text-linen dark:bg-sage dark:text-charcoalGreen px-5 py-2 text-sm font-medium hover:opacity-90"
          >
            Add
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-xl mb-6 text-ink dark:text-mist">Blocked Dates</h2>

        <div className="space-y-2 mb-8">
          {exceptions.length === 0 && (
            <p className="text-sm text-ink/50 dark:text-mist/50">No blocked dates.</p>
          )}
          {exceptions.map((exc) => (
            <div
              key={exc.id}
              className="flex items-center justify-between rounded-lg border border-pine/10 dark:border-sage/10 px-4 py-3 text-sm"
            >
              <span>
                {exc.date} {exc.reason ? `· ${exc.reason}` : ""}
              </span>
              <button onClick={() => removeException(exc.id)} className="text-clay text-xs hover:underline">
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-ink/50 dark:text-mist/50 mb-1">Date</label>
            <input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-ink/50 dark:text-mist/50 mb-1">Reason (optional)</label>
            <input
              type="text"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Vacation"
              className={inputClass}
            />
          </div>
          <button
            onClick={addException}
            className="rounded-full bg-pine text-linen dark:bg-sage dark:text-charcoalGreen px-5 py-2 text-sm font-medium hover:opacity-90"
          >
            Block
          </button>
        </div>
      </section>
    </div>
  );
}
