/**
 * One-time setup: creates the Students / Attendance / Payments / Settings tabs,
 * their header rows and default settings in your Google Sheet.
 * (The app also does this automatically on first use — this script just lets
 * you verify the connection up front.)
 *
 *   npm run setup-sheet
 */
import { ensureSetup, getRows, TABS } from "../lib/sheets";

async function main() {
  await ensureSetup();
  for (const tab of Object.keys(TABS) as (keyof typeof TABS)[]) {
    const rows = await getRows(tab);
    console.log(`✓ ${tab.padEnd(11)} ready (${rows.length} rows)`);
  }
  console.log("\nGoogle Sheet is connected and ready.");
}

main().catch((e) => {
  console.error("✗ Setup failed:", e.message ?? e);
  process.exit(1);
});
