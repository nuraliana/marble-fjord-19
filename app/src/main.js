// main.js — wires the Palm Heat Cover Studio editor.
//
// State lives in one object; every control edits it and calls repaint().
// The preview canvas is the cover itself at export resolution, scaled by
// CSS. Click a panel to select it, drag to pan its photo, scroll to zoom.
// ?shot=cover|editor scenes are built by shots.js before the editor starts.

import { GRADES, LAYOUTS, SIZES, blankPanels, panelRects, renderCover } from "./cover.js";
import { loadImage, runCoverShot, runEditorShot } from "./shots.js";

const $ = (id) => document.getElementById(id);
const stage = $("stage");
const statusEl = $("status");

const state = {
  images: [],
  panels: blankPanels(2),
  layout: "hero",
  grade: "sunset",
  sizeKey: "4:5",
  title: "PALM HEAT",
  subtitle: "neon over the bay",
  titlePosition: "bottom",
  titleColor: "gradient",
  activePanel: 0,
  seed: 7,
};

function job() {
  return {
    images: state.images,
    panels: state.panels,
    layout: state.layout,
    grade: state.grade,
    title: state.title,
    subtitle: state.subtitle,
    titlePosition: state.titlePosition,
    titleColor: state.titleColor,
    seed: state.seed,
  };
}

function repaint() {
  const size = SIZES[state.sizeKey] || SIZES["4:5"];
  if (stage.width !== size.w || stage.height !== size.h) {
    stage.width = size.w;
    stage.height = size.h;
  }
  renderCover(stage, job());
  syncPanelControls();
}

function setStatus(text) {
  statusEl.textContent = text;
}

// ---- panel picking + drag pan + wheel zoom on the canvas ----

function panelAt(clientX, clientY) {
  const box = stage.getBoundingClientRect();
  const x = ((clientX - box.left) / box.width) * stage.width;
  const y = ((clientY - box.top) / box.height) * stage.height;
  const rects = panelRects(state.layout, stage.width, stage.height);
  for (let i = rects.length - 1; i >= 0; i -= 1) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

let drag = null;

stage.addEventListener("pointerdown", (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0) return;
  state.activePanel = i;
  drag = { x: e.clientX, y: e.clientY, ox: state.panels[i].ox, oy: state.panels[i].oy };
  stage.setPointerCapture(e.pointerId);
  repaint();
  setStatus(`Panel ${i + 1} selected — drag to pan, scroll to zoom.`);
});

stage.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const box = stage.getBoundingClientRect();
  const p = state.panels[state.activePanel];
  const dx = (e.clientX - drag.x) / box.width;
  const dy = (e.clientY - drag.y) / box.height;
  p.ox = Math.max(-1, Math.min(1, drag.ox - dx * 2));
  p.oy = Math.max(-1, Math.min(1, drag.oy - dy * 2));
  repaint();
});

stage.addEventListener("pointerup", () => { drag = null; });
stage.addEventListener("pointercancel", () => { drag = null; });

stage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const p = state.panels[state.activePanel];
  const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
  p.zoom = Math.max(1, Math.min(3, (p.zoom || 1) * factor));
  repaint();
}, { passive: false });

// ---- photo loading ----

async function addPhotoFile(file) {
  try {
    const img = await loadImage(URL.createObjectURL(file));
    state.images.push(img);
    state.panels[state.activePanel].photo = state.images.length - 1;
    repaint();
    setStatus(`Loaded “${file.name}” into panel ${state.activePanel + 1}.`);
  } catch {
    setStatus(`Could not read “${file.name}” — try another image file.`);
  }
}

async function loadSample(name) {
  try {
    const img = await loadImage(`samples/${name}.jpg`);
    const at = state.images.findIndex((im) => im.src.endsWith(`${name}.jpg`));
    if (at >= 0) {
      state.panels[state.activePanel].photo = at;
    } else {
      state.images.push(img);
      state.panels[state.activePanel].photo = state.images.length - 1;
    }
    repaint();
    setStatus(`Sample “${name}” in panel ${state.activePanel + 1}.`);
  } catch {
    setStatus(`Sample “${name}” failed to load.`);
  }
}

$("photoFile").addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if (file) addPhotoFile(file);
  e.target.value = "";
});

const dropzone = $("dropzone");
["dragover", "dragenter"].forEach((ev) => dropzone.addEventListener(ev, (e) => {
  e.preventDefault();
  dropzone.classList.add("dragging");
}));
["dragleave", "drop"].forEach((ev) => dropzone.addEventListener(ev, (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragging");
}));
dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) addPhotoFile(file);
});

