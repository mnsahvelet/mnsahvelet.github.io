(() => {
  "use strict";

  const el = (id) => document.getElementById(id);

  function fmt(x, n = 6) {
    return (Number.isFinite(x) ? x.toFixed(n) : "–");
  }

  function readParams() {
    return {
      T:      parseFloat(el("T").value),
      d:      parseFloat(el("d").value),
      B:      parseFloat(el("Lb").value),      // breakwater length Lb
      theta0: parseFloat(el("theta0").value),
      dx:     parseFloat(el("dx").value),
      xMax:   parseFloat(el("xMax").value),
      yMax:   parseFloat(el("yMax").value),
      levels: el("levels").value
    };
  }

  function setStatus(msg) {
    const s = el("status");
    if (s) s.textContent = msg;
  }

  function sanityCheckTables() {
    if (!window.WIEGEL_TABLES) return "WIEGEL_TABLES is not loaded.";
    const must = [15,30,45,60,75,90,105,120,135,150,165,180];
    for (const th of must) {
      const M = window.WIEGEL_TABLES[th];
      if (!M || !Array.isArray(M) || M.length !== 6) return `Missing/invalid table at theta=${th}.`;
      if (!Array.isArray(M[0]) || M[0].length !== 13) return `Invalid table size at theta=${th} (expected 6x13).`;
    }
    return null;
  }

  function finiteStats2D(Z) {
    let n = 0, nFinite = 0;
    let zmin = +Infinity, zmax = -Infinity;
    for (let i = 0; i < Z.length; i++) {
      const row = Z[i];
      for (let j = 0; j < row.length; j++) {
        n++;
        const v = row[j];
        if (Number.isFinite(v)) {
          nFinite++;
          if (v < zmin) zmin = v;
          if (v > zmax) zmax = v;
        }
      }
    }
    if (nFinite === 0) return { n, nFinite, zmin: NaN, zmax: NaN };
    return { n, nFinite, zmin, zmax };
  }

  function computeAndPlot() {
    // Hard dependency checks
    if (!window.Plotly) {
      setStatus("Error: Plotly did not load.");
      return;
    }
    if (!window.ED_SOLVER) {
      setStatus("Error: solver.js did not load (ED_SOLVER missing).");
      return;
    }
    if (!window.ED_PLOTS) {
      setStatus("Error: plots.js did not load (ED_PLOTS missing).");
      return;
    }

    const tableErr = sanityCheckTables();
    if (tableErr) {
      setStatus("Error: " + tableErr);
      return;
    }

    const p = readParams();

    // Basic input validation
    if (![p.T, p.d, p.B, p.theta0, p.dx, p.xMax, p.yMax].every(Number.isFinite)) {
      setStatus("Error: one or more inputs are not valid numbers.");
      return;
    }
    if (p.T <= 0 || p.d <= 0 || p.B <= 0 || p.dx <= 0 || p.xMax <= 0 || p.yMax <= 0) {
      setStatus("Error: inputs must be positive.");
      return;
    }

    const t0 = performance.now();

    // Dispersion outputs
    const disp = window.ED_SOLVER.dispersionOutputs(p.T, p.d);
    el("out_omega").textContent = fmt(disp.omega, 6);
    el("out_L").textContent     = fmt(disp.L, 4);
    el("out_L0").textContent    = fmt(disp.L0, 4);
    el("out_k").textContent     = fmt(disp.k, 8);
    el("out_k0").textContent    = fmt(disp.k0, 8);
    el("out_kh").textContent    = fmt(disp.kh, 4);

    // Kd grid
    const grid = window.ED_SOLVER.computeKdGrid({
      T: p.T,
      d: p.d,
      theta0: p.theta0,
      dx: p.dx,
      xMax: p.xMax,
      yMax: p.yMax
    });

    // Validate grid values (THIS is where your current page is likely failing)
    const st = finiteStats2D(grid.Kd);
    if (st.nFinite === 0) {
      setStatus("Error: Kd grid is all NaN (tables or interpolation issue).");
      return;
    }

    // Centerline at loc = 0 (first row y=0 because we build y from 0..yMax)
    const centerKd = grid.Kd[0].slice();

    // Contour levels
    const levels = window.ED_SOLVER.parseLevels(p.levels);

    // Plot (IMPORTANT: use ED_PLOTS.plotMap name)
    window.ED_PLOTS.plotMap("plotMap", grid.xvals, grid.yvals, grid.Kd, p.B);
    window.ED_PLOTS.plotCenterline("plotCenter", grid.xvals, centerKd);
    window.ED_PLOTS.plotContour("plotContour", grid.xvals, grid.yvals, grid.Kd, p.B, levels);

    const t1 = performance.now();
    setStatus(`Done. Grid: ${grid.xvals.length} × ${grid.yvals.length}. Finite: ${st.nFinite}/${st.n}. Time: ${(t1 - t0).toFixed(0)} ms.`);
  }

  function init() {
    const btn = el("updateBtn");
    if (btn) btn.addEventListener("click", computeAndPlot);

    // run once on load
    computeAndPlot();

    // redraw on resize
    window.addEventListener("resize", () => {
      // Plotly resize only, no recompute
      try {
        Plotly.Plots.resize("plotMap");
        Plotly.Plots.resize("plotCenter");
        Plotly.Plots.resize("plotContour");
      } catch (_) {}
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
