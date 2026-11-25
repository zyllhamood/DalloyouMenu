# Home page sections

`src/pages/HomePage.tsx` renders these sections in order, inside the page's smooth scroll (`components/site/SmoothScroll.tsx`, Lenis).

| File | Section |
| --- | --- |
| `HomeHero.tsx` | The studio: every `is_featured` product, each standing in its own photo studio stretched across the screen |
| `HomeCollections.tsx` | The categories as vitrine niches |
| `HomeOccasions.tsx` | Occasion cards that stack as you scroll, each with a WhatsApp order button |
| `HomeStory.tsx` | The house statement, lit word by word; the monogram is drawn by the scroll |
| `HomeGallery.tsx` | Photo ribbons that react to scroll speed |
| `HomeVisit.tsx` | The two branches as arched doors |

Shared pieces:

- `tokens.ts`: easing, durations, spacing, surfaces and type scale.
- `content.ts`: text used only by the home page, including the occasions and their images.
- `HomeSection.tsx`, `SectionMarker.tsx`, `RevealWords.tsx`: section shell, chapter marker, word-by-word reveal.
- `heroCandidates.ts`: which products the hero shows.

## The hero's looks

The hero reads each photo's backdrop (`lib/studio.ts`, `hooks/useLooks.ts`) and shows it one of three ways:

- **Studio backdrop (pastel wall over a lighter table):** the wall colour fills the screen and the table runs out at the photo's horizon.
- **Transparent cut-out:** floats on ivory.
- **Anything else:** shown in a frame.

The build reads these looks ahead of time, so prerendered pages show the hero complete from the first frame. In the browser, any look the build didn't read is worked out on the fly.

## Occasion images

The occasion images are WebP files in `public/brand/occasions/`, at 640px and 1200px wide. The PNG originals are in `frontend/assets-src/occasions/`. To replace one, keep its file name and convert it to both widths.
