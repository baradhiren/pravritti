# Photos

Optimised WebP thumbnails (`lens-NN.webp`) for the "Through my lens" marquee
in the About pop-up. Listed in `photos` in `src/data/content.ts`.
Landscape works best (~3:2 or 4:3 — they render at 320×240).

## Adding / replacing photos

Browsers can't display HEIC, and the files are huge, so convert iPhone shots
to small WebP before committing. Requires macOS `sips` (built in) + `cwebp`
(`brew install webp`):

```sh
# from this directory, for each new photo:
sips -s format jpeg -Z 1000 IMG_XXXX.HEIC --out /tmp/tmp.jpg
cwebp -q 80 /tmp/tmp.jpg -o lens-NN.webp
```

~1000px long edge at q80 gives crisp, retina-safe thumbnails (~30–250 KB each
depending on detail). Then add the `lens-NN.webp` path to `photos` in
`src/data/content.ts`. Don't commit the HEIC originals.

**Orientation gotcha:** iPhone portrait shots store landscape pixels plus an
EXIF "rotate" tag. `cwebp` ignores that tag, so a portrait photo can come out
sideways. If a `.webp` looks rotated, rotate the JPEG 90° clockwise before
encoding and re-run `cwebp`:

```sh
sips -r 90 /tmp/tmp.jpg --out /tmp/tmp-rot.jpg   # use -r 270 if it went the wrong way
cwebp -q 80 /tmp/tmp-rot.jpg -o lens-NN.webp
```
