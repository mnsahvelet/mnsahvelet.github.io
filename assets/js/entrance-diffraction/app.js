(() => {
  "use strict";

  const el = (id) => document.getElementById(id);

  function fmt(x, nd=6) {
    if (!isFinite(x)) return "NaN";
    return x.toFixed(nd);
  }

  function setStatus(msg) {
    el("status").textContent = msg;
  }

  function readParams() {
    const T = parseFloat(el("T").value);
    const d = parseFloat(el("d").value);
    const Lb = parseFloat(el("Lb").value);
    const theta0 = parseFloat(el("theta0").value);
    const dx = parseFloat(el("dx").value);
    const xMax = parseFloat(el("xMax").value);
    const yMax = parseFloat(el("yMax").value);

    if (![T,d,Lb,theta0,dx,xMax,yMax].every(v => isFinite(v))) {
      throw new Error("All inputs must be numeric.");
    }
    if (T <= 0 || d <= 0) throw new Error("T and d must be > 0.");
    if (Lb <= 0) throw new Error("Lb must be > 0.");
    if (dx <= 0) throw new Error("dx must be > 0.");
    if (xMax <= 0 || yMax <= 0) throw new Error("xMax and yMax must be > 0.");

    const levels = window.ED_SOLVER.parseLevels(el("levels").value);

    return { T, d, Lb, theta0, dx, xMax, yMax, levels };
  }

  function updateOutputs(disp) {
    el("out_omega").textContent = fmt(disp.omega, 6);
    el("out_L").textContent     = fmt(disp.L, 4);
    el("out_L0").textContent    = fmt(disp.L0, 4);
    el("out_k").textContent     = fmt(disp.k, 8);
    el("out_k0").textContent    = fmt(disp.k0, 8);
    el("out_kh").textContent    = fmt(disp.kh, 4);
  }

  async function update() {
    try {
      setStatus("Computing…");
      const p = readParams();

      // dispersion outputs
      const disp = window.ED_SOLVER.dispersionOutputs(p.T, p.d);
      updateOutputs(disp);

      // compute Kd grid
      const t0 = performance.now();
      const out = window.ED_SOLVER.computeKdGrid(p);
      const t1 = performance.now();

      // centerline (loc=0 corresponds to first y row)
      const centerKd = out.Kd[0];

      // plots
      window.ED_PLOTS.plotMap("plotMap", out.xvals, out.yvals, out.Kd, p.Lb);
      window.ED_PLOTS.plotCenterline("plotCenter", out.xvals, centerKd);
      window.ED_PLOTS.plotContour("plotContour", out.xvals, out.yvals, out.Kd, p.Lb, p.levels);

      setStatus(`Done. Grid: ${out.xvals.length} × ${out.yvals.length}. Time: ${(t1 - t0).toFixed(0)} ms.`);
    } catch (e) {
      setStatus(`Error: ${e.message}`);
      console.error(e);
    }
  }

  function init() {
    el("updateBtn").addEventListener("click", update);
    update();
    window.addEventListener("resize", () => {
      // Plotly responsive handles it, but this helps if containers change
      Plotly.Plots.resize("plotMap");
      Plotly.Plots.resize("plotCenter");
      Plotly.Plots.resize("plotContour");
    });
  }

  window.addEventListener("DOMContentLoaded", init);
})();
