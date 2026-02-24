(() => {
  "use strict";

  const g = 9.81;

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  // Piecewise linear interpolation
  function interp1(xArr, yArr, x0) {
    const x = xArr.slice();
    const y = yArr.slice();

    // ensure increasing
    if (x.length >= 2 && (x[1] - x[0]) < 0) {
      x.reverse();
      y.reverse();
    }

    const n = x.length;

    let a = 0, b = 1;
    if (x0 <= x[0]) {
      a = 0; b = 1;
    } else if (x0 >= x[n - 1]) {
      a = n - 2; b = n - 1;
    } else {
      b = x.findIndex(v => x0 <= v);
      a = Math.max(0, b - 1);
    }

    const x1 = x[a], x2 = x[b];
    const y1 = y[a], y2 = y[b];
    if ((x2 - x1) === 0) return NaN;

    return y1 + (y2 - y1) * (x0 - x1) / (x2 - x1);
  }

  // Dispersion: solve k from omega^2 = g k tanh(k h)
  function solveK(T, h) {
    const omega = 2 * Math.PI / T;
    const target = omega * omega;

    // initial guess: deep water
    let k = target / g;
    if (!isFinite(k) || k <= 0) k = 1e-3;

    for (let it = 0; it < 60; it++) {
      const kh = k * h;
      const th = Math.tanh(kh);
      const f = g * k * th - target;

      const sech = 1 / Math.cosh(kh);
      const dfdk = g * (th + k * h * sech * sech);

      const dk = f / dfdk;
      k -= dk;

      if (Math.abs(dk) < 1e-12 * Math.max(1, k)) break;
      if (k <= 0) k = 1e-8;
    }
    return k;
  }

  function dispersionOutputs(T, h) {
    const omega = 2 * Math.PI / T;
    const k = solveK(T, h);
    const L = 2 * Math.PI / k;

    const L0 = g * T * T / (2 * Math.PI);
    const k0 = 2 * Math.PI / L0;

    return { omega, k, L, k0, L0, kh: k * h };
  }

  // Wiegel table-based Kd
  // Inputs: period (s), depth (m), theta (deg), R (m), beta (deg)
  function Kd_wiegel(period, depth, theta, R_distance, beta) {
    // clamp exactly like MATLAB
    beta  = clamp(beta, 0, 180);
    theta = clamp(theta, 15, 180);

    const k = solveK(period, depth);
    const WL = (2 * Math.PI) / k; // wavelength
    if (!isFinite(WL) || WL <= 0) return NaN;

    const rL_arr    = [0, 0.5, 1, 2, 5, 10];
    const beta_arr  = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];
    const theta_arr = [15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];

    const rL0 = R_distance / WL;

    // For each theta-table:
    //  1) interp in beta for each r/L row -> vector length 6
    //  2) interp in r/L -> scalar Kd at that theta
    // Then interp in theta.
    const Kd_theta = new Array(theta_arr.length).fill(NaN);

    for (let j = 0; j < theta_arr.length; j++) {
      const th = theta_arr[j];
      const M = window.WIEGEL_TABLES[th]; // 6x13

      const Kd_rL_beta = new Array(rL_arr.length);
      for (let i = 0; i < rL_arr.length; i++) {
        Kd_rL_beta[i] = interp1(beta_arr, M[i], beta);
      }
      Kd_theta[j] = interp1(rL_arr, Kd_rL_beta, rL0);
    }

    return interp1(theta_arr, Kd_theta, theta);
  }

  // Compute grid for a FINITE breakwater segment from (0,0) to (0,B)
  // dist = x >= 0, loc = y in [0, yMax]
  function computeKdGrid(params) {
    const dx = Number(params.dx);
    const dy = (params.dy != null) ? Number(params.dy) : dx;

    const xMax = Number(params.xMax);
    const yMax = Number(params.yMax);

    const B = Number(params.B);          // breakwater length (Lb)
    const T = Number(params.T);
    const d = Number(params.d);
    const theta0 = Number(params.theta0);

    const xvals = [];
    const yvals = [];

    for (let x = 0; x <= xMax + 1e-12; x += dx) xvals.push(+x.toFixed(10));
    for (let y = 0; y <= yMax + 1e-12; y += dy) yvals.push(+y.toFixed(10));

    const k = solveK(T, d); // for interference term
    const Kd = new Array(yvals.length);

    for (let i = 0; i < yvals.length; i++) {
      const y = yvals[i];
      const row = new Array(xvals.length);

      for (let j = 0; j < xvals.length; j++) {
        const x = xvals[j];

        // Tip 1 at (0,0)
        const r1 = Math.hypot(x, y);
        const b1 = (Math.atan2(y, x) * 180 / Math.PI);

        // Tip 2 at (0,B)
        const y2 = y - B;
        const r2 = Math.hypot(x, y2);

        // Use absolute for beta so both sides map into [0,180] consistently
        const b2 = (Math.atan2(Math.abs(y2), x) * 180 / Math.PI);

        const K1 = Kd_wiegel(T, d, theta0, r1, b1);
        const K2 = Kd_wiegel(T, d, theta0, r2, b2);

        // If any NaN, fall back safely
        if (!isFinite(K1) || !isFinite(K2) || !isFinite(k)) {
          row[j] = NaN;
          continue;
        }

        // Complex-amplitude style interference:
        // |A1 e^{ikr1} + A2 e^{ikr2}| with A ~ Kd (real)
        let K = Math.sqrt(
          K1 * K1 + K2 * K2 + 2 * K1 * K2 * Math.cos(k * (r2 - r1))
        );

        // Clamp to physical range
        K = clamp(K, 0, 1);

        row[j] = K;
      }

      Kd[i] = row;
    }

    return { xvals, yvals, Kd };
  }

  function parseLevels(str) {
    // accepts "0:0.05:1" or "0,0.1,0.2,..." or empty
    const s = (str || "").trim();
    if (!s) return null;

    if (s.includes(":")) {
      const parts = s.split(":").map(v => parseFloat(v.trim()));
      if (parts.length !== 3 || parts.some(v => !isFinite(v))) return null;
      const [a, step, b] = parts;
      if (step <= 0) return null;
      const out = [];
      for (let v = a; v <= b + 1e-12; v += step) out.push(v);
      return out;
    }

    const out = s.split(",").map(v => parseFloat(v.trim())).filter(v => isFinite(v));
    return out.length ? out : null;
  }

  // expose
  window.ED_SOLVER = {
    dispersionOutputs,
    computeKdGrid,
    parseLevels
  };

})();
