import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceRoleKey) {
    return json({ error: "Server configuration is incomplete." }, 500);
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Authentication required." }, 401);

  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userResult, error: userError } = await caller.auth.getUser();
  const owner = userResult.user;
  if (userError || !owner) return json({ error: "Invalid session." }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const storeId = String(body.store_id ?? "");
  const fullName = String(body.full_name ?? "").trim();
  const phoneRaw = String(body.phone ?? "").trim();
  const pin = String(body.pin ?? "");
  const role = String(body.role ?? "waiter");
  const allowedRoles = ["manager", "kitchen", "waiter"];

  if (!storeId || !fullName || fullName.length > 100) return json({ error: "Store and valid name are required." }, 400);
  if (!/^\+[1-9]\d{7,14}$/.test(phoneRaw)) {
    return json({ error: "Nomor WhatsApp harus memakai format internasional, misalnya +6281234567890." }, 400);
  }
  if (!/^\d{6,8}$/.test(pin)) return json({ error: "PIN harus terdiri dari 6–8 angka." }, 400);
  if (!allowedRoles.includes(role)) return json({ error: "Role karyawan tidak valid." }, 400);

  const { data: membership, error: membershipError } = await admin
    .from("store_members")
    .select("role,is_active")
    .eq("store_id", storeId)
    .eq("user_id", owner.id)
    .maybeSingle();

  if (membershipError || !membership || !membership.is_active || membership.role !== "owner") {
    return json({ error: "Hanya Owner aktif dari toko tersebut yang dapat membuat akun karyawan." }, 403);
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    phone: phoneRaw,
    password: pin,
    phone_confirm: true,
    user_metadata: { full_name: fullName, account_type: "staff" },
  });

  if (createError || !created.user) {
    return json({ error: createError?.message ?? "Akun karyawan gagal dibuat." }, 400);
  }

  const { error: insertError } = await admin.from("store_members").insert({
    store_id: storeId,
    user_id: created.user.id,
    role,
    is_active: true,
  });

  if (insertError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: "Akun gagal ditautkan ke toko. Tidak ada akun yang disimpan." }, 500);
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: created.user.id,
    full_name: fullName,
  });
  if (profileError) {
    await admin.from("store_members").delete().eq("store_id", storeId).eq("user_id", created.user.id);
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: "Profil karyawan gagal dibuat; pembuatan akun dibatalkan." }, 500);
  }

  return json({
    ok: true,
    staff: { id: created.user.id, full_name: fullName, phone: phoneRaw, role },
    note: "PIN disimpan oleh Supabase Auth, bukan sebagai teks biasa di tabel aplikasi. Minta karyawan mengganti PIN awal setelah login pertama.",
  }, 201);
});
