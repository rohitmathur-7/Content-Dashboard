import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_STATUSES = ["drafting", "in_review", "scheduled", "published"];

// Fetch a single dated activity instance with its joined type and prep details.
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Missing activity id." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("activities")
    .select("*, activity_types(*, prep_details(*))")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Activity not found." }, { status: 404 });
  }

  return NextResponse.json({ activity: data });
}

// Update an activity's pipeline status (Drafting / In review / Scheduled / Published).
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await request.json();
  const { status } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing activity id." }, { status: 400 });
  }

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("activities")
    .update({ status })
    .eq("id", id)
    .select("*, activity_types(*, prep_details(*))")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ activity: data });
}

// Delete a single dated activity instance (not the shared activity type/prep details).
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Missing activity id." }, { status: 400 });
  }

  const { error } = await supabase.from("activities").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
