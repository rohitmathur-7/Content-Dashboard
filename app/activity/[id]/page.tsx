"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { PrepDetails } from "@/lib/types";
import { ActivityWithType, PREP_FIELDS, hasContent, linkify } from "@/lib/activityHelpers";

export default function ActivityDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [activity, setActivity] = useState<ActivityWithType | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/activities/${id}`, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Could not load activity.");
      }
      const json = await res.json();
      setActivity(json.activity);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load activity.";
      setLoadError(message);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function startEdit() {
    if (!activity) return;
    const prep = activity.activity_types?.prep_details?.[0];
    const initial: Record<string, string> = {};
    PREP_FIELDS.forEach(({ key }) => {
      initial[key] = (prep?.[key] as string) || "";
    });
    setFormState(initial);
    setEditing(true);
  }

  async function saveDetails() {
    if (!activity) return;
    setSaving(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/prep-details", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity_type_id: activity.activity_type_id, ...formState }),
      });

      if (!res.ok) {
        throw new Error("Could not save details.");
      }

      setEditing(false);
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save details.";
      setLoadError(message);
    }
    setSaving(false);
  }

  async function deleteActivity() {
    if (!activity) return;
    const confirmed = window.confirm(
      `Delete "${activity.activity_types?.name}" on ${activity.date}? This only removes this dated instance.`
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/activities/${activity.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Could not delete activity.");
      }
      router.push("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not delete activity.";
      setLoadError(message);
    }
    setDeleting(false);
  }

  if (loading) {
    return (
      <div className="activity-page">
        <div className="activity-page-topbar">
          <button type="button" className="activity-page-back" onClick={() => router.back()}>
            <span className="icon-inline">arrow_back</span> Back
          </button>
        </div>
        <p className="loading">Loading activity…</p>
      </div>
    );
  }

  if (loadError && !activity) {
    return (
      <div className="activity-page">
        <div className="activity-page-topbar">
          <button type="button" className="activity-page-back" onClick={() => router.back()}>
            <span className="icon-inline">arrow_back</span> Back
          </button>
        </div>
        <div className="error-banner">{loadError}</div>
      </div>
    );
  }

  if (!activity) return null;

  const prep = activity.activity_types?.prep_details?.[0];
  const hasPrep = hasContent(prep);

  return (
    <div className="activity-page">
      <div className="activity-page-topbar">
        <button type="button" className="activity-page-back" onClick={() => router.back()}>
          <span className="icon-inline">arrow_back</span> Back
        </button>
      </div>

      <div className="activity-page-card">
        <div className="activity-modal-hero">
          <span className="activity-modal-badge">{activity.posting_type || "Activity"}</span>
          <h1 className="activity-modal-title">{activity.activity_types?.name}</h1>
          <p className="activity-modal-subtitle">
            {activity.date} · {activity.day} · {activity.week}
          </p>
        </div>

        <div className="activity-modal-content">
          {!editing && (
            <>
              <div className="activity-modal-section">
                <h4 className="activity-modal-section-title">
                  <span className="icon-inline">campaign</span> Posting &amp; audience
                </h4>
                <div className="chip-row">
                  {activity.posting_type && <span className="chip">{activity.posting_type}</span>}
                  {activity.classes && <span className="chip">{activity.classes}</span>}
                  {activity.locations && <span className="chip">{activity.locations}</span>}
                  {!activity.posting_type && !activity.classes && !activity.locations && (
                    <p className="activity-modal-empty">No posting details added.</p>
                  )}
                </div>
              </div>

              <div className="activity-modal-section">
                <h4 className="activity-modal-section-title">
                  <span className="icon-inline">groups</span> Production checklist
                </h4>
                {prep?.shooters || prep?.equipment || prep?.kids ? (
                  <div className="activity-modal-list-card">
                    {prep?.shooters && (
                      <div className="activity-modal-list-group">
                        <h4>
                          <span className="icon-inline">person</span> Shooters
                        </h4>
                        <ul>
                          {prep.shooters
                            .split(/\n|,/)
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                        </ul>
                      </div>
                    )}
                    {prep?.equipment && (
                      <div className="activity-modal-list-group">
                        <h4>
                          <span className="icon-inline">videocam</span> Equipment
                        </h4>
                        <ul>
                          {prep.equipment
                            .split(/\n|,/)
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                        </ul>
                      </div>
                    )}
                    {prep?.kids && (
                      <div className="activity-modal-list-group">
                        <h4>
                          <span className="icon-inline">face</span> Kids
                        </h4>
                        <ul>
                          {prep.kids
                            .split(/\n|,/)
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="activity-modal-empty">No crew or equipment details yet.</p>
                )}
              </div>

              <div className="activity-modal-section">
                <h4 className="activity-modal-section-title">
                  <span className="icon-inline">description</span> Content plan
                </h4>
                {prep?.content_type ||
                prep?.reference_links ||
                prep?.shoot_locations ||
                prep?.schedule_date ||
                prep?.edit_start_date ? (
                  <div className="activity-modal-grid">
                    {(
                      [
                        ["content_type", "Content type"],
                        ["reference_links", "Reference links"],
                        ["shoot_locations", "Shoot locations"],
                        ["schedule_date", "Schedule shoot date"],
                        ["edit_start_date", "Edit start date"],
                      ] as [keyof PrepDetails, string][]
                    ).map(([key, label]) => {
                      const val = prep?.[key] as string | null;
                      if (!val) return null;
                      return (
                        <div key={key}>
                          <p className="activity-modal-field-label">{label}</p>
                          <p className="activity-modal-field-val">{linkify(val)}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="activity-modal-empty">No content plan added yet.</p>
                )}
              </div>

              <div className="activity-modal-section">
                <h4 className="activity-modal-section-title">
                  <span className="icon-inline">notes</span> Notes
                </h4>
                {prep?.script || prep?.edit_log ? (
                  <div className="activity-modal-grid">
                    {prep?.script && (
                      <div>
                        <p className="activity-modal-field-label">Script / shotlist</p>
                        <p className="activity-modal-field-val">{linkify(prep.script)}</p>
                      </div>
                    )}
                    {prep?.edit_log && (
                      <div>
                        <p className="activity-modal-field-label">Edit log</p>
                        <p className="activity-modal-field-val">{linkify(prep.edit_log)}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="activity-modal-empty">No notes added yet.</p>
                )}
              </div>

              {loadError && <div className="error-banner">{loadError}</div>}

              <button
                type="button"
                className="btn-danger-text"
                disabled={deleting}
                onClick={deleteActivity}
              >
                <span className="icon-inline">delete</span>
                {deleting ? "Deleting..." : "Delete this dated activity"}
              </button>
            </>
          )}

          {editing && (
            <div className="activity-modal-section">
              <p className="empty-note" style={{ marginBottom: 14 }}>
                This sheet is shared across every date "{activity.activity_types?.name}" appears
                on.
              </p>
              {PREP_FIELDS.map(({ key, label }) => (
                <div className="form-field" key={key}>
                  <div className="form-label">{label}</div>
                  <textarea
                    rows={key === "script" ? 3 : 2}
                    value={formState[key] || ""}
                    onChange={(e) => setFormState((s) => ({ ...s, [key]: e.target.value }))}
                  />
                </div>
              ))}
              {loadError && <div className="error-banner">{loadError}</div>}
            </div>
          )}
        </div>

        <div className="activity-modal-footer">
          {editing ? (
            <>
              <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button type="button" disabled={saving} onClick={saveDetails}>
                {saving ? "Saving..." : "Save changes"}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-ghost" onClick={() => router.back()}>
                Close
              </button>
              <button type="button" onClick={startEdit}>
                {hasPrep ? "Edit details" : "Add details"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
