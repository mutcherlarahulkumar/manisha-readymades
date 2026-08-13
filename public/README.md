# Static assets

## `logo.png` (or `logo.svg`)

The brand mark used in the header, the mobile navigation panel and the footer.

Place the file here and it is picked up automatically — `components/layout/BrandLogo`
renders it and falls back to a built-in monogram only when the file is missing,
so there is no code change to make.

Two notes on the artwork:

- **Supply the mark on its own**, without the "Manisha Readymades" wordmark
  beneath it. The header, drawer and footer already set the brand name in type
  next to the mark, so a file containing the words prints the name twice.
- **SVG is preferred over PNG.** It stays sharp on high-density screens at every
  size the mark is drawn at (32–36px in the header, 34px in the footer) and is a
  fraction of the file size. If only a PNG exists, export it at 4× the largest
  rendered size — roughly 144×144 — so it does not soften on retina displays.

If the file is named `logo.svg` rather than `logo.png`, update `LOGO_SRC` at the
top of `components/layout/BrandLogo.tsx`.
