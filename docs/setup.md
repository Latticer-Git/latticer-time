# Setup guide

About 30 to 45 minutes the first time. You will need an [Airtable](https://airtable.com) account, a [Cloudflare](https://dash.cloudflare.com) account, Node.js 18 or newer, and a copy of this repository.

> **Never paste your Airtable token into a file in the repository, a chat, an issue, or the browser.** It goes only into Cloudflare's encrypted environment settings.

Try the demo first (`npm run demo`) so you know what you are building.

## 1. Create the Airtable base

1. In Airtable, create a new base.
2. Build the five tables exactly as described in [airtable-schema.md](airtable-schema.md): **Clients**, **Engagements**, **Deliverables**, **Task Types**, **Time Entries**. Build them in that order so link fields are easy to add.
3. Add sample data: one client for yourself ("My Company (Internal)", status Active) and one real or pretend client; one engagement for each (Type `Internal` and `Client`); a few Task Types.
4. Copy the **base ID**: open the base, look at the URL, and take the part that starts with `app` (for example `appXXXXXXXXXXXXXX`). It is not a secret, but keep it out of public commits.

## 2. Create an Airtable token

1. Airtable account > **Developer hub** > **Personal access tokens** > **Create token**.
2. **Scopes:** `data.records:read` and `data.records:write`. Nothing else, and no schema scopes.
3. **Access:** add only the one base you just made.
4. Create the token and keep the tab open until step 4. You will paste it straight into Cloudflare.

## 3. Deploy to Cloudflare Pages

From the repository root:

```bash
npx wrangler login
npx wrangler pages deploy public --project-name my-time-tracker --branch main
```

Pick any project name (it becomes `my-time-tracker.pages.dev`). Run the command from the repository root so Wrangler also finds the `functions/` folder. Deploy only the `public` folder as shown; never the whole repository.

The first deploy will show a broken app (no token yet). That is expected.

## 4. Set the environment variables

Cloudflare dashboard > **Workers & Pages** > your project > **Settings** > **Variables and Secrets** (production):

| Name | Type | Value |
| --- | --- | --- |
| `AIRTABLE_TOKEN` | Secret | the token from step 2 |
| `AIRTABLE_BASE_ID` | Plaintext | your base ID from step 1 |
| `ALLOWED_EMAIL` | Plaintext | the email you will sign in with |

Then redeploy (rerun the `wrangler pages deploy` command) so the function picks up the variables.

## 5. Lock it down with Cloudflare Access

Without this step anyone with the address could use the app. The function also checks the signed-in email, but Access is the front door.

1. Cloudflare dashboard > **Zero Trust** > **Access** > **Applications** > **Add an application** > **Self-hosted**.
2. Application domain: your `my-time-tracker.pages.dev` address. Add `*.my-time-tracker.pages.dev` too, so preview deployments are covered.
3. Policy: **Allow**, include **Emails** equal to your address only.
4. Save. Visit the site in a private window: you should be asked to sign in, and nothing should load before you do.

## 6. Add it to your phone

Open the address on your phone, sign in, then **Share > Add to Home Screen** (iOS) or **Install app** (Android).

## 7. First run

1. Pick a client, project and type of work. Press **Start**, wait a minute, press **Stop**.
2. Open the **Time Entries** table in Airtable and check the row: engagement, task type, start, end, work date, Counted Hours.
3. Delete the test entry (from the app's list or in Airtable).

If something fails, see [troubleshooting.md](troubleshooting.md).

## Updating later

Edit the code, run `npm run demo` to check it, then rerun the deploy command from step 3. If you change `public/sw.js` or cached files and users see old versions, bump `CACHE` in `public/sw.js`.
