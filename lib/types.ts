export interface ActivityType {
  id: string;
  name: string;
}

export interface Activity {
  id: string;
  activity_type_id: string;
  week: string;
  date: string;
  day: string;
  classes: string | null;
  posting_type: string | null;
  locations: string | null;
  reference_link: string | null;
  sort_order: number | null;
  activity_types: ActivityType | null; // joined
}

export interface PrepDetails {
  id: string;
  activity_type_id: string;
  content_type: string | null;
  reference_links: string | null;
  shoot_locations: string | null;
  kids: string | null;
  shooters: string | null;
  equipment: string | null;
  script: string | null;
  schedule_date: string | null;
  edit_start_date: string | null;
  edit_log: string | null;
  updated_at: string | null;
  updated_by: string | null;
}
