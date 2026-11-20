// cover.js — poster cover renderer for Palm Heat Cover Studio.
//
// Draws a multi-panel poster cover onto a 2D canvas: photo panels in a
// GTA-poster style grid, a Vice City colour grade, bold title lettering,
// film grain and a vignette. Everything is drawn from images the user
// loaded on their own machine plus canvas gradients — no network, no
// external assets, no Rockstar artwork or fonts.

export const GRADES = {
  sunset: {
    label: "Vice Sunset",
    // warm orange -> magenta wash, drawn with 'overlay' + 'soft-light'
    wash: ["rgba(255, 122, 26, 0.55)", "rgba(255, 45, 120, 0.42)", "rgba(64, 20, 120, 0.30)"],
    tint: "rgba(255, 140, 40, 0.14)",
    titleFrom: "#fff3d6",
    titleTo: "#ff9a3d",
  },
  neon: {
    label: "Neon Night",
    wash: ["rgba(255, 45, 149, 0.50)", "rgba(24, 220, 220, 0.34)", "rgba(20, 20, 90, 0.42)"],
    tint: "rgba(40, 220, 220, 0.10)",
    titleFrom: "#ffe9f6",
    titleTo: "#37e6ff",
  },
  neutral: {
    label: "Daylight",
    wash: ["rgba(255, 255, 255, 0.10)", "rgba(180, 200, 220, 0.10)", "rgba(40, 40, 60, 0.16)"],
    tint: "rgba(255, 255, 255, 0.05)",
    titleFrom: "#ffffff",
    titleTo: "#ffd98a",
  },
};

export const LAYOUTS = {
  hero: { label: "Hero + 3", panels: 4 },
  grid: { label: "Four Square", panels: 4 },
  strip: { label: "Banner + 3", panels: 4 },
};

export const SIZES = {
  "4:5": { w: 1080, h: 1350, label: "4:5 Portrait" },
  "1:1": { w: 1080, h: 1080, label: "1:1 Square" },
  "9:16": { w: 1080, h: 1920, label: "9:16 Story" },
};

// Panel rectangles as fractions of the canvas, with a gutter between them.
export function panelRects(layout, w, h) {
  const g = Math.round(Math.min(w, h) * 0.012); // gutter
  if (layout === "grid") {
    const hw = (w - g) / 2;
    const hh = (h - g) / 2;
    return [
      { x: 0, y: 0, w: hw, h: hh },
      { x: hw + g, y: 0, w: hw, h: hh },
      { x: 0, y: hh + g, w: hw, h: hh },
      { x: hw + g, y: hh + g, w: hw, h: hh },
    ];
  }
  if (layout === "strip") {
    const topH = Math.round(h * 0.58);
    const botH = h - topH - g;
    const bw = (w - 2 * g) / 3;
    return [
      { x: 0, y: 0, w, h: topH },
      { x: 0, y: topH + g, w: bw, h: botH },
      { x: bw + g, y: topH + g, w: bw, h: botH },
      { x: 2 * (bw + g), y: topH + g, w: bw, h: botH },
    ];
  }
  // hero (default): big panel left, three stacked on the right
  const heroW = Math.round(w * 0.62);
  const sideW = w - heroW - g;
  const sh = (h - 2 * g) / 3;
  return [
    { x: 0, y: 0, w: heroW, h },
    { x: heroW + g, y: 0, w: sideW, h: sh },
    { x: heroW + g, y: sh + g, w: sideW, h: sh },
    { x: heroW + g, y: 2 * (sh + g), w: sideW, h: sh },
  ];
}

// Cover-fit an image into a panel rect, then apply the panel's zoom and pan.
// zoom 1 = fit; ox/oy in [-1, 1] shift the photo inside the panel.
function fittedDraw(img, rect, zoom, ox, oy) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * base;
  const dh = ih * base;
  const maxOx = Math.max(0, (dw - rect.w) / 2);
  const maxOy = Math.max(0, (dh - rect.h) / 2);
  return {
    x: rect.x + (rect.w - dw) / 2 - ox * maxOx,
    y: rect.y + (rect.h - dh) / 2 - oy * maxOy,
    w: dw,
    h: dh,
  };
}

