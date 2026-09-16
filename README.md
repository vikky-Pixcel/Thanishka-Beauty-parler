# Thanishka Beauty Parlour — Website

Premium, responsive website for **Thanishka Beauty Parlour for Ladies, Warangal**, built from the supplied brand/logo/flyer/bridal images.

## Included

- Premium purple / lavender / blush / champagne-gold design
- Responsive mobile-first layout
- Services, bridal, loyalty card, gallery, location and contact sections
- Appointment request form stored by the Node server in `data/appointments.json`
- WhatsApp click-to-chat booking
- Google Maps link + embedded map search
- API-ready genuine Google Places reviews
- No fabricated testimonials
- SEO metadata and accessibility-friendly form/navigation

## Run locally

1. Install Node.js 18+.
2. Copy `.env.example` to `.env`.
3. Optional but recommended for live Google rating/reviews:
   - Enable **Places API (New)** in Google Cloud.
   - Set `GOOGLE_MAPS_API_KEY`.
   - Set the salon's real `GOOGLE_PLACE_ID`.
4. Run:

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Google reviews

The site calls `/api/google-reviews`. The server uses the Places API (New) with a server-side API key and returns the rating, rating count and the reviews Google exposes through that endpoint. Google Places API review responses are limited; the website therefore also links to the original Google listing instead of inventing or scraping reviews.

For the complete Business Profile review collection, connect a verified Google Business Profile through Google's official Business Profile API/OAuth and replace/extend the `/api/google-reviews` endpoint with the authorized review-list flow.

## Business details used

- Business: Thanishka Beauty Parlour for Ladies
- Address: Phatak St, Sherpura, Warangal, Telangana 506002
- Phone: +91 93953 46411
- Email: himabindu.reesu@gmail.com
- Instagram: @thanishka_beauty_parlour
- Publicly listed hours: 9:00 AM – 10:00 PM daily (confirm with the business)
- Google Maps listing: https://maps.app.goo.gl/r66FTnZVNExc36T67

## Production recommendations

Before launch, replace the file-backed appointment storage with Supabase/PostgreSQL, add admin authentication, configure email/SMS/WhatsApp confirmation, and use the salon's verified Google Place ID/API credentials. Keep all API secrets server-side.


## Easiest preview

Double-click `OPEN WEBSITE.bat`. It checks for Node.js, starts the website, and opens `http://localhost:3000` automatically.
