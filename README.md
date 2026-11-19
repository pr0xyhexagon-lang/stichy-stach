# Stichy Stash – Hand Embroidery Academy

A simple Next.js + Tailwind app for:

- **Student registration** (public form at `/`)
- **Attendance** per class date and batch (`/admin/attendance`)
- **Payments and dues** (`/admin/payments`)

There is **no database**. Everything is saved in one Google Spreadsheet with 4 tabs:

| Tab | What's in it |
|---|---|
| `Students` | One row per registration: all form fields, Student ID, batch, course fee, status |
| `Attendance` | One row per student per class date (Present / Absent) |
| `Payments` | One row per payment (date, amount, method, note) |
| `Settings` | `CurrentBatch`, `FeeWithKit`, `FeeWithoutKit` |

**Due = CourseFee − sum of that student's payments.** The app works this out, so you never need formulas in the sheet.
You can edit rows directly in Google Sheets at any time. For example, you can fix a typo or delete a wrong payment.

---

## 1. One-time Google setup (about 10 minutes)

1. Go to <https://console.cloud.google.com/> and create a project (e.g. "Stichy Stash").
2. **APIs & Services → Library**, then search for **Google Sheets API** and click **Enable**.
3. **APIs & Services → Credentials → Create credentials → Service account.** Give it any name and click Done.
4. Open the service account, go to the **Keys** tab, choose **Add key → JSON**, and a `.json` file downloads.
5. Create a blank Google Sheet. Click **Share** and add the service account's email
   (`...@...iam.gserviceaccount.com`) as an **Editor**.
6. Copy `.env.local.example` to `.env.local` and fill it in:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: `client_email` from the JSON file
   - `GOOGLE_PRIVATE_KEY`: `private_key` from the JSON file. Keep the quotes and the `\n`s.
   - `SPREADSHEET_ID`: the long ID in the sheet URL (`/spreadsheets/d/<ID>/edit`)
   - `ADMIN_PASSWORD`: the password for the admin pages
   - `SESSION_SECRET`: any long random string (e.g. `openssl rand -hex 32`)
7. Check the connection. This creates the tabs, headers and default settings:

   ```bash
   npm run setup-sheet
   ```

## 2. Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

- Registration form: `http://localhost:3000/`
- Admin: `http://localhost:3000/admin`. Log in with `ADMIN_PASSWORD`, then go to **Settings** to set the batch name and fees.

**Trying it without Google:** put `SHEETS_MOCK=1` in `.env.local` and the data goes to `.data/mock-sheet.json` instead.

## 3. Deploy (Vercel)

Push to GitHub, import the repo in Vercel, and add the same environment variables in
*Project → Settings → Environment Variables*. For `GOOGLE_PRIVATE_KEY`, paste the key exactly as it appears in the JSON file.

---

## Day-to-day use

- **New batch:** in Admin → Settings, change *Current batch* (e.g. `Batch 02`). The form shows it, and new IDs become `STS-02-001`, `STS-02-002` and so on.
- **Attendance:** pick the date and batch. Everyone starts as Present, so tap Absent for anyone missing, then Save.
  Opening the same date again loads what you saved so you can correct it. Rows are updated, never duplicated.
- **Payments:** pick a student, enter the amount, and click Record. The *Outstanding dues* list shows who still owes money.
- **Students:** click a student to see all their details, change their course fee or status (Active / Completed / Dropped), or open WhatsApp.

## Project layout

```
lib/sheets.ts      the only file that talks to Google Sheets (plus the mock backend)
lib/data.ts        registration, dues, attendance and payment logic
lib/schema.ts      form options and validation (shared by the browser and server)
lib/auth.ts        admin session cookie (signed JWT)
middleware.ts      protects /admin and the admin APIs
app/page.tsx       public registration form
app/admin/...      admin pages
app/api/...        API routes
```