function drawPhotoPanel(ctx, img, rect, panel) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (img) {
    const d = fittedDraw(img, rect, panel.zoom || 1, panel.ox || 0, panel.oy || 0);
    ctx.drawImage(img, d.x, d.y, d.w, d.h);
    // gentle bottom shade so neighbouring panels read apart
    const shade = ctx.createLinearGradient(0, rect.y + rect.h * 0.55, 0, rect.y + rect.h);
    shade.addColorStop(0, "rgba(10, 6, 20, 0)");
    shade.addColorStop(1, "rgba(10, 6, 20, 0.28)");
    ctx.fillStyle = shade;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  } else {
    const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    grad.addColorStop(0, "#2c2140");
    grad.addColorStop(1, "#120e1e");
    ctx.fillStyle = grad;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = `600 ${Math.max(14, Math.round(rect.h * 0.05))}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("DROP A PHOTO", rect.x + rect.w / 2, rect.y + rect.h / 2);
  }
  ctx.restore();
  // thin white frame line around each panel
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = Math.max(2, Math.round(Math.min(rect.w, rect.h) * 0.006));
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

function applyGrade(ctx, w, h, gradeName) {
  const g = GRADES[gradeName] || GRADES.sunset;
  const wash = ctx.createLinearGradient(0, 0, w, h);
  wash.addColorStop(0, g.wash[0]);
  wash.addColorStop(0.55, g.wash[1]);
  wash.addColorStop(1, g.wash[2]);
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = g.tint;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function applyVignette(ctx, w, h) {
  const v = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.35,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(8,4,18,0.38)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

// Deterministic grain: a tiny seeded PRNG so ?shot= renders are stable.
function seededRandom(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function applyGrain(ctx, w, h, seed) {
  const rand = seededRandom(seed || 7);
  const step = Math.max(3, Math.round(w / 360));
  ctx.save();
  ctx.globalAlpha = 0.05;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const v = rand();
      ctx.fillStyle = v > 0.5 ? "#ffffff" : "#000000";
      ctx.fillRect(x, y, step, step);
    }
  }
  ctx.restore();
}

function drawTitleBlock(ctx, w, h, title, subtitle, gradeName, position, colorMode) {
  const g = GRADES[gradeName] || GRADES.sunset;
  const pad = Math.round(w * 0.05);
  const titleSize = Math.round(w * 0.115);
  const subSize = Math.round(w * 0.042);
  const blockH = titleSize + subSize + Math.round(w * 0.09);

  let top;
  if (position === "top") top = Math.round(h * 0.06);
  else if (position === "center") top = Math.round((h - blockH) / 2);
  else top = h - blockH - Math.round(h * 0.035);

  // scrim behind the lettering so it reads on any photo
  const scrim = ctx.createLinearGradient(0, top - pad, 0, top + blockH + pad);
  scrim.addColorStop(0, "rgba(10,5,22,0)");
  scrim.addColorStop(0.35, "rgba(10,5,22,0.55)");
  scrim.addColorStop(1, "rgba(10,5,22,0.82)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, top - pad, w, blockH + pad * 2);

  const grad = ctx.createLinearGradient(0, top, 0, top + titleSize);
  if (colorMode === "white") {
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(1, "#f2e6ff");
  } else {
    grad.addColorStop(0, g.titleFrom);
    grad.addColorStop(1, g.titleTo);
  }

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `900 ${titleSize}px "Arial Black", Impact, "Helvetica Neue", sans-serif`;
  const lines = wrapTitle(ctx, (title || "PALM HEAT").toUpperCase(), w - pad * 2);
  const lineH = titleSize * 0.98;
  let y = top + titleSize;
  for (const line of lines) {
    ctx.lineWidth = Math.max(3, Math.round(titleSize * 0.09));
    ctx.strokeStyle = "rgba(12,4,24,0.9)";
    ctx.lineJoin = "round";
    ctx.strokeText(line, w / 2, y);
    ctx.fillStyle = grad;
    ctx.fillText(line, w / 2, y);
    y += lineH;
  }
  if (subtitle) {
    ctx.font = `italic 700 ${subSize}px Georgia, "Times New Roman", serif`;
    ctx.fillStyle = "#ffe9f2";
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = Math.round(subSize * 0.4);
    ctx.fillText(subtitle, w / 2, y + subSize * 0.35);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

function wrapTitle(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !current) {
      current = test;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

// job: {
//   images: HTMLImageElement[] (indexable by panel.photo),
//   panels: [{ photo, zoom, ox, oy } x4],
//   layout, grade, title, subtitle, titlePosition, titleColor, seed
// }
export function renderCover(canvas, job) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#120e1e";
  ctx.fillRect(0, 0, w, h);

  const rects = panelRects(job.layout || "hero", w, h);
  const panels = job.panels || [];
  for (let i = 0; i < rects.length; i += 1) {
    const p = panels[i] || { photo: i % (job.images.length || 1), zoom: 1, ox: 0, oy: 0 };
    drawPhotoPanel(ctx, job.images[p.photo] || null, rects[i], p);
  }
  applyGrade(ctx, w, h, job.grade || "sunset");
  applyVignette(ctx, w, h);
  applyGrain(ctx, w, h, job.seed || 7);
  drawTitleBlock(
    ctx, w, h,
    job.title, job.subtitle, job.grade || "sunset",
    job.titlePosition || "bottom", job.titleColor || "gradient",
  );
  return ctx;
}

export function blankPanels(photoCount) {
  // sensible default: hero gets photo 0, side panels cycle the rest
  return [
    { photo: 0, zoom: 1, ox: 0, oy: 0 },
    { photo: photoCount > 1 ? 1 : 0, zoom: 1, ox: 0, oy: 0 },
    { photo: photoCount > 1 ? 1 : 0, zoom: 1.15, ox: 0, oy: -0.15 },
    { photo: 0, zoom: 1.1, ox: 0, oy: -0.25 },
  ];
}
