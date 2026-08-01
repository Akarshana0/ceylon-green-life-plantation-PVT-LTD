# Ceylon Green Life Plantation — Employee Management System
### (Warakapola Metro — CGLP EMS)

සරලව: මේක සම්පූර්ණයෙන්ම Web browser එකෙන් access කරන්න පුළුවන් සේවක කළමනාකරණ පද්ධතියක්.
Firebase (Google) එක backend එක විදිහට පාවිච්චි කරලා, GitHub Pages හරහා host කරන්න පුළුවන් විදිහට හදලා තියෙන්නේ.
කිසිම server එකක් තමන්ම run කරන්න අවශ්‍ය නෑ — Firebase තමයි login, දත්ත ගබඩා කිරීම (Firestore) සහ ඡායාරූප ගබඩා කිරීම (Storage) බලාගන්නේ.

This is a static, browser-based Employee Management System for Ceylon Green Life
Plantation (Pvt) Ltd. It uses **Firebase** (Authentication + Firestore + Storage)
as its backend and is designed to be hosted for free on **GitHub Pages**. There is
no server to run yourself.

---

## 1. What's in this ZIP

```
cglp-app/
├── index.html          ← the entire app (login screen + dashboard)
├── css/style.css        ← all styling
├── js/
│   ├── firebase-config.js   ← your Firebase project keys (already filled in)
│   └── main.js               ← all app logic (auth, employees, export, etc.)
├── assets/logo.png       ← your company logo, cleaned up (transparent background)
├── firestore.rules       ← security rules to paste into Firebase Console
├── storage.rules         ← security rules to paste into Firebase Console
└── README.md             ← this file
```

---

## 2. One-time Firebase setup (do this first)

Your Firebase project (`ceylon-green-life-5e745`) is already wired into
`js/firebase-config.js`. You just need to turn a few things **on** in the
Firebase Console (console.firebase.google.com → select your project).

### 2.1 Enable Email/Password sign-in
1. **Build → Authentication → Get started**
2. Under **Sign-in method**, enable **Email/Password**.
3. Go to the **Users** tab → **Add user** → create the first login (e.g.
   `admin@cglp.lk` + a strong password). Create one account per staff member
   who needs access — everyone signs in with their own email + password.

### 2.2 Create the Firestore Database
1. **Build → Firestore Database → Create database**.
2. Choose **Production mode**, pick a region close to Sri Lanka (e.g.
   `asia-south1` or `asia-southeast1`), click **Enable**.
3. Go to the **Rules** tab, delete what's there, and paste in the contents of
   **`firestore.rules`** from this ZIP. Click **Publish**.

### 2.3 Enable Storage (for employee photos)
1. **Build → Storage → Get started**, accept the defaults.
2. Go to the **Rules** tab, delete what's there, and paste in the contents of
   **`storage.rules`** from this ZIP. Click **Publish**.

### 2.3.5 Set your Super Admin email (new — required for User Access page)
The **User Access** page (sign-up approvals, seeing who's currently logged
in, force-logout, granting self-edit) is now restricted to one or more
whitelisted email addresses, separate from the `role: admin` field. Edit
**both** of these to match your real admin email address before deploying:

1. `js/main.js` — near the top, edit:
   ```js
   const SUPER_ADMIN_EMAILS = [
     'admin@cglp.lk'   // ← change this to your real email
   ];
   ```
2. `firestore.rules` — inside `function isSuperAdmin()`, edit the same list:
   ```
   function isSuperAdmin() {
     return isSignedIn() && request.auth.token.email in [
       'admin@cglp.lk'   // ← must match main.js exactly
     ];
   }
   ```
   Re-publish `firestore.rules` in the Firebase Console after editing.

Only accounts signed in with one of these exact emails will ever see the
"User Access" item in the sidebar or be able to approve sign-ups, disable
accounts, force someone to log out, etc. — even another account promoted to
`role: admin` (which only unlocks employee bank-detail access) won't be able
to open this page.

### 2.4 Make your first Admin (one-time, manual)
The very first time someone signs in, the app automatically creates a profile
document for them in Firestore under `users/{their-uid}` with `role: "staff"`.
To make **that one person** your first Admin:

1. **Build → Firestore Database → Data** tab.
2. Sign in to the app once with that person's account (so their `users` doc
   gets created).
3. Find the document under the `users` collection (its ID is a long random
   string — the Auth UID). Open it.
4. Change the `role` field from `staff` to `admin`. Save.
5. Refresh the app — that account now has full Admin access, including a
   **User Access** page in the sidebar.

After that, **you never need to touch the Firebase Console again to add
people.** From the User Access page, an Admin can create brand-new login
accounts (name, email, password, role) directly from inside the site —
nobody can sign up on their own; only an Admin can hand out access. Existing
users can also be promoted/demoted between Staff and Admin from the same
page with one click.

