/**
 * The ONLY module that talks to Google Sheets.
 *
 * Every tab is treated as a simple table: row 1 = headers, rows 2+ = data.
 * Rows are returned as plain objects keyed by header name, so columns can be
 * reordered in the sheet without breaking the app.
 *
 * Set SHEETS_MOCK=1 to use a local JSON file (.data/mock-sheet.json) instead of
 * Google — handy for trying the app before the Google setup is done.
 */
import { google, sheets_v4 } from "googleapis";
import fs from "fs/promises";
import path from "path";

export const TABS = {
  Students: [
    "StudentID",
    "RegisteredAt",
    "Batch",
    "FullName",
    "DOB",
    "Age",
    "WhatsApp",
    "Address",
    "SkillLevel",
    "ClassMode",
    "PreferredDays",
    "StarterKit",
    "EmergencyName",
    "EmergencyPhone",
    "AgreedTerms",
    "SignatureName",
    "SignatureDate",
    "CourseFee",
    "Status",
  ],
  Attendance: ["Date", "Batch", "StudentID", "FullName", "Status", "MarkedAt"],
  Payments: ["PaymentID", "Date", "StudentID", "FullName", "Amount", "Method", "Note", "RecordedAt"],
  Settings: ["Key", "Value"],
} as const;

export type TabName = keyof typeof TABS;
/** A sheet row keyed by header. `_row` is the 1-based sheet row number. */
export type Row = Record<string, string>;
type Cell = string | number | boolean;

export const DEFAULT_SETTINGS: Record<string, string> = {
  CurrentBatch: "Batch 01",
  FeeWithKit: "15000",
  FeeWithoutKit: "10000",
};

/* ------------------------------------------------------------------ */
/* Backends                                                            */
/* ------------------------------------------------------------------ */

interface Backend {
  listTabs(): Promise<string[]>;
  addTab(name: string): Promise<void>;
  read(tab: string): Promise<string[][]>;
  append(tab: string, rows: Cell[][]): Promise<void>;
  update(tab: string, updates: { row: number; values: Cell[] }[]): Promise<void>;
}

const q = (tab: string) => `'${tab.replace(/'/g, "''")}'`;

function googleBackend(): Backend {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!email || !key || !spreadsheetId) {
    throw new Error(
      "Google Sheets is not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY and SPREADSHEET_ID (or SHEETS_MOCK=1 for local testing)."
    );
  }
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const api: sheets_v4.Sheets = google.sheets({ version: "v4", auth });

  return {
    async listTabs() {
      const res = await api.spreadsheets.get({ spreadsheetId, fields: "sheets.properties.title" });
      return (res.data.sheets ?? []).map((s) => s.properties?.title ?? "");
    },
    async addTab(name) {
      await api.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title: name } } }] },
      });
    },
    async read(tab) {
      const res = await api.spreadsheets.values.get({ spreadsheetId, range: q(tab) });
      return (res.data.values ?? []).map((r) => r.map((c) => String(c ?? "")));
    },
    async append(tab, rows) {
      if (!rows.length) return;
      await api.spreadsheets.values.append({
        spreadsheetId,
        range: `${q(tab)}!A1`,
        valueInputOption: "RAW", // RAW keeps phone numbers like 070... intact
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: rows },
      });
    },
    async update(tab, updates) {
      if (!updates.length) return;
      await api.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: "RAW",
          data: updates.map((u) => ({ range: `${q(tab)}!A${u.row}`, values: [u.values] })),
        },
      });
    },
  };
}

function mockBackend(): Backend {
  const file = path.join(process.cwd(), ".data", "mock-sheet.json");
  type Store = Record<string, string[][]>;
  const load = async (): Promise<Store> => {
    try {
      return JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      return {};
    }
  };
  const save = async (s: Store) => {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(s, null, 2));
  };
  const str = (r: Cell[]) => r.map((c) => String(c));
  return {
    async listTabs() {
      return Object.keys(await load());
    },
    async addTab(name) {
      const s = await load();
      s[name] ??= [];
      await save(s);
    },
    async read(tab) {
      return (await load())[tab] ?? [];
    },
    async append(tab, rows) {
      const s = await load();
      (s[tab] ??= []).push(...rows.map(str));
      await save(s);
    },
    async update(tab, updates) {
      const s = await load();
      const t = (s[tab] ??= []);
      for (const u of updates) t[u.row - 1] = str(u.values);
      await save(s);
    },
  };
}

let _backend: Backend | null = null;
function backend(): Backend {
  if (!_backend) _backend = process.env.SHEETS_MOCK === "1" ? mockBackend() : googleBackend();
  return _backend;
}

/* ------------------------------------------------------------------ */
/* One-time (lazy) setup: create missing tabs, headers, default settings */
/* ------------------------------------------------------------------ */

let setupPromise: Promise<void> | null = null;

export function ensureSetup(): Promise<void> {
  if (!setupPromise) {
    setupPromise = (async () => {
      const b = backend();
      const existing = await b.listTabs();
      for (const tab of Object.keys(TABS) as TabName[]) {
        if (!existing.includes(tab)) await b.addTab(tab);
        const values = await b.read(tab);
        if (!values.length || values[0].every((c) => !c)) {
          await b.update(tab, [{ row: 1, values: [...TABS[tab]] }]);
        }
      }
      const settings = await b.read("Settings");
      const keys = new Set(settings.slice(1).map((r) => r[0]));
      const missing = Object.entries(DEFAULT_SETTINGS).filter(([k]) => !keys.has(k));
      if (missing.length) await b.append("Settings", missing);
    })().catch((e) => {
      setupPromise = null; // retry on next request
      throw e;
    });
  }
  return setupPromise;
}

/* ------------------------------------------------------------------ */
/* Header-mapped helpers used by the rest of the app                   */
/* ------------------------------------------------------------------ */

async function readTable(tab: TabName) {
  await ensureSetup();
  const values = await backend().read(tab);
  const header = values[0]?.length ? values[0] : [...TABS[tab]];
  return { header, values };
}

/** All data rows of a tab. Each row has an extra `_row` (sheet row number, as string). */
export async function getRows(tab: TabName): Promise<Row[]> {
  const { header, values } = await readTable(tab);
  return values
    .slice(1)
    .map((r, i) => {
      const row: Row = { _row: String(i + 2) };
      header.forEach((h, j) => (row[h] = String(r[j] ?? "").trim()));
      return row;
    })
    .filter((row) => header.some((h) => row[h] !== ""));
}

const toCells = (header: string[], obj: Record<string, Cell | undefined>): Cell[] =>
  header.map((h) => obj[h] ?? "");

export async function appendRows(tab: TabName, rows: Record<string, Cell | undefined>[]) {
  const { header, values } = await readTable(tab);
  const cells = rows.map((r) => toCells(header, r));
  // If the tab was emptied (header row deleted), put the header back first.
  if (!values.length) cells.unshift([...header]);
  await backend().append(tab, cells);
}

/** Overwrite full rows in place. Each object must include `_row` (from getRows). */
export async function updateRows(tab: TabName, rows: Record<string, Cell | undefined>[]) {
  const { header } = await readTable(tab);
  await backend().update(
    tab,
    rows.map((r) => ({ row: Number(r._row), values: toCells(header, r) }))
  );
}
