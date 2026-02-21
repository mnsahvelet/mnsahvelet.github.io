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

    // ===== Complex (minimal) =====
    class C {
      constructor(re, im){ this.re = re; this.im = im; }
      static add(a,b){ return new C(a.re+b.re, a.im+b.im); }
      static mul(a,b){ return new C(a.re*b.re - a.im*b.im, a.re*b.im + a.im*b.re); }
      static expi(phi){ return new C(Math.cos(phi), Math.sin(phi)); }
      static abs(a){ return Math.hypot(a.re, a.im); }
    }

    // ===== Dispersion =====
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

    // ===== Fresnel C,S =====
    function fresnelCS(x){
      const sign = (x < 0) ? -1 : 1;
      x = Math.abs(x);

      if (x < 1e-6){
        const x2 = x*x;
        return { C: sign*(x - (Math.PI*Math.PI*x2*x)/40), S: sign*((Math.PI*x2)/6) };
      }

      const x2 = x*x;
      const t = 0.5*Math.PI*x2;

      // asymptotic
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

      // power series
      let Csum = 0, Ssum = 0;
      const a = Math.PI/2;

      let termC = x;
      let termS = a*x*x*x/3;

      Csum += termC;
      Ssum += termS;

      for(let n=1; n<60; n++){
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
      if (r === 0) return 0;
      const k = 2*Math.PI/L;
      const fac = 2*Math.sqrt(k*r/Math.PI);

      const s1 =  fac * Math.sin(0.5*(theta - theta0));
      const s2 = -fac * Math.sin(0.5*(theta + theta0));

      const F1 = bettesF(s1);
      const F2 = bettesF(s2);

      const ph1 = -k*r*Math.cos(theta - theta0);
      const ph2 = -k*r*Math.cos(theta + theta0);

      const t1 = C.mul(F1, C.expi(ph1));
      const t2 = C.mul(F2, C.expi(ph2));

      return C.abs(C.add(t1, t2));
    }

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

    async function computeAndPlot(){
      stopFlag = false;
      plotBtn.disabled = true;
      stopBtn.disabled = false;

      const T = parseFloat(TEl.value);
      const h = parseFloat(hEl.value);
      const L_override = parseFloat(LEl.value);

      let dx = parseFloat(dxEl.value);
      let dy = parseFloat(dyEl.value);
      let xMax = parseFloat(xMaxEl.value);
      let yMax = parseFloat(yMaxEl.value);

      const thetaIncDeg = parseFloat(thIncEl.value);
      const useNondim = !!(nondimEl && nondimEl.checked);

      if(!(T>0) || !(h>0) || !(dx>0) || !(dy>0) || !(xMax>0) || !(yMax>0)){
        statusEl.textContent = "Invalid inputs: all must be > 0.";
        plotBtn.disabled = false;
        stopBtn.disabled = true;
        return;
      }

      statusEl.textContent = "Computing…";

      // dispersion first, because nondim scaling may depend on L
      const disp = solveK(T, h);
      const L = (isFinite(L_override) && L_override > 0) ? L_override : disp.L;

      // >>> IMPORTANT UPDATE: interpret dx,dy,xMax,yMax as nondimensional if checked
      // nondim inputs mean: xMax = (xMax)*L, dx=(dx)*L, etc.
      if (useNondim) {
        dx   = dx   * L;
        dy   = dy   * L;
        xMax = xMax * L;
        yMax = yMax * L;
      }

      const k = 2*Math.PI/L;
      const omega = disp.omega;
      const kh = k*h;

      outOmega.textContent = omega.toFixed(6);
      outK.textContent     = k.toFixed(10);
      outL.textContent     = L.toFixed(4);
      outKh.textContent    = kh.toFixed(4);

      const nx = Math.floor(xMax/dx) + 1;
      const ny = Math.floor(yMax/dy) + 1;

      // safety: avoid locking browser
      const MAX_POINTS = 450000; // ~450k pixels in kd buffer is ok in JS; above that you risk freezing
      if (nx*ny > MAX_POINTS) {
        statusEl.textContent =
          `Grid too large (${nx}×${ny} = ${nx*ny}). Increase dx,dy or reduce xMax,yMax.`;
        plotBtn.disabled = false;
        stopBtn.disabled = true;
        return;
      }

      const kd = new Float32Array(nx*ny);
      const theta0 = thetaIncDeg * Math.PI/180;

      const chunkRows = 6;
      let maxKd = 0;

      for(let iy=0; iy<ny; iy+=chunkRows){
        if(stopFlag) break;

        const yEnd = Math.min(ny, iy+chunkRows);
        for(let j=iy; j<yEnd; j++){
          const y = j*dy;
          for(let i=0; i<nx; i++){
            const x = i*dx;
            const r = Math.hypot(x,y);
            const theta = Math.atan2(y,x);
            const val = bettesKdAtPoint(r, theta, L, theta0);
            const idx = j*nx + i;
            kd[idx] = val;
            if(val > maxKd) maxKd = val;
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

      const invMax = 1/(maxKd + 1e-12);

      clearCanvas();

      const padL = 54, padB = 40, padT = 14, padR = 14;
      const W = canvas.width  - padL - padR;
      const H = canvas.height - padT - padB;

      const img = ctx.createImageData(W, H);
      const data = img.data;

      for(let py=0; py<H; py++){
        const yPhys = (H-1-py) * (yMax/(H-1));
        const jy = Math.min(ny-1, Math.round(yPhys/dy));

        for(let px=0; px<W; px++){
          const xPhys = px * (xMax/(W-1));
          const ix = Math.min(nx-1, Math.round(xPhys/dx));

          const v = kd[jy*nx + ix] * invMax;
          const rgb = colormapViridisLike(v);

          const p = 4*(py*W + px);
          data[p+0] = rgb[0];
          data[p+1] = rgb[1];
          data[p+2] = rgb[2];
          data[p+3] = 255;
        }
      }

      ctx.putImageData(img, padL, padT);

      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.20)";
      ctx.lineWidth = 1;
      ctx.strokeRect(padL+0.5, padT+0.5, W-1, H-1);
      ctx.restore();

      // breakwater at x=0
      drawBreakwaterLine(padT, padT + H, padL);

      drawAxesLabels(useNondim ? "x/L" : "x (m)", useNondim ? "y/L" : "y (m)");

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

  // >>> IMPORTANT UPDATE: init must be robust even if you forgot `defer`
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
