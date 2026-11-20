// shots.js — deterministic scenes for screenshots and dossier captures.
//
// Reads the page query (?shot=cover|editor&size=4:5|1:1|9:16&grade=
// sunset|neon|neutral&title=...&subtitle=...) and builds a fixed scene
// from the two bundled sample photos, so a screenshot is reproducible.
// Sets window.__shotReady once the cover has been painted.

import { SIZES, blankPanels, renderCover } from "./cover.js";

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

async function loadSamples() {
  const [boulevard, pier] = await Promise.all([
    loadImage("samples/boulevard.jpg"),
    loadImage("samples/pier.jpg"),
  ]);
  return [boulevard, pier];
}

function markReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}

// Build the deterministic job for a ?shot=cover scene.
export async function runCoverShot(canvas, query) {
  const sizeKey = query.get("size") || "4:5";
  const size = SIZES[sizeKey] || SIZES["4:5"];
  canvas.width = size.w;
  canvas.height = size.h;
  document.body.classList.add("shot-cover");

  const images = await loadSamples();
  const grade = query.get("grade") || "sunset";
  const job = {
    images,
    panels: blankPanels(images.length),
    layout: query.get("layout") || "hero",
    grade,
    title: query.get("title") || "PALM HEAT",
    subtitle: query.get("subtitle") || "neon over the bay",
    titlePosition: query.get("titlepos") || "bottom",
    titleColor: query.get("titlecolor") || "gradient",
    seed: 7,
  };
  renderCover(canvas, job);
  markReady();
  return job;
}

// Build the editor scene for a ?shot=editor screenshot: the editor with
// the sample photos already loaded into the panels.
export async function runEditorShot(state, query) {
  const images = await loadSamples();
  state.images = images;
  state.panels = blankPanels(images.length);
  state.layout = query.get("layout") || "hero";
  state.grade = query.get("grade") || "sunset";
  state.title = query.get("title") || "PALM HEAT";
  state.subtitle = query.get("subtitle") || "neon over the bay";
  state.sizeKey = query.get("size") || "4:5";
  markReady();
  return state;
}
