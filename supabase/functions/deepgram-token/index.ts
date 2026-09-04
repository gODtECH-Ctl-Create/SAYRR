import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ error: "missing_authentication" }, 401);
  }

  const accessToken = authorization.slice("Bearer ".length).trim();
  if (!accessToken) return json({ error: "missing_authentication" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } },
  );

  const { error: userError } = await supabase.auth.getUser(accessToken);
  if (userError) {
    return json({ error: "invalid_authentication" }, 401);
  }

  const deepgramApiKey = Deno.env.get("DEEPGRAM_API_KEY");
  if (!deepgramApiKey) {
    return json({ error: "speech_provider_not_configured" }, 503);
  }

  const response = await fetch("https://api.deepgram.com/v1/auth/grant", {
    method: "POST",
    headers: {
      Authorization: `Token ${deepgramApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ttl_seconds: 60 }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.access_token) {
    console.error("Deepgram token grant failed", response.status, payload);
    return json({ error: "speech_token_generation_failed" }, 502);
  }

  return json({
    access_token: payload.access_token,
    expires_in: payload.expires_in ?? 60,
  });
});