---

## 3. Deploying to GitHub Pages

1. Create a new **GitHub repository** (e.g. `cglp-ems`), and upload the
   **entire contents of this ZIP** (not the zip file itself — the files
   inside it) to the root of the repo.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`,
   branch `main`, folder `/ (root)`. Save.
4. GitHub will give you a URL like `https://yourusername.github.io/cglp-ems/`.
   Wait a minute or two for the first deploy.

### 3.1 Authorize the domain in Firebase
Firebase blocks sign-in from domains it doesn't recognize, so:
1. Firebase Console → **Authentication → Settings → Authorized domains**.
2. Click **Add domain**, enter `yourusername.github.io` (no `https://`, no
   trailing slash), Save.

That's it — visit your GitHub Pages URL and sign in.

---

## 4. Using the app

- **Dashboard** — quick counts: total employees, branches, new this month,
  employees missing a photo, and a breakdown by designation.
- **Employees** — search, view, edit, or (Admin only) delete any employee.
  Click the pencil icon on a row to open the edit screen.
- **Add Employee** — a full form matching the columns from
  `WARAKAPOLA CGLP EMPLOYEE Details FINAL Format.xlsx` (name, NIC, gender,
  DOB, phone, email, address, join date, branch, reporting line), plus a
  photo picker.
- **Sensitive fields (Designation & Bank Details)** — always shown, but:
  - **Staff** see them masked (e.g. `****4865`) and cannot edit them.
  - **Admin** see them in full, but must click **🔓 Unlock to edit** and
    re-enter their password before the fields become editable. This means
    even an Admin who steps away from an unlocked screen for a moment is
    still protected — the unlock only applies to that one form session.
- **Export** — one click downloads a fresh `.xlsx` with every employee, using
  the exact same column headers as your original Excel format, so it can
  replace your current spreadsheet workflow entirely.
- **My Profile** *(new)* — every signed-in user has a "My Profile" page
  showing their email, role, name, and phone. It's read-only by default;
  once a Super Admin flips **Allow self-edit** for that account (from
  User Access → Online Now or All Users), the name/phone fields unlock
  and the person can update them directly — this is what "Allow self-edit"
  actually powers now.
- **Sign Up** *(new)* — anyone can now request an account from a public
  "Sign Up" link on the login screen (first name, last name, email, phone,
  password + confirm password). This just files a **pending request** — the
  new account **cannot sign in** until a Super Admin approves it. Trying to
  sign in while pending (or after being rejected/disabled) shows a clear
  message instead of letting them in.

- **User Access** *(Super Admin only — see 2.3.5 above)* — four tabs:
  - **Requests** — everyone who signed up and is waiting for approval.
    ✅ Approve lets them sign in immediately; ✕ Reject blocks that account
    permanently (they'd need to sign up again with a different attempt).
  - **Online Now** — everyone currently signed into the site right now
    (a green dot + "last active" time), separate from everyone else. From
    here you can **Force logout** a session, or flip **Allow self-edit**
    so that person can update their own name/phone from their account.
  - **All Users** — every account ever created, with a search box (name /
    email / phone), online/offline status, promote/demote Staff ↔ Admin,
    Enable/Disable, Allow/Revoke self-edit, Force logout, and a trash icon
    to remove an account's access to the site entirely.
  - **Add User** — create brand-new, pre-approved login accounts right from
    this page (name, email, password, role — no Firebase Console needed).

  ⚠️ **Note on "Force logout" and "Delete":** this is a static site with no
  server, so there's no way to truly revoke a Firebase session instantly or
  delete someone's login (that needs the Firebase Admin SDK / a Cloud
  Function). "Force logout" works by signaling every open tab of that
  account to sign itself out — it takes effect the moment their browser
  next checks in (usually within a few seconds, since tabs check roughly
  every 25s). "Delete" removes their profile so they can no longer use the
  app, but their underlying Firebase Auth login technically still exists;
  if you need it fully purged, do that once in Firebase Console →
  Authentication → Users.

⚠️ Since this update, **re-publish `firestore.rules`** in Firebase Console →
Firestore Database → Rules (it now supports self-signup requests, the
Super Admin whitelist, and the `/presence` collection used for Online Now
and Force Logout — none of which the old rules allowed).

---

## 5. Photos and your existing Excel files

Uploading a photo for an employee no longer touches any spreadsheet — it goes
straight to Firebase Storage and is linked to that employee's record. This is
what solves the formatting problem you had in
`Warakapola Metro 02 - N.N.W.I.Hemachandra.xlsx`, where inserting photos broke
the layout: photos now live entirely outside the spreadsheet.

The **Export** button always produces a clean, consistently formatted `.xlsx`
— no manual color-coding or formatting needed, since every record is entered
through the same form.

