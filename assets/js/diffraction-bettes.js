(() => {
  "use strict";

  const g = 9.81;
  const el = (id) => document.getElementById(id);

  function init() {
    // ===== UI elements =====
    const TEl      = el("T");
    const hEl      = el("h");
    const LEl      = el("L");
    const dxEl     = el("dx");
    const dyEl     = el("dy");
    const xMaxEl   = el("xMax");
    const yMaxEl   = el("yMax");
    const thIncEl  = el("thetaInc");
    const nondimEl = el("nondim");

    const plotBtn  = el("plotBtn");
    const stopBtn  = el("stopBtn");

    const statusEl = el("status");
    const outOmega = el("out_omega");
    const outK     = el("out_k");
    const outL     = el("out_L");
    const outKh    = el("out_kh");

    const canvas = el("map");
    const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;

    if (!plotBtn || !stopBtn || !statusEl || !canvas || !ctx) {
      console.error("Missing required elements.", { plotBtn, stopBtn, statusEl, canvas, ctx });
      return;
    }

    let stopFlag = false;
    statusEl.textContent = "JS loaded. Click Plot.";

    // ============================================================
    // Complex arithmetic (minimal)
    // ============================================================
    class C {
      constructor(re, im){ this.re = re; this.im = im; }
      static add(a,b){ return new C(a.re+b.re, a.im+b.im); }
      static mul(a,b){ return new C(a.re*b.re - a.im*b.im, a.re*b.im + a.im*b.re); }
      static expi(phi){ return new C(Math.cos(phi), Math.sin(phi)); }
      static abs(a){ return Math.hypot(a.re, a.im); }
    }

    // ============================================================
    // Dispersion: solve k from omega^2 = g k tanh(k h)
    // ============================================================
    function solveK(T, h){
      const omega = 2*Math.PI / T;
      let k = (omega*omega)/g; // deep water guess
      for(let it=0; it<60; it++){
        const kh = k*h;
        const th = Math.tanh(kh);
        const sech2 = 1/(Math.cosh(kh)**2);
        const f  = g*k*th - omega*omega;
        const df = g*th + g*k*h*sech2;
        const dk = -f/df;
        k += dk;
        if(!isFinite(k) || k<=0) break;
        if(Math.abs(dk)/k < 1e-12) break;
      }
      return { omega, k, L: 2*Math.PI/k, kh: k*h };
    }

    // ============================================================
    // Fresnel integrals C(x), S(x) (Cephes-like, accurate)
    // ============================================================
    function fresnelCS(x){
      const ax = Math.abs(x);
      const sign = (x < 0) ? -1 : 1;

      if (ax < 1e-8){
        const x2 = x*x;
        return { C: x, S: (Math.PI*x2*x)/6 };
      }

      function polevl(xx, coef){
        let ans = 0;
        for (let i=0; i<coef.length; i++) ans = ans*xx + coef[i];
        return ans;
      }
      function p1evl(xx, coef){
        let ans = xx + coef[0];
        for (let i=1; i<coef.length; i++) ans = ans*xx + coef[i];
        return ans;
      }

      // rational approximations for small/moderate x
      const SN = [
        -2.99181919401019853726E3,
         7.08840045257738576863E5,
        -6.29741486205862506537E7,
         2.54890880573376359104E9,
        -4.42979518059697779103E10,
         3.18016297876567817986E11,
      ];
      const SD = [
         2.81376268889994315696E2,
         4.55847810806532581675E4,
         5.17343888770096400730E6,
         4.19320245898111231129E8,
         2.24411795645340920940E10,
         6.07366389490084639049E11,
      ];
      const CN = [
        -4.98843114573573548651E-8,
         9.50428062829859605134E-6,
        -6.45191435683965050962E-4,
         1.88843319396703850064E-2,
        -2.05525900955013891793E-1,
         9.99999999999999998822E-1,
      ];
      const CD = [
         3.99982968972495980367E-12,
         9.15439215774657478799E-10,
         1.25001862479598821474E-7,
         1.22262789024179030997E-5,
         8.68029542941784300606E-4,
         4.12142090722199792936E-2,
         1.00000000000000000118E0,
      ];

      let Cval, Sval;

      if (ax <= 1.6){
        const x2 = ax*ax;
        const t  = x2*x2;

        Cval = ax * polevl(t, CN) / p1evl(t, CD);

        const numS = polevl(t, SN);
        const denS = p1evl(t, SD);
        Sval = ax * x2 * numS / denS;
      } else {
        // asymptotic expansions for large x
        const FN = [
          4.21543555043677546506E-1,
          1.43407919780758885261E-1,
          1.15220955073585758835E-2,
          3.45017939782574027900E-4,
          4.63613749287867322088E-6,
          3.05568983790257605827E-8,
          1.02304514164907233465E-10,
          1.72010743268161828879E-13,
          1.34283276233062758925E-16,
          3.76329711269987889006E-20,
        ];
        const FD = [
          1.00000000000000000000E0,
          7.51586398353378947175E-1,
          1.16888925859191382142E-1,
          6.44051526508858611005E-3,
          1.55934409164153020873E-4,
          1.84627567348930545870E-6,
          1.12699224763999035261E-8,
          3.60140029589371370404E-11,
          5.88754533621578410010E-14,
          4.52001434074129701496E-17,
          1.25443237090011264384E-20,
        ];
        const GN = [
          5.04442073643383265887E-1,
          1.97102833525523411709E-1,
          1.87648584092575249293E-2,
          6.84079380915393090172E-4,
          1.15138826111884280931E-5,
          9.82852443688422223854E-8,
          4.45344415861750144738E-10,
          1.08268041139020870318E-12,
          1.37555460633261799868E-15,
          8.36354435630677421531E-19,
          1.86958710162783235106E-22,
        ];
        const GD = [
          1.00000000000000000000E0,
          1.47495759925128324529E0,
          3.37748989120019970451E-1,
          2.53603741420338795122E-2,
          8.14679107184306179049E-4,
          1.27545075667729118702E-5,
          1.04314589657571990585E-7,
          4.60680728146520428211E-10,
          1.10273215066240270757E-12,
          1.38796531259578871258E-15,
          8.39158816283118707363E-19,
          1.86958710162783236342E-22,
        ];

        const x2 = ax*ax;
        const t = 0.5*Math.PI*x2;
        const s = Math.sin(t);
        const c = Math.cos(t);

        const u = 1/(Math.PI*ax);
        const uu = u*u;

        const f  = u  * polevl(uu, FN) / p1evl(uu, FD);
        const gg = uu * polevl(uu, GN) / p1evl(uu, GD);

        Cval = 0.5 + f*s - gg*c;
        Sval = 0.5 - f*c - gg*s;
      }

      return { C: sign*Cval, S: sign*Sval };
    }

    // ============================================================
    // Penney-Price / Sommerfeld factor (matches your MATLAB)
    // F = (1+i)/2 * ( (1-i)/2 + C(sigma) - i S(sigma) )
    // ============================================================
    function bettesF(sigma){
      const {C: M, S: N} = fresnelCS(sigma);
      const inside = new C(0.5 + M, -(0.5 + N));
      const pref   = new C(0.5, 0.5);
      return C.mul(pref, inside);
    }

    // ============================================================
    // Kd at a single point (MATCH MATLAB FORM)
    // ============================================================
    function bettesKdAtPoint(r, theta, L, theta0){
      const rSafe = Math.max(r, 1e-6);

      const k = 2*Math.PI/L;
      const fac = 2*Math.sqrt(k*rSafe/Math.PI);

      const s1 =  fac * Math.sin(0.5*(theta - theta0));
      const s2 = -fac * Math.sin(0.5*(theta + theta0));

      const F1 = bettesF(s1);
      const F2 = bettesF(s2);

      const ph1 = -k*rSafe*Math.cos(theta - theta0);
      const ph2 = -k*rSafe*Math.cos(theta + theta0);

      const t1 = C.mul(F1, C.expi(ph1));
      const t2 = C.mul(F2, C.expi(ph2));

      return C.abs(C.add(t1, t2));
    }

    // ============================================================
    // Color map
    // ============================================================
    function clamp01(x){ return Math.max(0, Math.min(1, x)); }

    function colormapViridisLike(t){
      t = clamp01(t);
      const stops = [
        [0.0,  48,  18,  59],
        [0.2,  65,  70, 171],
        [0.4,  42, 122, 185],
        [0.6,  26, 162, 135],
        [0.8,  94, 201,  98],
        [1.0, 253, 231,  37],
      ];
      for(let i=0; i<stops.length-1; i++){
        const a = stops[i], b = stops[i+1];
        if(t >= a[0] && t <= b[0]){
          const u = (t-a[0])/(b[0]-a[0]);
          return [
            Math.round(a[1] + u*(b[1]-a[1])),
            Math.round(a[2] + u*(b[2]-a[2])),
            Math.round(a[3] + u*(b[3]-a[3])),
          ];
        }
      }
      return [253,231,37];
    }

    // ============================================================
    // Canvas helpers
    // ============================================================
    function clearCanvas(){ ctx.clearRect(0,0,canvas.width, canvas.height); }

    function drawBreakwaterLine(y0Pix, y1Pix, xPix){
      ctx.save();
      ctx.strokeStyle = "rgba(0,0,0,0.95)";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(xPix, y0Pix);
      ctx.lineTo(xPix, y1Pix);
      ctx.stroke();
      ctx.restore();
    }

    function drawAxesLabels(xLabel, yLabel){
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "16px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText(xLabel, 18, canvas.height - 14);
      ctx.translate(14, canvas.height/2);
      ctx.rotate(-Math.PI/2);
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();
    }

    // ============================================================
    // Contours: marching squares + sparse labels
    // ============================================================
    function lerp(a,b,t){ return a + (b-a)*t; }

    function plotToPix(xPlot, yPlot, padL, padT, W, H, xMaxPlot, yMaxPlot){
      const x = padL + (xPlot/xMaxPlot) * (W-1);
      const y = padT + (H-1) - (yPlot/yMaxPlot) * (H-1);
      return {x, y};
    }

    function marchingSquares(kd, nx, ny, dxPlot, dyPlot, level){
      const segs = [];

      function interp(p1, p2, v1, v2){
        const t = (level - v1) / (v2 - v1 + 1e-15);
        return { x: lerp(p1.x, p2.x, t), y: lerp(p1.y, p2.y, t) };
      }

      // edges: 0 bottom, 1 right, 2 top, 3 left
      const lut = {
        1:  [[3,0]],
        2:  [[0,1]],
        3:  [[3,1]],
        4:  [[1,2]],
        5:  [[3,2],[0,1]],
        6:  [[0,2]],
        7:  [[3,2]],
        8:  [[2,3]],
        9:  [[0,2]],
        10: [[0,3],[1,2]],
        11: [[1,2]],
        12: [[1,3]],
        13: [[0,1]],
        14: [[3,0]],
      };

      // IMPORTANT:
      // kd indexing is still on the physical grid (i,j).
      // marching squares only needs dxPlot/dyPlot for GEOMETRY.
      for(let j=0; j<ny-1; j++){
        for(let i=0; i<nx-1; i++){
          const v00 = kd[j*nx + i];
          const v10 = kd[j*nx + (i+1)];
          const v01 = kd[(j+1)*nx + i];
          const v11 = kd[(j+1)*nx + (i+1)];

          const p00 = {x:i*dxPlot,     y:j*dyPlot};
          const p10 = {x:(i+1)*dxPlot, y:j*dyPlot};
          const p01 = {x:i*dxPlot,     y:(j+1)*dyPlot};
          const p11 = {x:(i+1)*dxPlot, y:(j+1)*dyPlot};

          const idx =
            ((v00 >= level) ? 1 : 0) |
            ((v10 >= level) ? 2 : 0) |
            ((v11 >= level) ? 4 : 0) |
            ((v01 >= level) ? 8 : 0);

          if (idx === 0 || idx === 15) continue;

          const e = new Array(4);
          if ((idx & 1) !== (idx & 2)) e[0] = interp(p00, p10, v00, v10);
          if ((idx & 2) !== (idx & 4)) e[1] = interp(p10, p11, v10, v11);
          if ((idx & 8) !== (idx & 4)) e[2] = interp(p01, p11, v01, v11);
          if ((idx & 1) !== (idx & 8)) e[3] = interp(p00, p01, v00, v01);

          const pairs = lut[idx];
          if (!pairs) continue;

          for (const [a,b] of pairs){
            if (e[a] && e[b]) segs.push([e[a], e[b]]);
          }
        }
      }
      return segs;
    }

    function drawContoursAndLabels(opts){
      const {
        ctx, padL, padT, W, H,
        xMaxPlot, yMaxPlot,
        dxPlot, dyPlot,
        nx, ny, kd, levels
      } = opts;

      ctx.save();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = "rgba(0,0,0,0.90)";
      ctx.fillStyle = "rgba(0,0,0,0.95)";
      ctx.font = "13px system-ui, -apple-system, Segoe UI, Roboto, Arial";

      for (const level of levels){
        const segs = marchingSquares(kd, nx, ny, dxPlot, dyPlot, level);

        // draw segments
        ctx.beginPath();
        for (const seg of segs){
          const a = plotToPix(seg[0].x, seg[0].y, padL, padT, W, H, xMaxPlot, yMaxPlot);
          const b = plotToPix(seg[1].x, seg[1].y, padL, padT, W, H, xMaxPlot, yMaxPlot);
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        }
        ctx.stroke();

        if (segs.length === 0) continue;

        // label sparse, avoid x very close to 0
        const label = level.toFixed(1);
        const desired = 6;
        const step = Math.max(1, Math.floor(segs.length / desired));

        let placed = 0;
        for (let s=0; s<segs.length && placed<desired; s+=step){
          const midPlot = {
            x: 0.5*(segs[s][0].x + segs[s][1].x),
            y: 0.5*(segs[s][0].y + segs[s][1].y)
          };

          if (midPlot.x < 0.06*xMaxPlot) continue;

          const mid = plotToPix(midPlot.x, midPlot.y, padL, padT, W, H, xMaxPlot, yMaxPlot);

          // halo
          ctx.save();
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = "rgba(255,255,255,0.90)";
          ctx.strokeText(label, mid.x + 4, mid.y - 4);
          ctx.restore();

          ctx.fillText(label, mid.x + 4, mid.y - 4);
          placed++;
        }
      }

      ctx.restore();
    }

    // ============================================================
    // Main compute + plot
    // ============================================================
    async function computeAndPlot(){
      stopFlag = false;
      plotBtn.disabled = true;
      stopBtn.disabled = false;

      const T = parseFloat(TEl.value);
      const h = parseFloat(hEl.value);
      const L_override = parseFloat(LEl.value);

      const dx = parseFloat(dxEl.value);
      const dy = parseFloat(dyEl.value);
      const xMax = parseFloat(xMaxEl.value);
      const yMax = parseFloat(yMaxEl.value);

      const thetaIncDeg = parseFloat(thIncEl.value);
      const doNonDim = !!(nondimEl && nondimEl.checked);

      if(!(T>0) || !(h>0) || !(dx>0) || !(dy>0) || !(xMax>0) || !(yMax>0)){
        statusEl.textContent = "Invalid inputs: all must be > 0.";
        plotBtn.disabled = false;
        stopBtn.disabled = true;
        return;
      }

      statusEl.textContent = "Computing…";

      // dispersion + wavelength
      const disp = solveK(T, h);
      const L = (isFinite(L_override) && L_override > 0) ? L_override : disp.L;

      const k = 2*Math.PI/L;
      const omega = disp.omega;
      const kh = k*h;

      if (outOmega) outOmega.textContent = omega.toFixed(6);
      if (outK)     outK.textContent     = k.toFixed(10);
      if (outL)     outL.textContent     = L.toFixed(4);
      if (outKh)    outKh.textContent    = kh.toFixed(4);

      // grid (physical)
      const nx = Math.floor(xMax/dx) + 1;
      const ny = Math.floor(yMax/dy) + 1;

      const MAX_POINTS = 1200000; // allows 1001x1001
      if (nx*ny > MAX_POINTS) {
        statusEl.textContent =
          `Grid too large (${nx}×${ny} = ${nx*ny}). Increase dx,dy or reduce xMax,yMax.`;
        plotBtn.disabled = false;
        stopBtn.disabled = true;
        return;
      }

      const kd = new Float32Array(nx*ny);
      const theta0 = thetaIncDeg * Math.PI/180;

      const chunkRows = (nx*ny > 600000) ? 2 : 6;

      // compute kd on physical grid (meters), wrap theta like MATLAB mod(atan2d,360)
      for(let iy=0; iy<ny; iy+=chunkRows){
        if(stopFlag) break;

        const yEnd = Math.min(ny, iy+chunkRows);
        for(let j=iy; j<yEnd; j++){
          const y = j*dy;
          for(let i=0; i<nx; i++){
            const x = i*dx;
            const r = Math.hypot(x,y);

            let theta = Math.atan2(y,x); // [-pi,pi]
            if (theta < 0) theta += 2*Math.PI;

            kd[j*nx + i] = bettesKdAtPoint(r, theta, L, theta0);
          }
        }

        statusEl.textContent = `Computing… (${Math.round(100*yEnd/ny)}%)`;
        await new Promise(requestAnimationFrame);
      }

      if(stopFlag){
        statusEl.textContent = "Stopped.";
        plotBtn.disabled = false;
        stopBtn.disabled = true;
        return;
      }

      // ============================================================
      // Plot scaling:
      // MATCH MATLAB behavior:
      // compute in meters, but when nondim checked plot x/L, y/L.
      // ============================================================
      const xMaxPlot = doNonDim ? (xMax / L) : xMax;
      const yMaxPlot = doNonDim ? (yMax / L) : yMax;
      const dxPlot   = doNonDim ? (dx   / L) : dx;
      const dyPlot   = doNonDim ? (dy   / L) : dy;

      // ============================================================
      // Render filled map + contour overlay (in plot coordinates)
      // ============================================================
      clearCanvas();

      const padL = 54, padB = 40, padT = 14, padR = 14;
      const W = canvas.width  - padL - padR;
      const H = canvas.height - padT - padB;

      const img = ctx.createImageData(W, H);
      const data = img.data;

      // nearest-neighbor sampler on physical kd-grid
      function kdAtPhys(xPhys, yPhys){
        const ix = Math.min(nx-1, Math.max(0, Math.round(xPhys/dx)));
        const iy = Math.min(ny-1, Math.max(0, Math.round(yPhys/dy)));
        return kd[iy*nx + ix];
      }

      for(let py=0; py<H; py++){
        const yPlot = (H-1-py) * (yMaxPlot/(H-1));
        const yPhys = doNonDim ? (yPlot * L) : yPlot;

        for(let px=0; px<W; px++){
          const xPlot = px * (xMaxPlot/(W-1));
          const xPhys = doNonDim ? (xPlot * L) : xPlot;

          const v = clamp01(kdAtPhys(xPhys, yPhys)); // clamp only for colors
          const rgb = colormapViridisLike(v);

          const p = 4*(py*W + px);
          data[p+0] = rgb[0];
          data[p+1] = rgb[1];
          data[p+2] = rgb[2];
          data[p+3] = 255;
        }
      }

      ctx.putImageData(img, padL, padT);

      // frame
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.20)";
      ctx.lineWidth = 1;
      ctx.strokeRect(padL+0.5, padT+0.5, W-1, H-1);
      ctx.restore();

      // breakwater at x=0 in plot-units
      // x=0 is always the left boundary, so same pixel line
      drawBreakwaterLine(padT, padT + H, padL);

      // axis labels
      drawAxesLabels(doNonDim ? "x/L" : "x (m)", doNonDim ? "y/L" : "y (m)");

      // contour overlay computed from kd-grid, drawn in plot units
      const levels = [0.2,0.3,0.4,0.5,0.6,0.7,0.8];
      drawContoursAndLabels({
        ctx, padL, padT, W, H,
        xMaxPlot, yMaxPlot,
        dxPlot, dyPlot,
        nx, ny, kd,
        levels
      });

      statusEl.textContent = `Done. Grid: ${nx} × ${ny}.`;
      plotBtn.disabled = false;
      stopBtn.disabled = true;
    }

    plotBtn.addEventListener("click", (e) => { e.preventDefault(); computeAndPlot(); });
    stopBtn.addEventListener("click", () => { stopFlag = true; stopBtn.disabled = true; });

    // initial paint
    clearCanvas();
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(60, 60, 320, 130);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "18px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText("Ready. Click Plot.", 80, 130);
  }

  // robust init
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
