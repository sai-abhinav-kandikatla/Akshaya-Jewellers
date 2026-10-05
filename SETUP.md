# Akshaya Jewellers — Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier is fine)

---

## Step 1: Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Name it `akshaya-jewellery`
4. Set a database password (save it)
5. Choose a region close to India (e.g., Mumbai or Singapore)
6. Wait for the project to be created

---

## Step 2: Run Database Migration

1. In your Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open the file `supabase/migration.sql` from this project
4. Copy and paste the **entire** contents into the SQL Editor
5. Click **Run**
6. You should see "Success" — this creates all tables, indexes, RLS policies, and RPC functions

For an existing deployment, run `supabase/prevent_duplicate_coupon_numbers.sql` in the SQL Editor to add the one-coupon-per-mobile safeguard without rerunning the full migration.

---

## Step 3: Configure Environment Variables

1. In your Supabase Dashboard, go to **Settings → API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (the `anon` key, NOT the `service_role` key)
3. In this project folder, create a file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
ADMIN_USERNAME=Akshaya_Jewellers
ADMIN_PASSWORD=replace_with_a_strong_password
ADMIN_SESSION_SECRET=replace_with_a_random_secret
```

> ⚠️ Never commit `.env.local` to version control!
> Keep admin credentials and the session secret server-only. Do not add the `NEXT_PUBLIC_` prefix to them.

---

## Step 4: Add Your Logo

1. Place your Akshaya Jewellers logo image in `public/logo.png`
2. The application references this file throughout

---

## Step 5: Install & Run

```bash
npm install
npm run dev
```

The application will start at `http://localhost:3000`

---

## Step 6: Create Admin Account

1. Open `http://localhost:3000/login`
2. Click **Create Account**
3. Enter your email and a strong password
4. Click **Sign Up**
5. Check your email for a verification link (if email confirmation is enabled in Supabase)
6. Once verified, you'll be redirected to the dashboard

### Disable Signup (Optional — Recommended for Production)

After creating your admin account, to prevent others from signing up:

1. Go to Supabase Dashboard → **Authentication → Providers**
2. Under **Email**, disable **"Enable Sign Up"**
3. This ensures only your admin account can log in

---

## Step 7: Deploy to Vercel (Production)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add the environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `ADMIN_SESSION_SECRET`
   Keep the admin variables server-only; do not prefix them with `NEXT_PUBLIC_`.
4. Make sure they apply to the **Production** environment (and Preview too if you test there).
5. Deploy or redeploy after saving the variables. Existing Vercel deployments do not receive environment-variable changes.

---

## Troubleshooting

### "Unable to connect" errors
- Check that your `.env.local` file has the correct Supabase URL and Anon Key
- Make sure the Supabase project is active (not paused)

### "Coupon not found" on QR scan
- The QR verification URL uses your app's domain
- Make sure the `/verify/[code]` route is accessible

### Login not working
- If the login page says admin login is not configured, add `ADMIN_USERNAME` and `ADMIN_PASSWORD` to the server environment.
- If it says session signing is not configured, add `ADMIN_SESSION_SECRET`.
- On Vercel, set these under Project Settings → Environment Variables for the Production environment, then redeploy.
- Do not use `NEXT_PUBLIC_` for admin credentials or the session secret.

### Timezone issues
- All dates are handled in IST (Asia/Kolkata)
- The database stores timestamps in UTC but all display/computation uses IST conversion