---

## 6. Testing locally before you deploy (optional)

Because the app uses JavaScript modules, opening `index.html` directly by
double-clicking it won't work in most browsers (it needs to be served over
`http://`, not `file://`). To preview it on your own computer first:

```bash
# from inside the cglp-app folder
python3 -m http.server 8080
# then open http://localhost:8080 in your browser
```

(You'll also need to add `localhost` to Firebase's Authorized domains list
temporarily if you want sign-in to work locally — see step 3.1.)

---

## 6.5 Fixes in this build

- **Excel export no longer leaks sensitive data.** Staff accounts (who
  can't see Designation or Bank Details on screen) previously still got
  those columns in full when they clicked Export — the download ignored
  the on-screen masking. Export now matches what the signed-in user is
  allowed to see.
- **"Allow self-edit" now actually does something.** The User Access page
  always had a toggle to let a specific person edit their own name/phone,
  but there was no page for them to do it on. Added the **My Profile**
  page described above.
- **Employee photos no longer pile up in Storage.** Replacing or deleting
  an employee's photo now removes the old file from Firebase Storage
  instead of leaving it there forever.
- **Dashboard "Branches" stat** no longer shows `1` when there are zero
  employees in the system yet.

### 6.6 Fixes in this build (latest)

- **Sensitive-field unlock no longer survives navigation.** Unlocking
  Designation/Bank Details on the **Add Employee** page and then switching
  to another page and back used to leave those fields unlocked with no
  password re-prompt. The unlock is now cleared the moment you leave the
  page, exactly as the Edit modal already behaved.
- **User Access actions no longer double-fire.** On the **User Access**
  page, "Force logout" and "Allow/Revoke self-edit" appear in both the
  "Online Now" and "All Users" tabs. Because both tables were re-rendered
  from the same live data every ~25 seconds (each heartbeat), button click
  handlers were being re-attached on top of existing ones instead of
  replacing them — so after the page had been open a little while, one
  click could silently fire the action twice (double toast, duplicate
  write). Each table's buttons are now wired up independently, so this
  can no longer happen.

### 6.8 Security fix in this build — sensitive fields moved server-side

Previously, Designation and the four bank/EPF fields were stored on the same
`employees/{id}` document that every signed-in Staff account is allowed to
read. The Staff-facing "masked" view (`•••• 4865`, `🔒 restricted`, etc.) was
**UI-only** — Firestore has no field-level redaction, so anyone signed in as
Staff could open browser DevTools (or just inspect the app's own in-memory
data) and read every employee's real designation, bank name/branch, account
number, and EPF number in full.

These five fields now live in a separate `employees/{id}/private/data`
document, and `firestore.rules` restricts that subcollection to Admin only.
Staff accounts never even fetch it. **You must re-publish `firestore.rules`**
after this update — the old rules don't define the `private` subcollection
and existing sensitive data stored directly on `employees/{id}` won't be
picked up until it's re-saved through the Add/Edit form by an Admin.

- **Note for existing deployments:** if you already have employee records
  with designation/bank data saved under the old structure, that data is
  still sitting on the public `employees/{id}` doc (a bug fix can't move
  data for you). Ask an Admin to open + re-save each employee record once
  after deploying this build to migrate their sensitive fields into the new
  private subdocument, then manually delete those fields from the old
  location in the Firebase Console.

### 6.7 New feature: Branch / Designation filters

The **Employees** page now has filter dropdowns next to the search box:
- **Branch filter** — visible to everyone, lists every branch currently in
  use.
- **Designation filter** — Admin only (Staff can't see designations at
  all, so this dropdown stays hidden for them, matching the masked
  Designation column).

Both dropdowns combine with the existing text search, and remember your
selection as new employees are added live.

### 6.9 New feature: "Celebrations this month" on the Dashboard

The Dashboard now shows a **Celebrations this month** panel — every employee
whose birthday or work anniversary falls in the current calendar month,
sorted by day, with the years of service shown for anniversaries. This uses
only Date of Birth / Join Date / Name / Branch, none of which are sensitive
fields, so both Staff and Admin see it.

### 6.10 Other fixes in this build

- **Dashboard "Branches" stat** could still show `1` even with employees in
  the system, if none of them had a branch filled in yet (the earlier fix
  only covered the zero-employees case). It now always shows the true
  count of distinct branches.

---

## 7. Roadmap (already designed for, not built yet)

The data model and permission system leave room to add, without restructuring
anything:
- Employee self-registration workflow
- Commission updates
- Monthly target tracking
- Annual report generation

---

## 8. Support

If something in Firebase Console doesn't match these steps exactly, Google
periodically redesigns that UI — the core actions (enable Email/Password,
create Firestore, paste Rules, enable Storage, add Authorized domain) will
still exist, just possibly renamed or relocated a click away.
