import type { Activity, PrepDetails } from "@/lib/types";

export type ActivityWithType = Activity & {
  activity_types: { id: string; name: string; prep_details: PrepDetails[] | null } | null;
};

export const PREP_FIELDS: { key: keyof PrepDetails; label: string }[] = [
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

export function linkify(text: string) {
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

export function hasContent(prep: PrepDetails | null | undefined) {
  if (!prep) return false;
  return PREP_FIELDS.some(({ key }) => (prep[key] as string | null)?.trim());
}
