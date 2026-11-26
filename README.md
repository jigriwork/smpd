# SMPD · smpd.in

Brand website for SMPD (Land & Homes, Berhampur & Beyond). Astro (static output), GSAP/ScrollTrigger, three.js for the hero study model.

Type: Archivo (variable width) and Newsreader italic, self-hosted via Fontsource. No external requests, analytics or tracking.

## Run locally

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs dist/
npm run preview    # serve the production build
```

## Where things live

| What | File |
| --- | --- |
| All copy, navigation, contact details, legal name | `src/data/site.ts` |
| Logo paths (traced from `logo and favicon/`) | `src/data/brand.ts`, `public/brand/` |
| Live 3D study model (hero, three.js) | `src/three/model.ts`, `src/lib/terrain.ts` |
| Site plan and elevation drawings (Our Focus) | `src/components/SitePlan.astro`, `src/components/Elevation.astro` |
| Rendered model stills (hero fallback, dusk) | `public/visuals/` |
| Motion (single GSAP context, reduced-motion aware) | `src/scripts/motion.ts` |
| Header + mobile menu | `src/components/Header.astro`, `src/scripts/header.ts` |
| Enquiry form | `src/pages/index.astro`, `src/scripts/form.ts` |
| Styles and palette tokens | `src/styles/global.css` |
| Favicons, share image (`og-image.jpg`), manifest | `public/` |

Contact fields in `site.ts` are `null` until real details are supplied; null values are not rendered.

## Enquiry form

Set `PUBLIC_FORM_ENDPOINT` (see `.env.example`) to any endpoint that accepts a JSON POST and returns 2xx, for example a Formspree form. Without it the form validates input and tells the visitor plainly that nothing was sent. It never shows a false success message.

## Deploy on Vercel

1. Push this folder to a Git repository and import it in Vercel (framework: Astro, auto-detected; `vercel.json` included).
2. Add `PUBLIC_FORM_ENDPOINT` under Project > Settings > Environment Variables, then redeploy.
3. Add the domain `smpd.in` (and `www.smpd.in` redirecting to it) under Project > Settings > Domains and set the DNS records Vercel shows at your registrar.
4. After the domain is live, check the WhatsApp preview by sharing `https://smpd.in` in a chat, or use the Facebook Sharing Debugger to refresh the cached preview.
