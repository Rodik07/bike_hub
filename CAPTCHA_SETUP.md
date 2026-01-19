# Cloudflare Turnstile CAPTCHA Setup Guide

## Step 1: Get Your Turnstile Keys

1. Visit: https://dash.cloudflare.com/
2. Sign up or login (free account)
3. Click **"Turnstile"** in the left sidebar
4. Click **"Add Site"** button
5. Fill in the form:
   - **Site name**: `BikeHub`
   - **Domain**: `localhost` (for development testing)
   - **Widget Mode**: Select **"Managed"** (best UX - invisible when possible)
   - **Pre-Clearance**: Leave disabled
6. Click **"Create"**
7. You'll see two keys:
   - **Site Key** (starts with `0x...`) - This is PUBLIC, goes in frontend
   - **Secret Key** - This is PRIVATE, goes in backend .env

## Step 2: Add Keys to Your Environment Files

### Backend (.env)
Add to `/server/.env`:
```env
# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=your-secret-key-here
```

### Frontend (.env)
Create/update `/client/.env`:
```env
# Cloudflare Turnstile
VITE_TURNSTILE_SITE_KEY=your-site-key-here
```

## Step 3: Ready for Implementation

Once you've completed steps 1 and 2, I'll implement:
- ✅ CAPTCHA widget on Login page
- ✅ CAPTCHA widget on Register page  
- ✅ Backend verification for all auth endpoints
- ✅ Proper error handling
- ✅ Fallback for development (when keys not configured)

## Testing Keys (Optional - for development only)

If you want to test the implementation before getting real keys, Cloudflare provides test keys:

**Test Site Key**: `1x00000000000000000000AA`
**Test Secret Key**: `1x0000000000000000000000000000000AA`

⚠️ **Warning**: Test keys ALWAYS pass validation. Use real keys for production!

## Production Setup

For production, you'll need to:
1. Add your actual production domain (e.g., `bikehub.com`)
2. In Cloudflare Turnstile, click your site
3. Click **"Settings"**
4. Add production domain to **"Domains"** list
5. Update your environment variables with production keys

---

**Next Steps**: 
1. Complete Step 1 & 2 above
2. Let me know when you have the keys, and I'll implement CAPTCHA!
