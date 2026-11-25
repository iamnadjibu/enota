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
| App Check | Register the web app with reCAPTCHA Enterprise, then enforce for Firestore and AI Logic | Blocks scripts that are not your website from using your quota |
| Build → AI Logic | **Get started → Gemini Developer API** | Required for *Import marks (AI)* in the admin site |

## 3. Faculties and departments

In **Admin → Faculties & departments** a faculty can contain departments
(e.g. *Multimedia Production* → *Filmmaking and Video Production*,
*Photography and Graphic Design*, *Journalism and Communication*). A
department can also be chosen on its own by trainees and admins.

After moving departments under a faculty, press **Re-sync links** once so
existing courses, marks and profiles are linked to the new parent faculty.

## 4. Local development

```bash
npm run install:all
# in one terminal: Firestore + Auth emulators (needs Java 17+)
npx --prefix tests/firestore-rules firebase emulators:start --only auth,firestore --project enotaportal
# in another: either site against the emulators
cd Public-site && VITE_USE_EMULATORS=true npx vite
cd admin-site  && VITE_USE_EMULATORS=true npx vite
```

Run the security-rules tests with `npm run test:rules`.

## 5. Build

`npm run build` builds the admin site, the public site, and copies the admin
build into `Public-site/dist/admin` (what Firebase Hosting serves).
