(() => {
  "use strict";

  const el = (id) => document.getElementById(id);

  function num(id) {
    const v = Number(el(id)?.value);
    return v;
  }

  function setText(id, value, digits = 6) {
    const node = el(id);
    if (!node) return;
    if (!isFinite(value)) {
      node.textContent = "–";
      return;
    }
    node.textContent = value.toFixed(digits);
  }

  function buildParams() {
    // IMPORTANT: must match solver.js expected names: T, d, B, theta0, dx, xMax, yMax
    return {
      T: num("T"),
      d: num("d"),
      B: num("Lb"),          // Lb input in UI -> B in solver
      theta0: num("theta0"),
      dx: num("dx"),
      xMax: num("xMax"),
      yMax: num("yMax"),
      // optional
      dy: num("dx")
    };
  }

  function sanityCheck(params) {
    const bad = [];
    for (const k of ["T", "d", "B", "theta0", "dx", "xMax", "yMax"]) {
      if (!isFinite(params[k])) bad.push(k);
    }
    return bad;
  }

  function update() {
    const status = el("status");

    try {
      if (!window.ED_SOLVER) throw new Error("ED_SOLVER not found (solver.js not loaded).");
      if (!window.WIEGEL_TABLES) throw new Error("WIEGEL_TABLES not found (tables_wiegel.js not loaded).");
      if (!window.ED_PLOTS) throw new Error("ED_PLOTS not found (plots.js not loaded).");

      const params = buildParams();
      const bad = sanityCheck(params);
      if (bad.length) {
        throw new Error(`Bad inputs: ${bad.join(", ")} (check app.js id mapping).`);
      }

      // dispersion outputs
      const disp = window.ED_SOLVER.dispersionOutputs(params.T, params.d);
      setText("out_omega", disp.omega, 6);
      setText("out_L",     disp.L,     4);
      setText("out_L0",    disp.L0,    4);
      setText("out_k",     disp.k,     8);
      setText("out_k0",    disp.k0,    8);
      setText("out_kh",    disp.kh,    4);

      // grid
      const t0 = performance.now();
      const grid = window.ED_SOLVER.computeKdGrid(params);

      // detect all-NaN
      const flat = grid.Kd.flat();
      const anyFinite = flat.some(v => Number.isFinite(v));
      if (!anyFinite) {
        throw new Error("Kd grid is all NaN (input mapping issue or interpolation failure).");
      }

      // centerline at loc=0 (y closest to 0)
      let iy0 = 0;
      let best = Infinity;
      for (let i = 0; i < grid.yvals.length; i++) {
        const d = Math.abs(grid.yvals[i] - 0);
        if (d < best) { best = d; iy0 = i; }
      }
      const centerKd = grid.Kd[iy0].map(v => (isFinite(v) ? v : null));

      // contour levels
      const levels = window.ED_SOLVER.parseLevels(el("levels")?.value);

      // plots
      window.ED_PLOTS.plotKdMap("plotMap", grid.xvals, grid.yvals, grid.Kd, params.B);
      window.ED_PLOTS.plotCenterline("plotCenter", grid.xvals, centerKd);
      window.ED_PLOTS.plotContour("plotContour", grid.xvals, grid.yvals, grid.Kd, params.B, levels);

      const t1 = performance.now();
      status.textContent = `Done. Grid: ${grid.xvals.length} × ${grid.yvals.length}. Time: ${Math.round(t1 - t0)} ms.`;

    } catch (err) {
      if (status) status.textContent = `Error: ${err.message}`;
      // also log full error for debugging
      console.error(err);
    }
  }

  function init() {
    const btn = el("updateBtn");
    if (btn) btn.addEventListener("click", update);
    // auto-run once
    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
