import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const { data, error } = await supabase
    .from("activities")
    .select("*, activity_types(*, prep_details(*))")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(
    { activities: data },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}

// Create a new activity. Body: { name, week, date, day, posting_type?, locations?, classes? }
// Finds an existing activity type by (case-insensitive) name, or creates one, then
// inserts an activity row pointing at it.
const VALID_STATUSES = ["drafting", "in_review", "scheduled", "published"];

export async function POST(request: Request) {
  const body = await request.json();
  const { name, week, date, day, posting_type, locations, classes, status } = body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof week !== "string" ||
    !week.trim() ||
    typeof date !== "string" ||
    !date.trim() ||
    typeof day !== "string" ||
    !day.trim()
  ) {
    return NextResponse.json(
      { error: "name, week, date, and day are required." },
      { status: 400 }
    );
  }

  const trimmedName = name.trim();

  const { data: existingType, error: findError } = await supabase
    .from("activity_types")
    .select("id")
    .ilike("name", trimmedName)
    .maybeSingle();

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  let activityTypeId = existingType?.id as string | undefined;

  if (!activityTypeId) {
    const { data: newType, error: createTypeError } = await supabase
      .from("activity_types")
      .insert({ name: trimmedName })
      .select("id")
      .single();

    if (createTypeError) {
      return NextResponse.json({ error: createTypeError.message }, { status: 500 });
    }
    activityTypeId = newType.id;
  }

  const { data, error } = await supabase
    .from("activities")
    .insert({
      activity_type_id: activityTypeId,
      week: week.trim(),
      date: date.trim(),
      day: day.trim(),
      posting_type: posting_type?.trim() || null,
      locations: locations?.trim() || null,
      classes: classes?.trim() || null,
      status: VALID_STATUSES.includes(status) ? status : "drafting",
    })
    .select("*, activity_types(*, prep_details(*))")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ activity: data });
}

