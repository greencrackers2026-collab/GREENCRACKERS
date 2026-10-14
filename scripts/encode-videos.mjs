// Compresses the owner's raw background videos (project root) into small, web-ready loops
// under public/videos/: a 720p desktop file, a 360p mobile file and a WebP poster per clip.
// Requires ffmpeg on PATH (or set FFMPEG=/path/to/ffmpeg). Run: npm run videos
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";

const ffmpeg = process.env.FFMPEG || "ffmpeg";
const root = process.cwd();
const out = path.join(root, "public", "videos");
mkdirSync(out, { recursive: true });

/** name -> source file, start second, duration (chosen by reviewing each clip) */
const CLIPS = [
  { name: "sparkler", src: "19790729-uhd_3840_2160_30fps.mp4", start: 0, dur: 12 }, // sparkler in hand, bokeh lights
  { name: "sky-fireworks", src: "17701135-uhd_3840_2160_60fps.mp4", start: 0, dur: 14 }, // aerial bursts over city at night
  { name: "chakkar", src: "12612689_1920_1080_25fps.mp4", start: 0, dur: 8 }, // ground chakkar sparks
  { name: "diyas", src: "14585483_1920_1080_50fps.mp4", start: 0, dur: 10 }, // rows of lit diyas
];

const run = (args) => execFileSync(ffmpeg, ["-v", "error", "-y", ...args], { stdio: "inherit" });
const kb = (f) => `${Math.round(statSync(f).size / 1024)} KB`;

for (const c of CLIPS) {
  const src = path.join(root, c.src);
  if (!existsSync(src)) {
    console.warn(`! missing ${c.src}, skipped`);
    continue;
  }
  const trim = ["-ss", String(c.start), "-t", String(c.dur), "-i", src, "-an"];
  const h264 = ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart", "-preset", "slow"];
  // Short fade in/out so clips crossfade/loop without a hard cut.
  const fade = `fade=t=in:st=0:d=0.6,fade=t=out:st=${c.dur - 0.6}:d=0.6`;

  const hd = path.join(out, `${c.name}-720.mp4`);
  run([...trim, "-vf", `scale=1280:-2:flags=lanczos,fps=30,${fade}`, ...h264, "-crf", "27", "-maxrate", "2500k", "-bufsize", "5000k", hd]);
  const sd = path.join(out, `${c.name}-360.mp4`);
  run([...trim, "-vf", `scale=640:-2:flags=lanczos,fps=24,${fade}`, ...h264, "-crf", "29", "-maxrate", "700k", "-bufsize", "1400k", sd]);
  const poster = path.join(out, `${c.name}.webp`);
  run(["-ss", String(c.start + 1.5), "-i", src, "-frames:v", "1", "-vf", "scale=1280:-2", "-q:v", "60", poster]);

  console.log(`✓ ${c.name}: 720p ${kb(hd)}, 360p ${kb(sd)}, poster ${kb(poster)}`);
}
