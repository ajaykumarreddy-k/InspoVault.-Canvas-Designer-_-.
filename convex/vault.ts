"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { createClient } from "@supabase/supabase-js";
import { drive } from "@googleapis/drive";
import { GoogleAuth, OAuth2Client } from "google-auth-library";
import { Readable } from "stream";

// ── Email whitelist — the only 4 accounts allowed to sign in ─────
const ALLOWED_EMAILS = [
  "ajaykumarreddykrishnareddygari@gmail.com",
  "k.ajaykumarreddy26@gmail.com",
  "ajayapiuser2@gmail.com",
  "ajayphotos26@gmail.com",
];

// ── Lazy helpers ──────────────────────────────────────────────────────────────

function getSupabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
}

function getDriveService() {
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  return drive({ version: "v3", auth });
}

/** Pick the right Drive folder based on item type */
function driveFolder(type: string): string {
  const images = ["image", "design", "react", "screenshot", "png", "jpg", "jpeg", "gif", "webp", "svg"];
  const archives = ["zip", "archive", "rar", "tar", "7z"];
  if (images.includes(type.toLowerCase())) return process.env.DRIVE_FOLDER_IMAGES!;
  if (archives.includes(type.toLowerCase())) return process.env.DRIVE_FOLDER_ARCHIVES!;
  return process.env.DRIVE_FOLDER_DOCS!;
}

// ── EXISTING: Save text/link/metadata to Supabase ─────────────────────────────

export const saveItem = action({
  args: {
    type: v.string(),
    folder: v.string(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    notes: v.optional(v.string()),
    drive_file_id: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("items").insert([args]).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
});

// ── EXISTING: Fetch items ──────────────────────────────────────────────────────

export const getItems = action({
  args: { folder: v.optional(v.string()) },
  handler: async (_ctx, args) => {
    const supabase = getSupabase();
    let query = supabase.from("items").select("*").order("created_at", { ascending: false });
    if (args.folder) query = query.eq("folder", args.folder);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  },
});

// ── NEW: Upload a file (base64) to Google Drive ────────────────────────────────

export const uploadFileToDrive = action({
  args: {
    fileData: v.string(),   // base64-encoded file content
    filename: v.string(),
    mimeType: v.string(),
    type: v.string(),       // determines which Drive folder
  },
  handler: async (_ctx, args) => {
    const driveService = getDriveService();
    const folderId = driveFolder(args.type);

    // Decode base64 → stream
    const buffer = Buffer.from(args.fileData, "base64");
    const stream = Readable.from(buffer);

    // Create file in Drive
    const res = await driveService.files.create({
      requestBody: { name: args.filename, parents: [folderId] },
      media: { mimeType: args.mimeType, body: stream },
      fields: "id, webViewLink, webContentLink",
    });

    // Make publicly viewable
    await driveService.permissions.create({
      fileId: res.data.id!,
      requestBody: { role: "reader", type: "anyone" },
    });

    return {
      driveFileId: res.data.id,
      viewUrl: `https://drive.google.com/file/d/${res.data.id}/view`,
      downloadUrl: res.data.webContentLink,
    };
  },
});

// ── NEW: Get a Drive upload URL (for legacy getDriveUploadUrl callers) ─────────

export const getDriveUploadUrl = action({
  args: { filename: v.string(), mimeType: v.string(), type: v.string() },
  handler: async (_ctx, args) => {
    const driveService = getDriveService();
    const folderId = driveFolder(args.type);
    const res = await driveService.files.create({
      requestBody: { name: args.filename, parents: [folderId] },
      media: { mimeType: args.mimeType },
      fields: "id",
    });
    return { driveFileId: res.data.id };
  },
});

// ── NEW: Save entire canvas state to Supabase ─────────────────────────────────

export const saveCanvasState = action({
  args: {
    userId: v.string(),    // 'default' until auth is wired up
    nodes: v.string(),     // JSON-serialized array of all canvas nodes
  },
  handler: async (_ctx, args) => {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("canvas_state")
      .upsert({ user_id: args.userId, nodes: args.nodes, updated_at: new Date().toISOString() },
               { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  },
});

// ── NEW: Load canvas state from Supabase ──────────────────────────────────────

export const loadCanvasState = action({
  args: { userId: v.string() },
  handler: async (_ctx, args) => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("canvas_state")
      .select("nodes")
      .eq("user_id", args.userId)
      .single();
    if (error && error.code !== "PGRST116") throw new Error(error.message); // PGRST116 = no row
    return { nodes: data?.nodes ?? null };
  },
});

// ── AUTH: Verify Google ID token + whitelist check ────────────────────────────
// Flow: frontend gets ID token from Google Sign-In → sends here → we verify
// it server-side and check the email against ALLOWED_EMAILS.

export const verifyGoogleAuth = action({
  args: { idToken: v.string(), clientId: v.optional(v.string()) },
  handler: async (_ctx, args) => {
    try {
      const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || args.clientId;
      if (!clientId) throw new Error("No Google Client ID provided to verify token.");
      
      const client = new OAuth2Client(clientId);

      // Verify the token is a real Google-signed token
      const ticket = await client.verifyIdToken({
        idToken: args.idToken,
        audience: clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) throw new Error("Invalid Google token — no payload");

      const email   = (payload.email   || "").toLowerCase();
      const name    = payload.name    || "";
      const picture = payload.picture || "";

      const allowed = ALLOWED_EMAILS.includes(email);

      return { allowed, email, name, picture, error: null };
    } catch (err: any) {
      console.error("Auth verification failed:", err);
      // Return a clean object instead of throwing so the frontend can display it
      return { allowed: false, email: "Unknown", name: "", picture: "", error: err.message };
    }
  },
});

