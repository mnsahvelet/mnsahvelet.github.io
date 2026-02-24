(() => {
  "use strict";

  function el(id) {
    return document.getElementById(id);
  }

  function readParams() {
    return {
      T: parseFloat(el("T").value),
      d: parseFloat(el("d").value),
      Lb: parseFloat(el("Lb").value),
      theta0: parseFloat(el("theta0").value),
      dx: parseFloat(el("dx").value),
      xMax: parseFloat(el("xMax").value),
      yMax: parseFloat(el("yMax").value)
    };
  }

  function updateDispersion(T, d) {
    const out = window.ED_SOLVER.dispersionOutputs(T, d);

    el("out_omega").textContent = out.omega.toFixed(6);
    el("out_L").textContent = out.L.toFixed(4);
    el("out_L0").textContent = out.L0.toFixed(4);
    el("out_k").textContent = out.k.toFixed(8);
    el("out_k0").textContent = out.k0.toFixed(8);
    el("out_kh").textContent = out.kh.toFixed(4);

    return out;
  }

  function computeAndPlot() {
    const status = el("status");
    status.textContent = "Computing...";

    try {
      const params = readParams();

      // dispersion
      updateDispersion(params.T, params.d);

      // grid
      const out = window.ED_SOLVER.computeKdGrid(params);

      if (!out || !out.Kd) {
        throw new Error("Solver returned invalid grid.");
      }

      // centerline = first row (loc = 0)
      const centerKd = out.Kd[0];

      const levelsStr = el("levels").value;
      const levels = window.ED_SOLVER.parseLevels(levelsStr);

      // plots
      window.ED_PLOTS.plotMap("plotMap", out.xvals, out.yvals, out.Kd, params.Lb);
      window.ED_PLOTS.plotCenterline("plotCenter", out.xvals, centerKd);
      window.ED_PLOTS.plotContour("plotContour", out.xvals, out.yvals, out.Kd, params.Lb, levels);

      status.textContent =
        `Done. Grid: ${out.xvals.length} × ${out.yvals.length}.`;

    } catch (err) {
      status.textContent = "Error: " + err.message;
      console.error(err);
    }
  }

  function init() {
    el("updateBtn").addEventListener("click", computeAndPlot);
    computeAndPlot(); // auto-run once
  }

  document.addEventListener("DOMContentLoaded", init);

})();
