import { ConvexClient } from "https://esm.sh/convex/browser";

// Replace the URL below with your actual Convex deployment URL
// Run `npx convex dev` to get your URL, then paste it here
const CONVEX_URL = "https://dazzling-cassowary-803.convex.cloud";

const convex = new ConvexClient(CONVEX_URL);

export const vaultAPI = {
  /**
   * Save any item (prompt, link, image URL, skills, etc.) to Supabase via Convex.
   * @param {Object} payload - { type, folder, title, content, notes, drive_file_id? }
   */
  saveData: async (payload) => {
    return await convex.action("vault:saveItem", payload);
  },

  /**
   * Load all items for a given folder from Supabase via Convex.
   * @param {string} folderId - The folder slug/ID to filter by
   */
  loadFolder: async (folderId) => {
    return await convex.action("vault:getItems", { folder: folderId });
  },

  /**
   * Get a Google Drive file ID for uploading a file.
   * @param {string} filename - Name of the file
   * @param {string} mimeType - MIME type (e.g. 'image/png')
   * @param {string} type - Vault type ('image', 'docs', 'zip', etc.)
   */
  getDriveUploadUrl: async (filename, mimeType, type) => {
    return await convex.action("vault:getDriveUploadUrl", { filename, mimeType, type });
  },
};
