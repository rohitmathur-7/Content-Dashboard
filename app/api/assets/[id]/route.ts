import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BUCKET = "assets";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Missing asset id." }, { status: 400 });
  }

  const { data: asset, error: findError } = await supabase
    .from("assets")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  if (asset?.storage_path) {
    await supabase.storage.from(BUCKET).remove([asset.storage_path]);
  }

  const { error } = await supabase.from("assets").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
