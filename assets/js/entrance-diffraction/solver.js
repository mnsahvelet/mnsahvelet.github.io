(() => {
  "use strict";

  const g = 9.81;

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  function isNum(x) {
    return Number.isFinite(x);
  }

  // Piecewise linear interpolation (clamped to endpoints)
  function interp1(xArr, yArr, x0) {
    if (!Array.isArray(xArr) || !Array.isArray(yArr)) return NaN;
    if (xArr.length < 2 || yArr.length < 2) return NaN;
    if (xArr.length !== yArr.length) return NaN;
    if (!isNum(x0)) return NaN;

    // copy
    const x = xArr.slice();
    const y = yArr.slice();

    // ensure increasing x
    if ((x[1] - x[0]) < 0) {
      x.reverse();
      y.reverse();
    }

    const n = x.length;

    // clamp x0 to domain
    if (x0 <= x[0]) return y[0];
    if (x0 >= x[n - 1]) return y[n - 1];

    // find interval
    let b = x.findIndex(v => x0 <= v);
    if (b < 1) b = 1;
    const a = b - 1;

    const x1 = x[a], x2 = x[b];
    const y1 = y[a], y2 = y[b];

    const dx = x2 - x1;
    if (!isNum(dx) || dx === 0) return NaN;

    return y1 + (y2 - y1) * (x0 - x1) / dx;
  }

  // Solve dispersion for k: omega^2 = g k tanh(kh)
  function solveK(T, h) {
    T = Number(T);
    h = Number(h);
    if (!isNum(T) || !isNum(h) || T <= 0 || h <= 0) return NaN;

    const omega = 2 * Math.PI / T;
    const target = omega * omega;

    // deep water guess: omega^2 = g k
    let k = target / g;
    if (!isFinite(k) || k <= 0) k = 1e-3;

    for (let it = 0; it < 60; it++) {
      const kh = k * h;
      const th = Math.tanh(kh);
      const f = g * k * th - target;

      const sech = 1 / Math.cosh(kh);
      const dfdk = g * (th + k * h * sech * sech);

      if (!isFinite(dfdk) || dfdk === 0) break;

      const dk = f / dfdk;
      k -= dk;

      if (!isFinite(k)) return NaN;

      if (Math.abs(dk) < 1e-12 * Math.max(1, Math.abs(k))) break;
      if (k <= 0) k = 1e-8;
    }

    return k;
  }

  function dispersionOutputs(T, h) {
    const omega = 2 * Math.PI / Number(T);
    const k = solveK(T, h);

    if (!isNum(k) || k <= 0 || !isNum(omega)) {
      return { omega: NaN, k: NaN, L: NaN, k0: NaN, L0: NaN, kh: NaN };
    }

    const L = 2 * Math.PI / k;

    const L0 = g * Number(T) * Number(T) / (2 * Math.PI);
    const k0 = 2 * Math.PI / L0;

    return { omega, k, L, k0, L0, kh: k * Number(h) };
  }

  // Wiegel table-based Kd
  // Inputs: period (s), depth (m), theta (deg), R (m), beta (deg)
  function Kd_wiegel(period, depth, theta, R_distance, beta) {
    // verify tables loaded
    if (!window.WIEGEL_TABLES || !window.WIEGEL_TABLES[15]) {
      console.error("WIEGEL_TABLES missing. Check script path/load order for tables_wiegel.js");
      return NaN;
    }

    period = Number(period);
    depth = Number(depth);
    theta = Number(theta);
    R_distance = Number(R_distance);
    beta = Number(beta);

    if (!isNum(period) || !isNum(depth) || period <= 0 || depth <= 0) return NaN;
    if (!isNum(R_distance) || R_distance < 0) return NaN;

    // clamp to Wiegel ranges
    beta  = clamp(beta, 0, 180);
    theta = clamp(theta, 15, 180);

    const k = solveK(period, depth);
    if (!isNum(k) || k <= 0) return NaN;

    const WL = (2 * Math.PI) / k; // wavelength
    if (!isNum(WL) || WL <= 0) return NaN;

    const rL_arr    = [0, 0.5, 1, 2, 5, 10];
    const beta_arr  = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];
    const theta_arr = [15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];

    const rL0 = R_distance / WL;

    const Kd_theta = new Array(theta_arr.length).fill(NaN);

    for (let j = 0; j < theta_arr.length; j++) {
      const th = theta_arr[j];
      const M = window.WIEGEL_TABLES[th]; // must be 6x13

      if (!M || !Array.isArray(M) || M.length !== 6) {
        console.error(`Wiegel table missing/invalid for theta=${th}.`);
        return NaN;
      }

      // interpolate in beta for each r/L row
      const Kd_rL_beta = new Array(rL_arr.length);
      for (let i = 0; i < rL_arr.length; i++) {
        const row = M[i];
        if (!row || row.length !== beta_arr.length) {
          console.error(`Wiegel table row invalid at theta=${th}, row i=${i}.`);
          return NaN;
        }
        Kd_rL_beta[i] = interp1(beta_arr, row, beta);
      }

      // interpolate in r/L
      Kd_theta[j] = interp1(rL_arr, Kd_rL_beta, rL0);
    }

    // final interpolate in theta
    return interp1(theta_arr, Kd_theta, theta);
  }

  // Compute grid for a FINITE breakwater segment from (0,0) to (0,B)
  // dist = x >= 0, loc = y in [0, yMax]
  function computeKdGrid(params) {
    const dx = Number(params.dx);
    const dy = (params.dy != null) ? Number(params.dy) : dx;

    const xMax = Number(params.xMax);
    const yMax = Number(params.yMax);

    const B = Number(params.B); // breakwater length (Lb)
    const T = Number(params.T);
    const d = Number(params.d);
    const theta0 = Number(params.theta0);

    if (![dx, dy, xMax, yMax, B, T, d, theta0].every(isNum)) {
      console.error("computeKdGrid: params contain NaN:", params);
      return { xvals: [], yvals: [], Kd: [] };
    }
    if (dx <= 0 || dy <= 0 || xMax < 0 || yMax < 0 || B < 0 || T <= 0 || d <= 0) {
      console.error("computeKdGrid: invalid parameter ranges:", params);
      return { xvals: [], yvals: [], Kd: [] };
    }

    const xvals = [];
    const yvals = [];

    for (let x = 0; x <= xMax + 1e-12; x += dx) xvals.push(+x.toFixed(10));
    for (let y = 0; y <= yMax + 1e-12; y += dy) yvals.push(+y.toFixed(10));

    const k = solveK(T, d); // phase term
    if (!isNum(k) || k <= 0) {
      console.error("computeKdGrid: dispersion solveK failed.");
      return { xvals, yvals, Kd: yvals.map(() => xvals.map(() => NaN)) };
    }

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

        // absolute to map into [0,180]
        const b2 = (Math.atan2(Math.abs(y2), x) * 180 / Math.PI);

        const K1 = Kd_wiegel(T, d, theta0, r1, b1);
        const K2 = Kd_wiegel(T, d, theta0, r2, b2);

        if (!isNum(K1) || !isNum(K2)) {
          row[j] = NaN;
          continue;
        }

        // interference magnitude
        let K = Math.sqrt(
          K1 * K1 + K2 * K2 + 2 * K1 * K2 * Math.cos(k * (r2 - r1))
        );

        if (!isNum(K)) K = NaN;
        else K = clamp(K, 0, 1);

        row[j] = K;
      }

      Kd[i] = row;
    }

    return { xvals, yvals, Kd };
  }

  function parseLevels(str) {
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

    const out = s
      .split(",")
      .map(v => parseFloat(v.trim()))
      .filter(v => isFinite(v));

    return out.length ? out : null;
  }

  // expose
  window.ED_SOLVER = {
    dispersionOutputs,
    computeKdGrid,
    parseLevels
  };

})();
