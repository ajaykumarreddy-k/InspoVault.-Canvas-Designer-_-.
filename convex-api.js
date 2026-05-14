import { ConvexClient } from "https://esm.sh/convex/browser";

const CONVEX_URL = "https://dazzling-cassowary-803.convex.cloud";
const convex = new ConvexClient(CONVEX_URL);

export const vaultAPI = {
  // ── Text / metadata ─────────────────────────────────────────────────────────
  saveData: async (payload) => {
    return await convex.action("vault:saveItem", payload);
  },

  loadFolder: async (folderId) => {
    return await convex.action("vault:getItems", { folder: folderId });
  },

  // ── File upload (base64 → Google Drive) ─────────────────────────────────────
  /**
   * Upload a file to Google Drive.
   * @param {string} fileData  - base64-encoded file content
   * @param {string} filename  - original file name
   * @param {string} mimeType  - e.g. 'image/png', 'application/pdf'
   * @param {string} type      - vault type ('image','pdf','zip','docs', etc.)
   * @returns {{ driveFileId, viewUrl, downloadUrl }}
   */
  uploadFile: async (fileData, filename, mimeType, type) => {
    return await convex.action("vault:uploadFileToDrive", { fileData, filename, mimeType, type });
  },

  // ── Canvas persistence ───────────────────────────────────────────────────────
  /**
   * Persist all canvas nodes to Supabase.
   * @param {Array} nodes - serializable canvas state array
   * @param {string} userId - user identifier (defaults to 'default')
   */
  saveCanvas: async (nodes, userId = "default") => {
    return await convex.action("vault:saveCanvasState", {
      userId,
      nodes: JSON.stringify(nodes),
    });
  },

  /**
   * Load canvas nodes from Supabase.
   * @param {string} userId
   * @returns {Array|null} parsed nodes array or null if none saved yet
   */
  loadCanvas: async (userId = "default") => {
    const result = await convex.action("vault:loadCanvasState", { userId });
    return result.nodes ? JSON.parse(result.nodes) : null;
  },

  // ── Auth ─────────────────────────────────────────────────────────────────────
  /**
   * Verify a Google Sign-In ID token via Convex.
   * Convex checks it server-side and validates the email whitelist.
   * @param {string} idToken - credential from Google Identity Services callback
   * @returns {{ allowed: bool, email: string, name: string, picture: string }}
   */
  verifyAuth: async (idToken) => {
    return await convex.action("vault:verifyGoogleAuth", { 
      idToken,
      clientId: window.GOOGLE_CLIENT_ID
    });
  },
};
