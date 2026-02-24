(() => {
  "use strict";

  const g = 9.81;

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  // Piecewise linear interpolation like your VBA/MATLAB version
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
    } else if (x0 > x[n - 1]) {
      a = n - 2; b = n - 1;
    } else {
      b = x.findIndex(v => x0 <= v);
      a = b - 1;
    }

    const x1 = x[a], x2 = x[b];
    const y1 = y[a], y2 = y[b];
    if ((x2 - x1) === 0) return NaN;
    return y1 + (y2 - y1) * (x0 - x1) / (x2 - x1);
  }

  // Dispersion: solve for k from omega^2 = g k tanh(k h)
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

      // derivative: d/dk [g k tanh(kh)] = g[tanh(kh) + k h sech^2(kh)]
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

    return {
      omega,
      k, L,
      k0, L0,
      kh: k * h
    };
  }

  // Wiegel table-based Kd
  // Inputs:
  //  period (s), depth (m), theta (deg), R_distance (m), beta (deg)
  function Kd_wiegel(period, depth, theta, R_distance, beta) {

    // clamp exactly like your MATLAB
    beta  = clamp(beta, 0, 180);
    theta = clamp(theta, 15, 180);

    const WL = (2 * Math.PI) / solveK(period, depth); // wavelength
    if (!isFinite(WL) || WL <= 0) return NaN;

    const rL_arr    = [0, 0.5, 1, 2, 5, 10];
    const beta_arr  = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];
    const theta_arr = [15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];

    const rL0 = R_distance / WL;

    // interpolate across theta:
    // for each theta table: (1) interp in beta for each r/L row -> vector of size 6
    //                      (2) interp in r/L -> scalar Kd at that theta
    // then interp in theta.
    const Kd_beta = new Array(theta_arr.length).fill(NaN);

    for (let j = 0; j < theta_arr.length; j++) {
      const th = theta_arr[j];
      const M = window.WIEGEL_TABLES[th]; // 6x13

      // interp in beta for each r/L row
      const Kd_rL_beta = [];
      for (let i = 0; i < rL_arr.length; i++) {
        Kd_rL_beta.push(interp1(beta_arr, M[i], beta));
      }

      // interp in r/L
      Kd_beta[j] = interp1(rL_arr, Kd_rL_beta, rL0);
    }

    // final interp in theta
    return interp1(theta_arr, Kd_beta, theta);
  }

  // Compute grid in (dist=x, loc=y) with tip at (0,0)
  function computeKdGrid(params) {
    const dx = params.dx;
    const xMax = params.xMax;
    const yMax = params.yMax;

    const xvals = [];
    const yvals = [];

    for (let x = 0; x <= xMax + 1e-12; x += dx) xvals.push(+x.toFixed(10));
    for (let y = 0; y <= yMax + 1e-12; y += dx) yvals.push(+y.toFixed(10));

    const Kd = new Array(yvals.length);

    for (let i = 0; i < yvals.length; i++) {
      const y = yvals[i];
      const row = new Array(xvals.length);

      for (let j = 0; j < xvals.length; j++) {
        const x = xvals[j];

        const R = Math.hypot(x, y);
        const beta = (Math.atan2(y, x) * 180 / Math.PI);

        row[j] = Kd_wiegel(params.T, params.d, params.theta0, R, beta);
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
