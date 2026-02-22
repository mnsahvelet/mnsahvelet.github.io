(() => {
  "use strict";

  const el = (id) => document.getElementById(id);

  // ===== Chart bounds (log-log) =====
  const XMIN = 1e-2, XMAX = 1e1;
  const YMIN = 1e-3, YMAX = 1;

  let CURVES = null;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function log10(x) { return Math.log(x) / Math.LN10; }

  // Resolve curves.json relative to THIS script file (robust on GitHub Pages)
  function curvesUrl() {
    const script = document.currentScript;
    if (script && script.src) {
      return new URL("curves.json", script.src).toString();
    }
    // Fallback: relative to current page
    return "curves.json";
  }

  // Map data (log space) -> canvas pixels
  function makeMapper(canvas) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;

    // plot padding
    const padL = 80, padR = 18, padT = 18, padB = 58;

    const lx0 = log10(XMIN), lx1 = log10(XMAX);
    const ly0 = log10(YMIN), ly1 = log10(YMAX);

    function x2px(x) {
      const t = (log10(x) - lx0) / (lx1 - lx0);
      return padL + t * (W - padL - padR);
    }

    function y2px(y) {
      const t = (log10(y) - ly0) / (ly1 - ly0);
      return (H - padB) - t * (H - padT - padB);
    }

    return { ctx, W, H, padL, padR, padT, padB, x2px, y2px };
  }

  function drawAxes(map) {
    const { ctx, W, H, padL, padR, padT, padB } = map;

    ctx.clearRect(0, 0, W, H);

    // background
    ctx.fillStyle = "#0f0f0f";
    ctx.fillRect(0, 0, W, H);

    // grid (log decades)
    ctx.strokeStyle = "#262626";
    ctx.lineWidth = 1;

    const xDec = [-2, -1, 0, 1];   // 1e-2..1e1
    const yDec = [-3, -2, -1, 0];  // 1e-3..1
    for (const d of xDec) {
      const x = Math.pow(10, d);
      const xp = map.x2px(x);
      ctx.beginPath();
      ctx.moveTo(xp, padT);
      ctx.lineTo(xp, H - padB);
      ctx.stroke();
    }
    for (const d of yDec) {
      const y = Math.pow(10, d);
      const yp = map.y2px(y);
      ctx.beginPath();
      ctx.moveTo(padL, yp);
      ctx.lineTo(W - padR, yp);
      ctx.stroke();
    }

    // axes box
    ctx.strokeStyle = "#cfcfcf";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(padL, padT, W - padL - padR, H - padT - padB);

    // labels
    ctx.fillStyle = "#eaeaea";
    ctx.font = "16px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText("Le Méhauté Wave Theory Validity (1976)", padL, padT + 18);

    ctx.font = "14px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText("D / T²", Math.floor((padL + (W - padR)) / 2) - 18, H - 18);

    ctx.save();
    ctx.translate(18, Math.floor((padT + (H - padB)) / 2) + 10);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("H / T²", 0, 0);
    ctx.restore();

    // decade tick labels
    ctx.fillStyle = "#bdbdbd";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";

    const xTicks = [1e-2, 1e-1, 1, 10];
    for (const xt of xTicks) {
      const xp = map.x2px(xt);
      const txt = (xt === 1) ? "1" : xt.toExponential(0).replace("e", "×10^");
      ctx.fillText(txt, xp - 18, H - padB + 18);
    }

    const yTicks = [1e-3, 1e-2, 1e-1, 1];
    for (const yt of yTicks) {
      const yp = map.y2px(yt);
      const txt = (yt === 1) ? "1" : yt.toExponential(0).replace("e", "×10^");
      ctx.fillText(txt, padL - 62, yp + 4);
    }
  }

  function shadeDepthBands(map, xline1, xline2) {
    const { ctx, padT, padB, H } = map;

    const x1 = clamp(xline1, XMIN, XMAX);
    const x2 = clamp(xline2, XMIN, XMAX);

    const Xp0 = map.x2px(XMIN);
    const Xp1 = map.x2px(x1);
    const Xp2 = map.x2px(x2);
    const Xp3 = map.x2px(XMAX);

    const yTop = padT;
    const yBot = H - padB;

    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(Xp0, yTop, Xp1 - Xp0, yBot - yTop);

    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fillRect(Xp1, yTop, Xp2 - Xp1, yBot - yTop);

    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.fillRect(Xp2, yTop, Xp3 - Xp2, yBot - yTop);
    ctx.restore();
  }

  function drawVerticalSeparators(map, xline1, xline2) {
    const { ctx, padT, padB, H } = map;

    ctx.save();
    ctx.strokeStyle = "#bdbdbd";
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;

    for (const xl of [xline1, xline2]) {
      const x = clamp(xl, XMIN, XMAX);
      const xp = map.x2px(x);
      ctx.beginPath();
      ctx.moveTo(xp, padT);
      ctx.lineTo(xp, H - padB);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCurves(map, curves) {
    const { ctx } = map;

    ctx.save();
    ctx.strokeStyle = "#e6e6e6";
    ctx.lineWidth = 1.5;

    for (const c of curves) {
      const xs = c.x;
      const ys = c.y;
      if (!Array.isArray(xs) || !Array.isArray(ys) || xs.length !== ys.length) continue;

      ctx.beginPath();
      let started = false;

      for (let i = 0; i < xs.length; i++) {
        const xi = xs[i], yi = ys[i];
        if (!(xi > 0 && yi > 0)) continue;
        if (xi < XMIN || xi > XMAX || yi < YMIN || yi > YMAX) continue;

        const xp = map.x2px(xi);
        const yp = map.y2px(yi);

        if (!started) { ctx.moveTo(xp, yp); started = true; }
        else { ctx.lineTo(xp, yp); }
      }
      if (started) ctx.stroke();
    }

    ctx.restore();
  }

  // log-log interpolation for y(x) on a curve
  function interpLogLog(xArr, yArr, x0) {
    const pts = [];
    for (let i = 0; i < xArr.length; i++) {
      const x = xArr[i], y = yArr[i];
      if (x > 0 && y > 0 && Number.isFinite(x) && Number.isFinite(y)) pts.push([x, y]);
    }
    if (pts.length < 2) return NaN;

    pts.sort((a, b) => a[0] - b[0]);
    if (x0 < pts[0][0] || x0 > pts[pts.length - 1][0]) return NaN;

    let j = 0;
    while (j < pts.length - 2 && pts[j + 1][0] < x0) j++;

    const x1 = pts[j][0], y1 = pts[j][1];
    const x2 = pts[j + 1][0], y2 = pts[j + 1][1];

    const lx1 = log10(x1), lx2 = log10(x2), lx0 = log10(x0);
    const ly1 = log10(y1), ly2 = log10(y2);

    const t = (lx0 - lx1) / (lx2 - lx1 + 1e-12);
    const ly0 = ly1 + t * (ly2 - ly1);
    return Math.pow(10, ly0);
  }

  function classifyDepthRegion(xpoint, xline1, xline2) {
    if (xpoint < xline1) return "Shallow water waves";
    if (xpoint < xline2) return "Intermediate water waves";
    return "Deep water waves";
  }

  function classifyTheoryRegion(xpoint, ypoint, curves) {
    const yAtX = [];
    for (const c of curves) {
      const y = interpLogLog(c.x, c.y, xpoint);
      if (Number.isFinite(y)) yAtX.push(y);
    }
    if (yAtX.length === 0) return "Unknown theory region";

    yAtX.sort((a, b) => a - b);

    if (ypoint <= yAtX[0]) return "Airy (Linear theory)";
    if (yAtX.length >= 2 && ypoint <= yAtX[1]) return "Stokes 2nd order";
    if (yAtX.length >= 3 && ypoint <= yAtX[2]) return "Stokes 3rd order";
    return "Stokes 4th order or higher";
  }

  function drawPointAndLabel(map, xpoint, ypoint, labelStr) {
    const { ctx } = map;

    const xp = map.x2px(clamp(xpoint, XMIN, XMAX));
    const yp = map.y2px(clamp(ypoint, YMIN, YMAX));

    ctx.save();
    ctx.strokeStyle = "#ff5a5a";
    ctx.fillStyle = "#ff5a5a";
    ctx.lineWidth = 2;

    const r = 7;
    ctx.beginPath();
    ctx.moveTo(xp - r, yp);
    ctx.lineTo(xp + r, yp);
    ctx.moveTo(xp, yp - r);
    ctx.lineTo(xp, yp + r);
    ctx.stroke();

    ctx.font = "13px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText("your case", xp + 10, yp - 8);

    // info box
    const boxX = map.padL + 12;
    const boxY = map.padT + 34;
    const lines = labelStr.split("\n");

    ctx.font = "13px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    const lineH = 16;
    let wMax = 0;
    for (const ln of lines) wMax = Math.max(wMax, ctx.measureText(ln).width);

    const pad = 8;
    const boxW = wMax + 2 * pad;
    const boxH = lines.length * lineH + 2 * pad;

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.strokeStyle = "rgba(60,60,60,0.9)";
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#111";
    let yy = boxY + pad + 12;
    for (const ln of lines) {
      ctx.fillText(ln, boxX + pad, yy);
      yy += lineH;
    }

    ctx.restore();
  }

  async function loadCurves() {
    const url = curvesUrl();
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status} loading ${url}`);
    const data = await resp.json();

    // Validate expected structure
    if (!data || typeof data.xline1 !== "number" || typeof data.xline2 !== "number" || !Array.isArray(data.curves)) {
      throw new Error("curves.json has unexpected structure");
    }
    return data;
  }

  function computeAndPlot() {
    const outEl = el("out");
    const canvas = el("chart");

    if (!outEl || !canvas) return;

    const H = Number(el("H")?.value);
    const T = Number(el("T")?.value);
    const D = Number(el("D")?.value);

    const map = makeMapper(canvas);

    if (!(H > 0 && T > 0 && D > 0)) {
      outEl.textContent = "Enter positive H, T, and D.";
      drawAxes(map);
      return;
    }

    const xpoint = D / (T * T);
    const ypoint = H / (T * T);

    const xline1 = CURVES.xline1;
    const xline2 = CURVES.xline2;

    const depthRegion = classifyDepthRegion(xpoint, xline1, xline2);
    const theoryRegion = classifyTheoryRegion(xpoint, ypoint, CURVES.curves);

    drawAxes(map);
    shadeDepthBands(map, xline1, xline2);
    drawVerticalSeparators(map, xline1, xline2);
    drawCurves(map, CURVES.curves);

    const labelStr =
      `Region: ${depthRegion}\n` +
      `Theory: ${theoryRegion}\n` +
      `D/T² = ${xpoint.toPrecision(3)}\n` +
      `H/T² = ${ypoint.toPrecision(3)}`;

    drawPointAndLabel(map, xpoint, ypoint, labelStr);

    outEl.textContent =
      `D/T² = ${xpoint}\n` +
      `H/T² = ${ypoint}\n` +
      `Depth regime: ${depthRegion}\n` +
      `Recommended theory: ${theoryRegion}`;
  }

  async function init() {
    const canvas = el("chart");
    const outEl = el("out");
    if (!canvas) throw new Error("Canvas #chart not found.");
    if (!outEl) throw new Error("Output #out not found.");

    // roundRect polyfill
    const ctx = canvas.getContext("2d");
    if (!ctx.roundRect) {
      CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        this.beginPath();
        this.moveTo(x + rr, y);
        this.arcTo(x + w, y, x + w, y + h, rr);
        this.arcTo(x + w, y + h, x, y + h, rr);
        this.arcTo(x, y + h, x, y, rr);
        this.arcTo(x, y, x + w, y, rr);
        this.closePath();
        return this;
      };
    }

    CURVES = await loadCurves();

    const btn = el("plotBtn");
    if (!btn) throw new Error("Button #plotBtn not found.");
    btn.addEventListener("click", computeAndPlot);

    computeAndPlot();
  }

  init().catch((e) => {
    console.error(e);
    const out = el("out");
    if (out) out.textContent = `Failed to load curves.\n${e.message}`;
  });

})();
