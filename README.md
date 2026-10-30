# Checky App

Two homes, one plan. A home-management and co-parenting web app with a Personal space and a Shared space.

- `index.html` is the whole app: login, Personal and Shared pages.
- `manifest.webmanifest`, `sw.js` and `icons/` make it installable on phones (Add to Home Screen).
- `_headers` tells Cloudflare not to keep old copies of the install files.
- Sign-in and data use Supabase.
- Hosted at www.checkyapp.co.za through Cloudflare Pages; every push to `main` goes live.