document.querySelectorAll("[data-sample]").forEach((btn) => {
  btn.addEventListener("click", () => loadSample(btn.dataset.sample));
});

// ---- option groups (layout / grade / size) ----

function wireGroup(attr, apply) {
  document.querySelectorAll(`[data-${attr}]`).forEach((btn) => {
    btn.addEventListener("click", () => {
      apply(btn.dataset[attr]);
      document.querySelectorAll(`[data-${attr}]`).forEach((b) => {
        b.classList.toggle("on", b === btn);
      });
      repaint();
    });
  });
}

wireGroup("layout", (v) => { state.layout = v; });
wireGroup("grade", (v) => { state.grade = v; });
wireGroup("size", (v) => { state.sizeKey = v; });

// ---- caption + title options ----

$("titleInput").addEventListener("input", (e) => { state.title = e.target.value; repaint(); });
$("subtitleInput").addEventListener("input", (e) => { state.subtitle = e.target.value; repaint(); });
$("titlePos").addEventListener("change", (e) => { state.titlePosition = e.target.value; repaint(); });
$("titleColor").addEventListener("change", (e) => { state.titleColor = e.target.value; repaint(); });

// ---- per-panel controls ----

function syncPanelControls() {
  const p = state.panels[state.activePanel];
  $("zoomRange").value = String(p.zoom || 1);
  $("panXRange").value = String(p.ox || 0);
  $("panYRange").value = String(p.oy || 0);
  $("panelLabel").textContent = `Panel ${state.activePanel + 1} of 4`;
  document.querySelectorAll("[data-panel]").forEach((b) => {
    b.classList.toggle("on", Number(b.dataset.panel) === state.activePanel);
  });
}

document.querySelectorAll("[data-panel]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.activePanel = Number(btn.dataset.panel);
    repaint();
    setStatus(`Panel ${state.activePanel + 1} selected.`);
  });
});

$("zoomRange").addEventListener("input", (e) => {
  state.panels[state.activePanel].zoom = Number(e.target.value);
  repaint();
});
$("panXRange").addEventListener("input", (e) => {
  state.panels[state.activePanel].ox = Number(e.target.value);
  repaint();
});
$("panYRange").addEventListener("input", (e) => {
  state.panels[state.activePanel].oy = Number(e.target.value);
  repaint();
});

$("shuffleBtn").addEventListener("click", () => {
  // remix: rotate which photo sits in each panel and nudge the crops
  const n = state.images.length || 1;
  state.panels = state.panels.map((p, i) => ({
    photo: (p.photo + 1) % n,
    zoom: 1 + ((i * 37) % 40) / 100,
    ox: (((i * 53) % 100) - 50) / 100,
    oy: (((i * 29) % 100) - 50) / 100,
  }));
  state.seed = (state.seed * 31 + 17) % 997;
  repaint();
  setStatus("Remixed the panels — export when it looks right.");
});

$("resetBtn").addEventListener("click", () => {
  state.panels = blankPanels(state.images.length);
  state.activePanel = 0;
  repaint();
  setStatus("Panel crops reset.");
});

// ---- export ----

$("exportBtn").addEventListener("click", () => {
  const size = SIZES[state.sizeKey] || SIZES["4:5"];
  const off = document.createElement("canvas");
  off.width = size.w;
  off.height = size.h;
  renderCover(off, job());
  off.toBlob((blob) => {
    if (!blob) {
      setStatus("Export failed — try again.");
      return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `palm-heat-cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Saved palm-heat-cover-${size.w}x${size.h}.png — share it.`);
  }, "image/png");
});

// ---- boot ----

async function boot() {
  const query = new URLSearchParams(location.search);
  const shot = query.get("shot");
  if (shot === "cover") {
    await runCoverShot(stage, query);
    return;
  }
  // editor (and ?shot=editor): load the samples so the page is never empty
  try {
    const [boulevard, pier] = await Promise.all([
      loadImage("samples/boulevard.jpg"),
      loadImage("samples/pier.jpg"),
    ]);
    state.images = [boulevard, pier];
    state.panels = blankPanels(state.images.length);
  } catch {
    setStatus("Sample photos failed to load — drop your own photo in.");
  }
  if (shot === "editor") {
    await runEditorShot(state, query);
  }
  $("titleInput").value = state.title;
  $("subtitleInput").value = state.subtitle;
  repaint();
  setStatus("Ready — drop a photo, pick a layout, export your cover.");
}

boot();
