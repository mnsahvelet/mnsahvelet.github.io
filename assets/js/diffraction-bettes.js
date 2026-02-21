(() => {
  "use strict";

  const g = 9.81;
  const el = (id) => document.getElementById(id);

  function init() {
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

    // =========================
    // Complex
    // =========================
    class C {
      constructor(re, im){ this.re = re; this.im = im; }
      static add(a,b){ return new C(a.re+b.re, a.im+b.im); }
      static mul(a,b){ return new C(a.re*b.re - a.im*b.im, a.re*b.im + a.im*b.re); }
      static expi(phi){ return new C(Math.cos(phi), Math.sin(phi)); }
      static abs(a){ return Math.hypot(a.re, a.im); }
    }

    // =========================
    // Dispersion
    // =========================
    function solveK(T, h){
      const omega = 2*Math.PI / T;
      let k = (omega*omega)/g;
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

    // =========================
    // Fresnel C,S (approx)
    // =========================
    function fresnelCS(x){
      const sign = (x < 0) ? -1 : 1;
      x = Math.abs(x);

      if (x < 1e-6){
        const x2 = x*x;
        return { C: sign*(x - (Math.PI*Math.PI*x2*x)/40), S: sign*((Math.PI*x2)/6) };
      }

      const x2 = x*x;
      const t = 0.5*Math.PI*x2;

      if (x > 1.6){
        const u  = 1/(Math.PI*x);
        const u2 = u*u;
        const f  = u*(1 - 0.5*u2 + 0.75*u2*u2 - 1.875*u2*u2*u2);
        const gg = u2*(1 - 1.5*u2 + 3.75*u2*u2 - 13.125*u2*u2*u2);
        const ct = Math.cos(t), st = Math.sin(t);
        const Cx = 0.5 + f*st - gg*ct;
        const Sx = 0.5 - f*ct - gg*st;
        return { C: sign*Cx, S: sign*Sx };
      }

      let Csum = 0, Ssum = 0;
      const a = Math.PI/2;

      let termC = x;
      let termS = a*x*x*x/3;

      Csum += termC;
      Ssum += termS;

      for(let n=1; n<80; n++){
        const num = -a*a*x*x*x*x;

        const denC = (2*n-1)*(2*n)*(4*n+1);
        const denCprev = (4*(n-1)+1);
        termC = termC * num * denCprev / denC;

        const denS = (2*n)*(2*n+1)*(4*n+3);
        const denSprev = (4*(n-1)+3);
        termS = termS * num * denSprev / denS;

        Csum += termC;
        Ssum += termS;

        if(Math.abs(termC) + Math.abs(termS) < 1e-12) break;
      }

      return { C: sign*Csum, S: sign*Ssum };
    }

    function bettesF(sigma){
      const {C: M, S: N} = fresnelCS(sigma);
      const inside = new C(0.5 + M, -(0.5 + N));
      const pref   = new C(0.5, 0.5);
      return C.mul(pref, inside);
    }

    function bettesKdAtPoint(r, theta, L, theta0){
      // mimic MATLAB r_safe = max(r, tiny)
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

      // clamp like MATLAB expectation (numerical tiny overshoot can happen)
      const val = C.abs(C.add(t1, t2));
      return Math.max(0, Math.min(1, val));
    }

    // =========================
    // Color
    // =========================
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

    // =========================
    // Canvas helpers
    // =========================
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

    // =========================
    // Contours: marching squares
    // =========================
    function lerp(a,b,t){ return a + (b-a)*t; }

    function physToPix(xPhys, yPhys, padL, padT, W, H, xMax, yMax){
      const x = padL + (xPhys/xMax) * (W-1);
      const y = padT + (H-1) - (yPhys/yMax) * (H-1);
      return {x, y};
    }

    function marchingSquares(kd, nx, ny, dx, dy, level){
      const segs = [];

      function interp(p1, p2, v1, v2){
        const t = (level - v1) / (v2 - v1 + 1e-15);
        return { x: lerp(p1.x, p2.x, t), y: lerp(p1.y, p2.y, t) };
      }

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

      for(let j=0; j<ny-1; j++){
        for(let i=0; i<nx-1; i++){
          const v00 = kd[j*nx + i];
          const v10 = kd[j*nx + (i+1)];
          const v01 = kd[(j+1)*nx + i];
          const v11 = kd[(j+1)*nx + (i+1)];

          const p00 = {x:i*dx,     y:j*dy};
          const p10 = {x:(i+1)*dx, y:j*dy};
          const p01 = {x:i*dx,     y:(j+1)*dy};
          const p11 = {x:(i+1)*dx, y:(j+1)*dy};

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
      const { ctx, padL, padT, W, H, xMax, yMax, dx, dy, nx, ny, kd, levels } = opts;

      ctx.save();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(0,0,0,0.85)";
      ctx.fillStyle = "rgba(0,0,0,0.95)";
      ctx.font = "13px system-ui, -apple-system, Segoe UI, Roboto, Arial";

      for (const level of levels){
        const segs = marchingSquares(kd, nx, ny, dx, dy, level);

        ctx.beginPath();
        for (const seg of segs){
          const a = physToPix(seg[0].x, seg[0].y, padL, padT, W, H, xMax, yMax);
          const b = physToPix(seg[1].x, seg[1].y, padL, padT, W, H, xMax, yMax);
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        }
        ctx.stroke();

        // label only a few, and avoid the extreme left edge crowding
        const label = level.toFixed(1);
        const step = Math.max(1, Math.floor(segs.length / 5));

        for (let s=0; s<segs.length; s+=step){
          const midPhys = {
            x: 0.5*(segs[s][0].x + segs[s][1].x),
            y: 0.5*(segs[s][0].y + segs[s][1].y)
          };

          // skip labels too close to x=0 (prevents the “stacked” mess)
          if (midPhys.x < 0.06*xMax) continue;

          const mid = physToPix(midPhys.x, midPhys.y, padL, padT, W, H, xMax, yMax);

          ctx.save();
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = "rgba(255,255,255,0.85)";
          ctx.strokeText(label, mid.x + 4, mid.y - 4);
          ctx.restore();

          ctx.fillText(label, mid.x + 4, mid.y - 4);
        }
      }

      ctx.restore();
    }

    // =========================
    // Main compute + plot
    // =========================
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

      const disp = solveK(T, h);
      const L = (isFinite(L_override) && L_override > 0) ? L_override : disp.L;

      const k = 2*Math.PI/L;
      const omega = disp.omega;
      const kh = k*h;

      outOmega.textContent = omega.toFixed(6);
      outK.textContent     = k.toFixed(10);
      outL.textContent     = L.toFixed(4);
      outKh.textContent    = kh.toFixed(4);

      const nx = Math.floor(xMax/dx) + 1;
      const ny = Math.floor(yMax/dy) + 1;

      // allow your 1001x1001 case
      const MAX_POINTS = 1200000;
      if (nx*ny > MAX_POINTS) {
        statusEl.textContent =
          `Grid too large (${nx}×${ny} = ${nx*ny}). Increase dx,dy or reduce xMax,yMax.`;
        plotBtn.disabled = false;
        stopBtn.disabled = true;
        return;
      }

      const kd = new Float32Array(nx*ny);
      const theta0 = thetaIncDeg * Math.PI/180;

      const chunkRows = (nx*ny > 500000) ? 2 : 6;

      for(let iy=0; iy<ny; iy+=chunkRows){
        if(stopFlag) break;

        const yEnd = Math.min(ny, iy+chunkRows);
        for(let j=iy; j<yEnd; j++){
          const y = j*dy;
          for(let i=0; i<nx; i++){
            const x = i*dx;
            const r = Math.hypot(x,y);
            const theta = Math.atan2(y,x);
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

      // ===== Render filled map =====
      clearCanvas();

      const padL = 54, padB = 40, padT = 14, padR = 14;
      const W = canvas.width  - padL - padR;
      const H = canvas.height - padT - padB;

      const img = ctx.createImageData(W, H);
      const data = img.data;

      function kdAtPhys(xPhys, yPhys){
        const ix = Math.min(nx-1, Math.max(0, Math.round(xPhys/dx)));
        const iy = Math.min(ny-1, Math.max(0, Math.round(yPhys/dy)));
        return kd[iy*nx + ix];
      }

      for(let py=0; py<H; py++){
        const yPhys = (H-1-py) * (yMax/(H-1));
        for(let px=0; px<W; px++){
          const xPhys = px * (xMax/(W-1));
          const v = kdAtPhys(xPhys, yPhys);
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

      // breakwater at x=0
      drawBreakwaterLine(padT, padT + H, padL);

      // axes labels: MATLAB behavior (only label changes)
      drawAxesLabels(doNonDim ? "x/L" : "x (m)", doNonDim ? "y/L" : "y (m)");

      // ===== Contours + labels (MATLAB-ish levels) =====
      const levels = [0.2,0.3,0.4,0.5,0.6,0.7,0.8];
      drawContoursAndLabels({
        ctx, padL, padT, W, H,
        xMax, yMax,
        dx, dy, nx, ny, kd,
        levels
      });

      statusEl.textContent = `Done. Grid: ${nx} × ${ny}.`;
      plotBtn.disabled = false;
      stopBtn.disabled = true;
    }

    plotBtn.addEventListener("click", (e) => { e.preventDefault(); computeAndPlot(); });
    stopBtn.addEventListener("click", () => { stopFlag = true; stopBtn.disabled = true; });

    clearCanvas();
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(60, 60, 320, 130);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "18px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText("Ready. Click Plot.", 80, 130);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
