import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Upsert prep details for one activity TYPE (shared across every dated
// instance of that activity). Body: { activity_type_id, ...fields, updated_by }
export async function POST(request: Request) {
  const body = await request.json();
  const { activity_type_id, ...fields } = body;

  if (!activity_type_id) {
    return NextResponse.json(
      { error: "activity_type_id is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("prep_details")
    .upsert(
      { activity_type_id, ...fields, updated_at: new Date().toISOString() },
      { onConflict: "activity_type_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ prepDetails: data });
}
