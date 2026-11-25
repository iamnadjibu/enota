# eNOTA Portal — setup and go-live checklist

This release moves every permission check into **Firestore Security Rules**.
The new website and the new rules must go live **together**: the old admin
site does not work with the new rules, and the new site expects them.

## 1. Go-live order (do these in one sitting)

1. Merge the pull request into `main`. GitHub Actions runs the rules tests,
   builds both sites and deploys hosting.
2. Deploy the database rules from a computer signed in to Firebase:

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules --project enotaportal
   ```

   (The GitHub deploy only publishes the website, not the rules.)
3. Open `https://enotaportal.web.app/admin/` and sign in with the owner
   account. You'll be asked to **verify the email** — open the link sent to
   the inbox, then press *I've verified*.
4. On the dashboard press **Claim Super Admin**. This works once, only for
   the owner email written in `firestore.rules`. After that, only Super
   Admins can approve or promote other admins.
5. Every other admin must also verify their email the next time they sign
   in (the site guides them).

## 2. Firebase console settings (recommended)

| Where | What | Why |
| --- | --- | --- |
| Authentication → Settings → Password policy | Require at least 8 characters, letters and numbers | Matches the site's own rule; blocks weak passwords created outside the site |
| Authentication → Settings → User actions | Turn on **Email enumeration protection** | Stops people discovering which emails have accounts |
| Authentication → Templates | Set the sender name to “eNOTA Portal” and customise the verification and reset emails | Fewer emails land in spam |

## 3. App Check with reCAPTCHA Enterprise (already in the code)

The site key `6LeBmjEuAAAAAJAoigq-XuCL4KLftR3ZpMxTHnzx` is wired into
`shared/lib/firebase.js`. Firebase verifies the tokens itself, so no backend
"assessment" code is needed. To switch it on:

1. Google Cloud console → Security → reCAPTCHA → this key → **Domains**:
   make sure `enotaportal.web.app` and `enotaportal.firebaseapp.com` are listed
   (add `localhost` only if you also want real tokens locally).
2. Firebase console → **App Check** → Apps → the web app → **reCAPTCHA
   Enterprise** → paste the site key → Save.
3. For local development, open the site on `localhost`, copy the
   *App Check debug token* printed in the browser console, and add it in
   App Check → Apps → ⋮ → **Manage debug tokens**.
4. Watch **App Check → APIs → metrics** for a few days. When almost all
   requests show as *verified*, press **Enforce** for Cloud Firestore,
   Authentication and Firebase AI Logic (in that order is fine).
   Do not enforce before deploying this version, or the old site breaks.

## 4. Gemini (Import marks with AI)

The admin site calls Gemini through **Firebase AI Logic**. Firebase keeps
the Gemini API key on Google's side, so **no API key goes in the code, the
repository or any prompt**.

1. Firebase console → **Build → AI Logic → Get started** → choose
   **Gemini Developer API** (free tier available). Firebase creates and
   manages the key for this project.
2. Optional: in Google AI Studio, check usage and quotas for the
   `enotaportal` project.
3. In the admin site open **Import marks (AI)**, upload a sheet and check
   the preview before saving.

Never paste a Gemini key into the front-end: anyone could copy it from the
browser. Using your own key would need a server (Cloud Functions with
Secret Manager, Blaze plan), which this project does not need.

## 5. Faculties and departments

In **Admin → Faculties & departments** a faculty can contain departments
(e.g. *Multimedia Production* → *Filmmaking and Video Production*,
*Photography and Graphic Design*, *Journalism and Communication*). A
department can also be chosen on its own by trainees and admins.

After moving departments under a faculty, press **Re-sync links** once so
existing courses, marks and profiles are linked to the new parent faculty.

## 6. Local development

```bash
npm run install:all
# in one terminal: Firestore + Auth emulators (needs Java 21)
npx --prefix tests/firestore-rules firebase emulators:start --only auth,firestore --project enotaportal
# in another: either site against the emulators
cd Public-site && VITE_USE_EMULATORS=true npx vite
cd admin-site  && VITE_USE_EMULATORS=true npx vite
```

Run the security-rules tests (needs Java 21; works on Windows, macOS and Linux):

```bash
npm ci --prefix tests/firestore-rules   # once; install:all does not include it
npm run test:rules
```

Keep the project on an internal drive. On a FAT32/exFAT USB drive `npm ci`
can take hours and fail with `ENOTEMPTY`.

## 7. Build

`npm run build` builds the admin site, the public site, and copies the admin
build into `Public-site/dist/admin` (what Firebase Hosting serves).
