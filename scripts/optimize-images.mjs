// Converts the owner's original product photos into square, web-optimised WebP files
// under public/products/, and generates the Small Fuljhadi placeholder, combo covers and OG image.
// Mapping is based on what each photo shows (checked by eye), not on its filename.
import sharp from "sharp";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "public", "products");
mkdirSync(out, { recursive: true });

const SIZE = 1000;

/** source photo -> output name */
const MAP = [
  ["nazi 1st.jpg", "nazi-green-1"], // Cornation Nazi Green box + green thread bombs
  ["nazi2nd.webp", "nazi-green-2"], // open Nazi Green box with 10 green bundles
  ["mega-crackling-coconut-by-balaji0.jpg", "mega-crackling-coconut-1"], // box + 3 tubes
  ["mega-crackling-coconut-by-balaji1.jpg", "mega-crackling-coconut-2"], // box close-up
  ["Paanch-Awathar-by-Cornation.jpg", "paanch-awathar-1"], // box with 5 shells
  ["crackling anar.jpg", "flowerpots-special-anar-1"], // Cornation Flowerpots Special
  ["chakkar.jpg", "ground-chakkar-1"], // Blue Stars Ground Chakkar Special
  ["fuljadhi-sparkler.jpg", "colour-sparklers-big-1"], // Colour Sparklers packs
  ["30 Shots Skyshot..jpg", "sky-shot-30-shots-1"], // Sarvam Block Buster + Twilight
  ["Murgachap1st.jpg", "murgachap-turkey-1"], // Rathnaa's Turkey pack + string
  ["Murgaachaap2nd.jpg", "murgachap-turkey-2"], // bundle front
  ["Murgachaap3rd.jpg", "murgachap-turkey-3"], // bundle side
];

async function hasWhiteBorder(input) {
  const { width, height } = await sharp(input).metadata();
  const strips = [
    { left: 0, top: 0, width, height: 8 },
    { left: 0, top: height - 8, width, height: 8 },
    { left: 0, top: 0, width: 8, height },
    { left: width - 8, top: 0, width: 8, height },
  ];
  let sum = 0;
  for (const s of strips) {
    const { channels } = await sharp(input).extract(s).stats();
    sum += (channels[0].mean + channels[1].mean + channels[2].mean) / 3;
  }
  return sum / strips.length > 175;
}

async function squareWebp(input, name) {
  const img = sharp(input).rotate();
  if (await hasWhiteBorder(input)) {
    await img
      .clone()
      .resize(SIZE - 60, SIZE - 60, { fit: "inside" })
      .extend({ top: 30, bottom: 30, left: 30, right: 30, background: "#ffffff" })
      .resize(SIZE, SIZE, { fit: "contain", background: "#ffffff" })
      .flatten({ background: "#ffffff" })
      .webp({ quality: 80, effort: 5 })
      .toFile(path.join(out, `${name}.webp`));
    return;
  }
  const bg = await img
    .clone()
    .resize(SIZE, SIZE, { fit: "cover" })
    .blur(40)
    .modulate({ brightness: 0.55, saturation: 1.2 })
    .toBuffer();
  const fg = await img
    .clone()
    .resize(SIZE - 40, SIZE - 40, { fit: "inside", withoutEnlargement: false })
    .toBuffer();
  await sharp(bg)
    .composite([{ input: fg, gravity: "center" }])
    .webp({ quality: 80, effort: 5 })
    .toFile(path.join(out, `${name}.webp`));
}

function placeholderSvg(title, subtitle) {
  const sparks = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    const r1 = 60, r2 = 150 + (i % 3) * 30;
    return `<line x1="${500 + Math.cos(a) * r1}" y1="${390 + Math.sin(a) * r1}" x2="${500 + Math.cos(a) * r2}" y2="${390 + Math.sin(a) * r2}" stroke="${i % 2 ? "#ffd166" : "#ff8c42"}" stroke-width="5" stroke-linecap="round" opacity="0.9"/>`;
  }).join("");
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1e1147"/><stop offset="1" stop-color="#5a0f2e"/>
    </linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#ffd166" stop-opacity="0.55"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="500" cy="390" r="260" fill="url(#glow)"/>
  ${sparks}
  <line x1="500" y1="440" x2="500" y2="760" stroke="#c9c9d6" stroke-width="10" stroke-linecap="round"/>
  <text x="500" y="850" text-anchor="middle" font-family="Arial, sans-serif" font-size="58" font-weight="700" fill="#fff">${title}</text>
  <text x="500" y="915" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#ffd166">${subtitle}</text>
</svg>`);
}

async function collage(names, outName) {
  const tile = SIZE / 2;
  const tiles = await Promise.all(
    names.slice(0, 4).map((n) => sharp(path.join(out, `${n}.webp`)).resize(tile, tile).toBuffer()),
  );
  const positions = [
    { left: 0, top: 0 },
    { left: tile, top: 0 },
    { left: 0, top: tile },
    { left: tile, top: tile },
  ];
  await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: "#1e1147" } })
    .composite(tiles.map((t, i) => ({ input: t, ...positions[i] })))
    .webp({ quality: 78 })
    .toFile(path.join(out, `${outName}.webp`));
}

async function main() {
  for (const [src, name] of MAP) {
    const p = path.join(root, src);
    if (!existsSync(p)) {
      console.warn(`! missing ${src}, skipped`);
      continue;
    }
    await squareWebp(p, name);
    console.log(`✓ ${src} -> public/products/${name}.webp`);
  }

  await sharp(placeholderSvg("Fuljhadi Sparklers (Small)", "Photo coming soon"))
    .webp({ quality: 85 })
    .toFile(path.join(out, "fuljhadi-small-placeholder.webp"));
  console.log("✓ placeholder -> fuljhadi-small-placeholder.webp");

  await collage(["nazi-green-1", "flowerpots-special-anar-1", "ground-chakkar-1", "colour-sparklers-big-1"], "combo-family-pack");
  await collage(["sky-shot-30-shots-1", "paanch-awathar-1", "murgachap-turkey-1", "mega-crackling-coconut-1"], "combo-party-pack");
  await collage(["colour-sparklers-big-1", "fuljhadi-small-placeholder", "ground-chakkar-1", "flowerpots-special-anar-1"], "combo-kids-pack");
  console.log("✓ combo covers");

  // Open Graph image 1200x630 (JPEG for widest social support)
  const og = await sharp(path.join(out, "paanch-awathar-1.webp")).resize(560, 560).toBuffer();
  const ogText = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e1147"/><stop offset="1" stop-color="#5a0f2e"/></linearGradient></defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <text x="50" y="200" font-family="Arial, sans-serif" font-size="44" font-weight="700" fill="#ffd166">MEGA PRE-DIWALI SALE</text>
    <text x="50" y="300" font-family="Arial, sans-serif" font-size="96" font-weight="800" fill="#fff">UP TO 70% OFF</text>
    <text x="50" y="370" font-family="Arial, sans-serif" font-size="34" fill="#ffb38a">Sivakasi crackers · Combo packs</text>
    <text x="50" y="420" font-family="Arial, sans-serif" font-size="34" fill="#ffb38a">Delivered to your door</text>
  </svg>`);
  await sharp(ogText)
    .composite([{ input: og, left: 600, top: 35 }])
    .jpeg({ quality: 82 })
    .toFile(path.join(root, "public", "og-image.jpg"));
  console.log("✓ public/og-image.jpg");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
