"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { createClient } from "@supabase/supabase-js";
import { drive } from "@googleapis/drive";
import { GoogleAuth } from "google-auth-library";

// ── Lazy helpers: clients are created INSIDE handlers so Convex
//    can load the module without env vars present at deploy time ──

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  );
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

// --- API METHODS ---

// Save text, links, or metadata to DB
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

// Fetch items for the UI grid
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

// Get a Google Drive file ID for files (Images, PDFs, ZIPs)
export const getDriveUploadUrl = action({
  args: { filename: v.string(), mimeType: v.string(), type: v.string() },
  handler: async (_ctx, args) => {
    const driveService = getDriveService();
    let folderId = process.env.DRIVE_FOLDER_DOCS;
    if (["image", "design", "react"].includes(args.type)) folderId = process.env.DRIVE_FOLDER_IMAGES;
    if (args.type === "zip") folderId = process.env.DRIVE_FOLDER_ARCHIVES;

    const res = await driveService.files.create({
      requestBody: { name: args.filename, parents: [folderId!] },
      media: { mimeType: args.mimeType },
      fields: "id",
    });
    return { driveFileId: res.data.id };
  },
});
