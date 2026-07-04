"use client";

import { useEffect, useMemo, useState } from "react";
import type { Activity, PrepDetails } from "@/lib/types";

type ActivityWithType = Activity & {
  activity_types: { id: string; name: string; prep_details: PrepDetails[] | null } | null;
};

const PREP_FIELDS: { key: keyof PrepDetails; label: string }[] = [
  { key: "content_type", label: "Content type" },
  { key: "reference_links", label: "Reference links" },
  { key: "shoot_locations", label: "Shoot locations" },
  { key: "kids", label: "Kids" },
  { key: "shooters", label: "Assigned shooters" },
  { key: "equipment", label: "Equipment" },
  { key: "script", label: "Script / shotlist" },
  { key: "schedule_date", label: "Schedule shoot date" },
  { key: "edit_start_date", label: "Edit start date" },
  { key: "edit_log", label: "Edit log" },
];

function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer">
        {part}
      </a>
    ) : (
      part
    )
  );
}

function hasContent(prep: PrepDetails | null | undefined) {
  if (!prep) return false;
  return PREP_FIELDS.some(({ key }) => (prep[key] as string | null)?.trim());
}

export default function DashboardPage() {
  const [activities, setActivities] = useState<ActivityWithType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [weekFilter, setWeekFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editTypeId, setEditTypeId] = useState<string | null>(null);
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function loadActivities() {
    setLoading(true);
    const res = await fetch("/api/activities", { cache: "no-store" });
    const json = await res.json();
    setActivities(json.activities || []);
    setLoading(false);
  }

  useEffect(() => {
    loadActivities();
  }, []);

  const weeks = useMemo(() => [...new Set(activities.map((a) => a.week))], [activities]);

  const filtered = activities.filter((a) => {
    const q = search.toLowerCase();
    const name = a.activity_types?.name || "";
    const matchQ =
      !q || `${name}${a.classes ?? ""}${a.locations ?? ""}`.toLowerCase().includes(q);
    const matchW = weekFilter === "all" || a.week === weekFilter;
    return matchQ && matchW;
  });

  const uniqueTypeIds = new Set(activities.map((a) => a.activity_type_id));
  const detailedTypeIds = new Set(
    activities
      .filter((a) => hasContent(a.activity_types?.prep_details?.[0]))
      .map((a) => a.activity_type_id)
  );

  function startEdit(a: ActivityWithType) {
    const prep = a.activity_types?.prep_details?.[0];
    const initial: Record<string, string> = {};
    PREP_FIELDS.forEach(({ key }) => {
      initial[key] = (prep?.[key] as string) || "";
    });
    setFormState(initial);
    setEditTypeId(a.activity_type_id);
  }

  async function saveDetails(a: ActivityWithType) {
    setSaving(true);
    await fetch("/api/prep-details", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activity_type_id: a.activity_type_id, ...formState }),
    });
    setSaving(false);
    setEditTypeId(null);
    await loadActivities();
  }

  return (
    <div className="wrap">
      <header>
        <div>
          <h1>July content calendar</h1>
          <div className="sub">
            Planner + shoot-prep details in one place — one prep sheet per activity type,
            shared across every date it repeats on
          </div>
        </div>
        <div className="stats">
          <div>
            <div className="stat-num">{activities.length}</div>activities
          </div>
          <div>
            <div className="stat-num">
              {detailedTypeIds.size} / {uniqueTypeIds.size}
            </div>
            types with details
          </div>
        </div>
      </header>

      <div className="controls">
        <input
          type="text"
          placeholder="Search activity, class, or location"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={weekFilter} onChange={(e) => setWeekFilter(e.target.value)}>
          <option value="all">All weeks</option>
          {weeks.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        weeks
          .filter((w) => filtered.some((a) => a.week === w))
          .map((w) => (
            <div className="week-block" key={w}>
              <div className="week-label">{w}</div>
              {filtered
                .filter((a) => a.week === w)
                .map((a) => {
                  const prep = a.activity_types?.prep_details?.[0];
                  const has = hasContent(prep);
                  const isOpen = openId === a.id;
                  const isEditing = editTypeId === a.activity_type_id && isOpen;
                  return (
                    <div className={`card ${isOpen ? "open" : ""}`} key={a.id}>
                      <div
                        className="card-head"
                        onClick={() => {
                          setOpenId(isOpen ? null : a.id);
                          setEditTypeId(null);
                        }}
                      >
                        <div className="date-chip">
                          {a.date} · {a.day}
                        </div>
                        <div className="activity-main">
                          <div className="activity-name">{a.activity_types?.name}</div>
                          <div className="activity-meta">
                            {a.posting_type}
                            {a.locations ? ` · ${a.locations}` : ""}
                          </div>
                        </div>
                        {a.classes && <div className="class-tag">{a.classes}</div>}
                        <div className={`badge ${has ? "has" : "none"}`}>
                          {has ? "Details added" : "No details"}
                        </div>
                        <div className="chevron">▾</div>
                      </div>

                      {isOpen && !isEditing && (
                        <div className="detail">
                          {has && (
                            <div className="empty-note" style={{ marginBottom: 14 }}>
                              Shared prep sheet — editing here updates it for every date
                              this activity appears on.
                            </div>
                          )}
                          {has ? (
                            <>
                              {PREP_FIELDS.map(({ key, label }) => {
                                const val = prep?.[key] as string | null;
                                if (!val) return null;
                                return (
                                  <div className="field" key={key}>
                                    <div className="field-label">{label}</div>
                                    <div className="field-val">{linkify(val)}</div>
                                  </div>
                                );
                              })}
                              <div className="form-actions">
                                <button
                                  className="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEdit(a);
                                  }}
                                >
                                  Edit details
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="empty-note">
                                No shoot details added yet for this activity type.
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEdit(a);
                                }}
                              >
                                Add shoot details
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {isOpen && isEditing && (
                        <div className="detail">
                          <div className="empty-note" style={{ marginBottom: 14 }}>
                            This sheet is shared across every date "{a.activity_types?.name}"
                            appears on.
                          </div>
                          {PREP_FIELDS.map(({ key, label }) => (
                            <div className="form-field" key={key}>
                              <div className="form-label">{label}</div>
                              <textarea
                                rows={key === "script" ? 3 : 2}
                                value={formState[key] || ""}
                                onChange={(e) =>
                                  setFormState((s) => ({ ...s, [key]: e.target.value }))
                                }
                              />
                            </div>
                          ))}
                          <div className="form-actions">
                            <button
                              disabled={saving}
                              onClick={(e) => {
                                e.stopPropagation();
                                saveDetails(a);
                              }}
                            >
                              {saving ? "Saving…" : "Save details"}
                            </button>
                            <button
                              className="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditTypeId(null);
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ))
      )}

      <div className="footer-note">
        Click any activity to view or add its shoot details. Prep sheets are shared by
        activity type — update once, it applies everywhere that activity appears.
      </div>
    </div>
  );
}
