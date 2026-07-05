"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ActivityStatus, Asset, AssetFileType, PrepDetails } from "@/lib/types";
import { ActivityWithType, PREP_FIELDS, hasContent } from "@/lib/activityHelpers";

type View = "calendar" | "planning" | "library" | "settings";

const VIEW_LABELS: Record<View, string> = {
  calendar: "July content calendar",
  planning: "Planning",
  library: "Library",
  settings: "Settings",
};

const DEFAULT_WEEK_KEY = "dashboard:defaultWeek";
const COMPACT_CARDS_KEY = "dashboard:compactCards";

const STATUS_COLUMNS: { key: ActivityStatus; label: string; color: string }[] = [
  { key: "drafting", label: "Drafting", color: "var(--outline-variant)" },
  { key: "in_review", label: "In Review", color: "var(--status-pending)" },
  { key: "scheduled", label: "Scheduled", color: "var(--status-complete)" },
  { key: "published", label: "Published", color: "var(--primary)" },
];

const ASSET_FILTERS: { key: "all" | AssetFileType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "image", label: "Images" },
  { key: "video", label: "Videos" },
  { key: "template", label: "Templates" },
  { key: "other", label: "Other" },
];

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityWithType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [weekFilter, setWeekFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [view, setView] = useState<View>("calendar");
  const [compactCards, setCompactCards] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    week: "",
    date: "",
    day: "",
    posting_type: "",
    locations: "",
    classes: "",
    status: "drafting" as ActivityStatus,
  });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [assetFilter, setAssetFilter] = useState<"all" | AssetFileType>("all");
  const [uploading, setUploading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const assetFileInputRef = useRef<HTMLInputElement>(null);

  async function loadActivities() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/activities", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Could not load activities.");
      }
      const json = await res.json();
      setActivities(json.activities || []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load activities.";
      setLoadError(message);
    }
    setLoading(false);
  }

  async function loadAssets() {
    setAssetsLoading(true);
    setAssetsError(null);
    try {
      const res = await fetch("/api/assets", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Could not load assets.");
      }
      const json = await res.json();
      setAssets(json.assets || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load assets.";
      setAssetsError(message);
    }
    setAssetsLoading(false);
  }

  useEffect(() => {
    loadActivities();
    loadAssets();
  }, []);

  useEffect(() => {
    const storedWeek = localStorage.getItem(DEFAULT_WEEK_KEY);
    if (storedWeek) setWeekFilter(storedWeek);
    const storedCompact = localStorage.getItem(COMPACT_CARDS_KEY);
    if (storedCompact === "1") setCompactCards(true);
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

  function getStatusLabel(a: ActivityWithType) {
    const prep = a.activity_types?.prep_details?.[0];
    return hasContent(prep) ? "Details added" : "No details";
  }

  function openDetail(a: ActivityWithType) {
    router.push(`/activity/${a.id}`);
  }

  async function changeStatus(a: ActivityWithType, status: ActivityStatus) {
    setLoadError(null);
    try {
      const res = await fetch(`/api/activities/${a.id}`, {
        method: "PATCH",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Could not update status.");
      }
      await loadActivities();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update status.";
      setLoadError(message);
    }
  }

  async function handleAssetUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setAssetsError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/assets", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Could not upload asset.");
      }
      await loadAssets();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not upload asset.";
      setAssetsError(message);
    }
    setUploading(false);
    if (assetFileInputRef.current) assetFileInputRef.current.value = "";
  }

  async function deleteAsset(asset: Asset) {
    const confirmed = window.confirm(`Delete "${asset.name}"? This cannot be undone.`);
    if (!confirmed) return;
    setAssetsError(null);
    try {
      const res = await fetch(`/api/assets/${asset.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Could not delete asset.");
      }
      await loadAssets();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not delete asset.";
      setAssetsError(message);
    }
  }

  function focusSearch() {
    searchInputRef.current?.focus();
    searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function updateDefaultWeek(w: string) {
    setWeekFilter(w);
    localStorage.setItem(DEFAULT_WEEK_KEY, w);
  }

  function toggleCompactCards() {
    setCompactCards((v) => {
      const next = !v;
      localStorage.setItem(COMPACT_CARDS_KEY, next ? "1" : "0");
      return next;
    });
  }

  function resetFilters() {
    setSearch("");
    setWeekFilter("all");
    localStorage.setItem(DEFAULT_WEEK_KEY, "all");
  }

  async function submitAddActivity(e: FormEvent) {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.week.trim() || !addForm.date.trim() || !addForm.day.trim()) {
      setAddError("Activity name, week, date, and day are required.");
      return;
    }
    setAddSaving(true);
    setAddError(null);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Could not add activity.");
      }

      setShowAddModal(false);
      setAddForm({
        name: "",
        week: "",
        date: "",
        day: "",
        posting_type: "",
        locations: "",
        classes: "",
        status: "drafting",
      });
      await loadActivities();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not add activity.";
      setAddError(message);
    }
    setAddSaving(false);
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar" aria-label="Primary">
        <div className="sidebar-brand">
          <span className="brand-icon">calendar_month</span>
          <h1>Chronos</h1>
        </div>
        <nav className="sidebar-nav">
          <button
            type="button"
            className={`sidebar-link ${view === "calendar" ? "active" : ""}`}
            onClick={() => setView("calendar")}
          >
            <span className="nav-icon">event_note</span>
            <span>Calendar</span>
          </button>
          <button
            type="button"
            className={`sidebar-link ${view === "planning" ? "active" : ""}`}
            onClick={() => setView("planning")}
          >
            <span className="nav-icon">edit_calendar</span>
            <span>Planning</span>
          </button>
          <button
            type="button"
            className={`sidebar-link ${view === "library" ? "active" : ""}`}
            onClick={() => setView("library")}
          >
            <span className="nav-icon">folder_copy</span>
            <span>Library</span>
          </button>
          <button
            type="button"
            className={`sidebar-link ${view === "settings" ? "active" : ""}`}
            onClick={() => setView("settings")}
          >
            <span className="nav-icon">settings</span>
            <span>Settings</span>
          </button>
        </nav>
        <div className="sidebar-profile">
          <div className="avatar">JD</div>
          <div className="sidebar-profile-copy">
            <p className="profile-name">Jane Doe</p>
            <p className="profile-role">Admin</p>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="hero">
          <div className="hero-title">
            <span className="title-icon">calendar_month</span>
            <h1>{VIEW_LABELS[view]}</h1>
          </div>
          {view === "calendar" && (
            <button
              type="button"
              className="header-action"
              aria-label="Search"
              onClick={focusSearch}
            >
              search
            </button>
          )}
        </header>

        <header className="desktop-header">
          <div className="desktop-header-left">
            <h2>{VIEW_LABELS[view]}</h2>
            {view === "calendar" && (
              <>
                <span className="header-divider" />
                <div className="header-stats">
                  <div className="header-stat">
                    <span className="header-stat-label">Total activities</span>
                    <span className="header-stat-num">{activities.length}</span>
                  </div>
                  <div className="header-stat">
                    <span className="header-stat-label">Completion</span>
                    <span className="header-stat-num">
                      {detailedTypeIds.size}/{uniqueTypeIds.size}{" "}
                      <span className="header-stat-suffix">detailed</span>
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          {view === "calendar" && (
            <div className="desktop-header-right">
              <label className="desktop-search">
                <span className="search-icon">search</span>
                <input
                  type="text"
                  placeholder="Search calendar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <div className="filter-wrap">
                <button
                  type="button"
                  className="filter-btn"
                  onClick={() => setFilterOpen((v) => !v)}
                >
                  <span className="filter-icon">filter_list</span>
                  <span>{weekFilter === "all" ? "Filter" : weekFilter}</span>
                </button>
                {filterOpen && (
                  <div className="filter-popover">
                    <button
                      type="button"
                      className={weekFilter === "all" ? "active" : ""}
                      onClick={() => {
                        setWeekFilter("all");
                        setFilterOpen(false);
                      }}
                    >
                      All weeks
                    </button>
                    {weeks.map((w) => (
                      <button
                        key={w}
                        type="button"
                        className={weekFilter === w ? "active" : ""}
                        onClick={() => {
                          setWeekFilter(w);
                          setFilterOpen(false);
                        }}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="add-activity-btn"
                onClick={() => setShowAddModal(true)}
              >
                <span className="filter-icon">add</span>
                <span>Add Activity</span>
              </button>
            </div>
          )}
        </header>

        <main className="wrap">
        {view === "calendar" && (
          <>
        <section className="stats-grid" aria-label="Dashboard statistics">
          <div className="stat-card">
            <p className="stat-num">{activities.length}</p>
            <p className="stat-label">activities</p>
          </div>
          <div className="stat-card">
            <p className="stat-num">
              {detailedTypeIds.size}/{uniqueTypeIds.size}
            </p>
            <p className="stat-label">with details</p>
          </div>
        </section>

        <section className="controls" aria-label="Filters">
          <label className="search-wrap">
            <span className="search-icon">search</span>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search activity, class, or location"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <label className="week-wrap">
            <select value={weekFilter} onChange={(e) => setWeekFilter(e.target.value)}>
              <option value="all">All weeks</option>
              {weeks.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
            <span className="select-icon">expand_more</span>
          </label>
        </section>

        {loadError && <div className="error-banner">{loadError}</div>}

        {loading ? (
          <div className="loading">Loading activities...</div>
        ) : (
          <div className="weeks-stack">
            {weeks
              .filter((w) => filtered.some((a) => a.week === w))
              .map((w) => (
                <section className="week-block" key={w}>
                  <div className="week-heading-row">
                    <h2 className="week-label">{w}</h2>
                    <div className="week-divider" />
                  </div>
                  <div className={`card-stack ${compactCards ? "compact" : ""}`}>
                    {filtered
                      .filter((a) => a.week === w)
                      .map((a) => {
                        const prep = a.activity_types?.prep_details?.[0];
                        const status = getStatusLabel(a);
                        const statusClass =
                          status === "No details"
                            ? "none"
                            : "has";

                        return (
                          <article className={`card ${statusClass}`} key={a.id}>
                            <div className="card-head" onClick={() => openDetail(a)}>
                              <div className="card-copy">
                                <div className="card-top">
                                  <span className="date-chip">
                                    {a.date} · {a.day}
                                  </span>
                                  <span className={`badge ${statusClass}`}>{status}</span>
                                </div>
                                <h3 className="activity-name">{a.activity_types?.name}</h3>
                                <p className="activity-meta">
                                  {a.posting_type}
                                  {a.locations ? ` · ${a.locations}` : ""}
                                </p>
                                {a.classes && <div className="class-tag">{a.classes}</div>}
                              </div>
                              <button type="button" className="chevron" aria-label="View details">
                                chevron_right
                              </button>
                            </div>
                          </article>
                        );
                      })}
                  </div>
                </section>
              ))}
          </div>
        )}

        <p className="footer-note">
          Click any activity to view its shoot details. Data is synced with your
          marketing dashboard.
        </p>
          </>
        )}

        {view === "planning" && (
          <section className="planning-view">
            <div className="planning-header-row">
              <div>
                <h2 className="section-title">Content pipeline</h2>
                <p className="section-subtitle">
                  Activities grouped by production stage. Update the stage on any card to move
                  it across the board.
                </p>
              </div>
              <button
                type="button"
                className="add-activity-btn"
                onClick={() => setShowAddModal(true)}
              >
                <span className="icon-inline">add</span>
                <span>New Content</span>
              </button>
            </div>

            <div className="stat-row">
              {STATUS_COLUMNS.map((col) => (
                <div className="stat-row-item" key={col.key}>
                  <span className="stat-row-bar" style={{ background: col.color }} />
                  <div>
                    <p className="stat-row-label">{col.label}</p>
                    <p className="stat-row-value">
                      {activities.filter((a) => a.status === col.key).length}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="kanban-board">
              {STATUS_COLUMNS.map((col) => {
                const items = activities.filter((a) => a.status === col.key);
                return (
                  <div className="kanban-column" key={col.key}>
                    <div className="kanban-column-head">
                      <div className="planning-col-head-left">
                        <span className="kanban-dot" style={{ background: col.color }} />
                        <h3>{col.label}</h3>
                      </div>
                      <span className="col-count">{items.length}</span>
                    </div>
                    <div className="kanban-list">
                      {items.map((a) => (
                        <div
                          className="kanban-card"
                          key={a.id}
                          style={{ borderLeftColor: col.color }}
                        >
                          <button
                            type="button"
                            className="kanban-card-open"
                            onClick={() => openDetail(a)}
                          >
                            {a.posting_type && <span className="chip small">{a.posting_type}</span>}
                            <h4>{a.activity_types?.name || "Untitled"}</h4>
                            <p>{a.locations || a.classes || "No details yet"}</p>
                          </button>
                          <div className="kanban-card-footer">
                            <span className="kanban-card-date">
                              <span className="icon-inline">event</span>
                              {a.date}
                            </span>
                            <select
                              className="kanban-status-select"
                              value={a.status}
                              onChange={(e) => changeStatus(a, e.target.value as ActivityStatus)}
                              aria-label={`Change status for ${a.activity_types?.name || "activity"}`}
                            >
                              {STATUS_COLUMNS.map((s) => (
                                <option key={s.key} value={s.key}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                      {items.length === 0 && (
                        <p className="empty-note">No content here yet.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {view === "library" && (
          <section className="library-view">
            <div className="planning-header-row">
              <div>
                <h2 className="section-title">Asset library</h2>
                <p className="section-subtitle">
                  Images, videos, and templates uploaded for your content.
                </p>
              </div>
              <button
                type="button"
                className="add-activity-btn"
                onClick={() => assetFileInputRef.current?.click()}
                disabled={uploading}
              >
                <span className="icon-inline">upload</span>
                <span>{uploading ? "Uploading…" : "Upload"}</span>
              </button>
              <input
                ref={assetFileInputRef}
                type="file"
                accept="image/*,video/*,.pdf,.ppt,.pptx,.doc,.docx"
                style={{ display: "none" }}
                onChange={handleAssetUpload}
              />
            </div>

            <div className="library-filter-row">
              {ASSET_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`library-filter-chip ${assetFilter === f.key ? "active" : ""}`}
                  onClick={() => setAssetFilter(f.key)}
                >
                  {f.label} (
                  {f.key === "all"
                    ? assets.length
                    : assets.filter((a) => a.file_type === f.key).length}
                  )
                </button>
              ))}
            </div>

            {assetsError && <div className="error-banner">{assetsError}</div>}

            {assetsLoading ? (
              <div className="loading">Loading assets…</div>
            ) : (
              <div className="asset-grid">
                {assets
                  .filter((a) => assetFilter === "all" || a.file_type === assetFilter)
                  .map((a) => (
                    <div className="asset-card" key={a.id}>
                      <div className="asset-thumb">
                        {a.file_type === "image" ? (
                          <img src={a.url} alt={a.name} />
                        ) : a.file_type === "video" ? (
                          <>
                            <video src={a.url} muted />
                            <span className="asset-play icon-inline">play_circle</span>
                          </>
                        ) : (
                          <span className="asset-file-icon icon-inline">description</span>
                        )}
                      </div>
                      <div className="asset-meta">
                        <p className="asset-name" title={a.name}>
                          {a.name}
                        </p>
                        <p className="asset-sub">
                          {formatBytes(a.size_bytes)} ·{" "}
                          {new Date(a.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="asset-delete"
                        aria-label={`Delete ${a.name}`}
                        onClick={() => deleteAsset(a)}
                      >
                        <span className="icon-inline">delete</span>
                      </button>
                    </div>
                  ))}
                {assets.length === 0 && (
                  <p className="empty-note">No assets uploaded yet.</p>
                )}
              </div>
            )}
          </section>
        )}

        {view === "settings" && (
          <section className="settings-view">
            <h2 className="section-title">Settings</h2>
            <p className="section-subtitle">Preferences for how the calendar behaves for you.</p>
            <div className="settings-card">
              <div className="settings-section">
                <h3 className="settings-section-title">Preferences</h3>
                <p className="settings-section-desc">
                  These are saved on this device and applied whenever you open the dashboard.
                </p>
                <div className="settings-field">
                  <label htmlFor="default-week">Default week filter</label>
                  <select
                    id="default-week"
                    value={weekFilter}
                    onChange={(e) => updateDefaultWeek(e.target.value)}
                  >
                    <option value="all">All weeks</option>
                    {weeks.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="settings-row">
                  <div>
                    <p className="settings-row-title">Compact card layout</p>
                    <p className="settings-row-desc">Tighter spacing for the calendar cards.</p>
                  </div>
                  <button
                    type="button"
                    className={`switch ${compactCards ? "on" : ""}`}
                    onClick={toggleCompactCards}
                    aria-pressed={compactCards}
                  >
                    <span className="switch-knob" />
                  </button>
                </div>
              </div>
              <div className="settings-section">
                <h3 className="settings-section-title">Reset</h3>
                <p className="settings-section-desc">
                  Clear the current search text and week filter for the calendar view.
                </p>
                <button type="button" className="ghost" onClick={resetFilters}>
                  Reset search &amp; week filter
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
      </div>

      <nav className="mobile-nav" aria-label="Primary">
        <button
          type="button"
          className={view === "calendar" ? "active" : ""}
          onClick={() => setView("calendar")}
        >
          <span className="nav-icon">event_note</span>
          <span>Calendar</span>
        </button>
        <button
          type="button"
          className={view === "planning" ? "active" : ""}
          onClick={() => setView("planning")}
        >
          <span className="nav-icon">edit_calendar</span>
          <span>Planning</span>
        </button>
        <button
          type="button"
          className={view === "library" ? "active" : ""}
          onClick={() => setView("library")}
        >
          <span className="nav-icon">folder_copy</span>
          <span>Library</span>
        </button>
        <button
          type="button"
          className={view === "settings" ? "active" : ""}
          onClick={() => setView("settings")}
        >
          <span className="nav-icon">settings</span>
          <span>Settings</span>
        </button>
      </nav>

      {view === "calendar" && (
        <button
          type="button"
          className="fab"
          aria-label="Add activity"
          onClick={() => setShowAddModal(true)}
        >
          add
        </button>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add activity</h2>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={() => setShowAddModal(false)}
              >
                close
              </button>
            </div>
            <form onSubmit={submitAddActivity}>
              <div className="form-field">
                <div className="form-label">Activity name</div>
                <input
                  className="text-input"
                  value={addForm.name}
                  onChange={(e) => setAddForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder="e.g. Beach Party Reel"
                />
              </div>
              <div className="form-grid">
                <div className="form-field">
                  <div className="form-label">Week</div>
                  <input
                    className="text-input"
                    value={addForm.week}
                    onChange={(e) => setAddForm((s) => ({ ...s, week: e.target.value }))}
                    placeholder="Week 1"
                  />
                </div>
                <div className="form-field">
                  <div className="form-label">Date</div>
                  <input
                    className="text-input"
                    value={addForm.date}
                    onChange={(e) => setAddForm((s) => ({ ...s, date: e.target.value }))}
                    placeholder="5 Jul"
                  />
                </div>
                <div className="form-field">
                  <div className="form-label">Day</div>
                  <input
                    className="text-input"
                    value={addForm.day}
                    onChange={(e) => setAddForm((s) => ({ ...s, day: e.target.value }))}
                    placeholder="Sun"
                  />
                </div>
              </div>
              <div className="form-field">
                <div className="form-label">Posting type</div>
                <input
                  className="text-input"
                  value={addForm.posting_type}
                  onChange={(e) => setAddForm((s) => ({ ...s, posting_type: e.target.value }))}
                  placeholder="Reel, Post, Story..."
                />
              </div>
              <div className="form-field">
                <div className="form-label">Locations</div>
                <input
                  className="text-input"
                  value={addForm.locations}
                  onChange={(e) => setAddForm((s) => ({ ...s, locations: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <div className="form-label">Classes</div>
                <input
                  className="text-input"
                  value={addForm.classes}
                  onChange={(e) => setAddForm((s) => ({ ...s, classes: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <div className="form-label">Stage</div>
                <select
                  className="text-input"
                  value={addForm.status}
                  onChange={(e) =>
                    setAddForm((s) => ({ ...s, status: e.target.value as ActivityStatus }))
                  }
                >
                  {STATUS_COLUMNS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              {addError && <div className="error-banner">{addError}</div>}
              <div className="form-actions">
                <button type="submit" disabled={addSaving}>
                  {addSaving ? "Adding..." : "Add activity"}
                </button>
                <button type="button" className="ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
