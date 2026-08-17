# Static assets

## `logo.png`

The brand artwork. One file serves every placement on the site.

The supplied file is the **complete lockup**: the mandala with "Manisha
Readymades" and "Vizianagaram" set beneath it. Two components read it, and each
presents it the way its placement needs:

- `components/layout/BrandLockup` shows it **whole**, large, where the brand is
  the subject rather than a label — the Contact page panel and the home hero
  when no hero banner is set.
- `components/layout/BrandLogo` crops the **mark alone** out of it for the small,
  navigational placements: the header (32–36px), the mobile drawer, the footer
  and the admin shell. Those already set the brand name in type beside the mark,
  so showing the embedded wordmark there would print the name twice — and at
  30px the words are illegible anyway.

Both fall back to a built-in monogram when the file is missing, so a deleted or
renamed asset never renders a broken image.

### Replacing the artwork

The crop in `BrandLogo` is measured against the current file — the mandala sits
at x 119–1120, y 40–1034 in the 1254×1254 source. If you swap the artwork,
re-check `MARK_CROP` at the top of that component:

- A **new lockup** with different proportions needs the three numbers re-measured.
- A **mark-only** file needs no crop at all — set `MARK_CROP` to
  `{ width: 100, left: 0, top: 0 }`.

Two notes on the file itself:

- **SVG is preferred over PNG.** It stays sharp on high-density screens at every
  size the mark is drawn at and is a fraction of the weight. If only a raster
  export exists, supply it at 4× the largest rendered size.
- The current `logo.png` is a **JPEG** despite its extension. Browsers sniff the
  content and render it correctly, so nothing is broken, but a real PNG or SVG
  would compress the flat colour far better than 207 kB.

If the file is renamed, update `LOGO_SRC` in `BrandLogo.tsx` and `LOCKUP_SRC` in
`BrandLockup.tsx`.
