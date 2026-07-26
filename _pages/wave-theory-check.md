---
title: "Wave Theory Selection (Le Méhauté, 1976)"
permalink: /tools/wave-theory-check/
layout: none
---
{% raw %}
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Wave Theory Selection — Le Méhauté (1976) — M. N. Sahvelet</title>
<style>
:root{--navy:#12324a;--teal:#1c7293;--line:#d3e0e7;--ink:#1a2a36;--mut:#5d7079;--accent:#2e6ca4;--bg:#fff;--card:#f7fafc;
--linear:#1c7293;--stokes:#2e6ca4;--cnoidal:#2e8b57;--solitary:#d08b1e;--breaking:#c0392b;}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:var(--bg);line-height:1.5}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
header{background:var(--navy);color:#fff;padding:18px 22px}
header .row{max-width:1080px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:baseline;gap:14px;justify-content:space-between}
header h1{margin:0;font-size:22px;font-weight:700}
header .sub{color:#9fd0da;font-size:13px}
header nav a{color:#cfe4ea;font-size:13px;margin-left:14px}
.wrap{max-width:1080px;margin:0 auto;padding:20px 22px 60px}
.intro{color:var(--mut);font-size:14px;margin:6px 0 18px}
.grid{display:grid;grid-template-columns:300px 1fr;gap:22px}
@media(max-width:820px){.grid{grid-template-columns:1fr}}
.panel{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px}
.panel h2{margin:0 0 12px;font-size:15px;color:var(--navy);letter-spacing:.02em;text-transform:uppercase}
label{display:block;font-size:13px;color:var(--mut);margin:10px 0 3px}
input[type=number]{width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:7px;font-size:15px}
.hint{font-size:11.5px;color:var(--mut);margin-top:3px}
.res{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px;margin-top:4px}
.res .k{font-size:12px;color:var(--mut)}
.res .v{font-size:17px;font-weight:600;color:var(--ink)}
.res .v small{font-weight:400;color:var(--mut);font-size:12px}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;color:#fff;background:var(--teal)}
.theorybox{margin-top:2px;padding:14px 16px;border-radius:10px;background:#fff;border:1px solid var(--line);border-left:6px solid var(--teal)}
.theorybox .lab{font-size:12px;color:var(--mut);text-transform:uppercase;letter-spacing:.03em}
.theorybox .name{font-size:22px;font-weight:700;color:var(--navy);margin:2px 0}
.theorybox .why{font-size:13px;color:var(--mut)}
.brk{margin-top:12px;font-size:13px}
.brk .bar{height:9px;border-radius:6px;background:#e7eef2;overflow:hidden;margin-top:5px}
.brk .fill{height:100%;background:var(--teal);transition:width .15s}
.btn{display:inline-block;margin-top:16px;width:100%;padding:10px 16px;border:0;border-radius:8px;background:var(--navy);color:#fff;font-size:14px;font-weight:600;cursor:pointer}
.btn:hover{background:#1c4a6b}
.cardrow{display:grid;grid-template-columns:1fr;gap:16px;margin-top:16px}
.plotcard{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px}
.plotcard h3{margin:0 0 6px;font-size:13px;color:var(--navy)}
canvas{width:100%;display:block;background:#fff;border-radius:8px;border:1px solid var(--line)}
.note{font-size:12px;color:var(--mut);margin-top:8px}
.eqn{background:#eef5f8;border-left:3px solid var(--teal);padding:8px 12px;border-radius:6px;font-size:13px;color:var(--navy);margin:14px 0;font-family:"Cambria Math",Georgia,serif}
footer{border-top:1px solid var(--line);color:var(--mut);font-size:12.5px;padding:16px 22px;text-align:center}
</style>
</head>
<body>
<header><div class="row">
  <div><h1>Wave Theory Selection</h1>
       <div class="sub">Le Méhauté (1976) diagram · which wave theory applies to your wave</div></div>
  <nav><a href="/tools/">&larr; Tools</a><a href="/files/wave-theory-theory.pdf">📄 Theory (PDF)</a></nav>
</div></header>

<div class="wrap">
  <p class="intro">Enter a wave height, period and water depth. The tool solves the dispersion relation, evaluates the
  governing dimensionless numbers (relative depth, steepness, Ursell number), checks the breaking limit, and places
  your wave on the <b>Le Méhauté (1976)</b> region-of-validity chart to recommend an appropriate wave theory.
  See the <a href="/files/wave-theory-theory.pdf">theory note</a> for the equations, the chart construction and a worked example.</p>

  <div class="grid">
    <div class="panel">
      <h2>Inputs</h2>
      <label>Wave height, H (m)</label>
      <input id="H" type="number" value="1" step="0.1" min="0.01">
      <label>Wave period, T (s)</label>
      <input id="T" type="number" value="8" step="0.5" min="0.5">
      <label>Water depth, d (m)</label>
      <input id="d" type="number" value="3" step="0.5" min="0.1">
      <div class="hint" style="margin-top:10px">H is the local wave height at depth d. SI units (metres, seconds); g = 9.81 m/s².</div>
      <button class="btn" id="rep">⬇ Download report (PDF)</button>
    </div>

    <div>
      <div class="panel">
        <h2>Wave parameters &nbsp; <span id="regime" class="badge">—</span></h2>
        <div class="res">
          <div><div class="k">Wavelength, L</div><div class="v"><span id="L">–</span> <small>m</small></div></div>
          <div><div class="k">Deep-water length, L0</div><div class="v"><span id="L0">–</span> <small>m</small></div></div>
          <div><div class="k">Relative depth, d/L</div><div class="v"><span id="dL">–</span></div></div>
          <div><div class="k">Wave steepness, H/L</div><div class="v"><span id="HL">–</span></div></div>
          <div><div class="k">Height/depth, H/d</div><div class="v"><span id="Hd">–</span></div></div>
          <div><div class="k">Ursell number, U<sub>R</sub> = HL²/d³</div><div class="v"><span id="Ur">–</span></div></div>
          <div><div class="k">Depth param, d/gT²</div><div class="v"><span id="dgT">–</span></div></div>
          <div><div class="k">Height param, H/gT²</div><div class="v"><span id="HgT">–</span></div></div>
        </div>
      </div>
      <div class="panel" style="margin-top:16px">
        <h2>Recommended wave theory</h2>
        <div class="theorybox" id="tbox">
          <div class="lab">Suggested theory</div>
          <div class="name" id="tname">–</div>
          <div class="why" id="twhy">–</div>
        </div>
        <div class="brk">
          <div>Breaking check (Miche limit H<sub>b</sub> = <span id="Hb">–</span> m) — your wave is at
            <b><span id="brkpct">–</span>%</b> of the breaking height.</div>
          <div class="bar"><div class="fill" id="brkfill" style="width:0%"></div></div>
        </div>
      </div>
    </div>
  </div>

  <div class="cardrow">
    <div class="plotcard"><h3>Le Méhauté (1976) — regions of validity of wave theories</h3>
      <canvas id="cv1" width="1020" height="560"></canvas>
      <div class="note">Axes are dimensionless: horizontal d/gT² (relative depth), vertical H/gT² (wave height).
        The star marks your wave. Solid red curve = breaking limit (Miche); dashed vertical lines = deep-water
        (d/L=0.5) and shallow-water (d/L=0.05) boundaries; dashed green curve = Ursell U<sub>R</sub>=26 (Stokes ↔ cnoidal).</div></div>
    <div class="plotcard"><h3>Water-surface profile for the recommended theory</h3>
      <canvas id="cv2" width="1020" height="230"></canvas>
      <div class="note" id="note2"></div></div>
  </div>

  <div class="eqn">L from &omega;² = g&middot;k&middot;tanh(kd);&nbsp;&nbsp; U<sub>R</sub> = H&middot;L²/d³;&nbsp;&nbsp;
     breaking (Miche): H<sub>b</sub>/L = 0.142&middot;tanh(kd);&nbsp;&nbsp; d/gT² and H/gT² are the Le Méhauté chart axes;&nbsp;&nbsp;
     U<sub>R</sub> &lt; 26 &rarr; Stokes/Airy family,&nbsp; U<sub>R</sub> &gt; 26 &rarr; cnoidal.</div>
</div>

<footer>Wave Theory Selection calculator · Muhammed N. Sahvelet, Troy Lab, Purdue University ·
  based on Le Méhauté (1976) and USACE SPM/CEM. See the <a href="/files/wave-theory-theory.pdf">theory note</a> for details and references.</footer>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script>
const g=9.81, TAU=2*Math.PI;
const $=id=>document.getElementById(id);

function dispersion(T,d){
  const L0=g*T*T/TAU; let L=L0;
  for(let i=0;i<300;i++){const Ln=L0*Math.tanh(TAU*d/L); if(Math.abs(Ln-L)<1e-11){L=Ln;break;} L=Ln;}
  const k=TAU/L, kd=k*d;
  return {L0,L,k,kd};
}
function analyze(H,T,d){
  const D=dispersion(T,d), L=D.L, L0=D.L0, kd=D.kd;
  const dL=d/L, HL=H/L, HL0=H/L0, Hd=H/d;
  const Ur=H*L*L/(d*d*d);
  const dgT=d/(g*T*T), HgT=H/(g*T*T);
  const Hb=0.142*Math.tanh(kd)*L;
  return {L,L0,k:D.k,kd,dL,HL,HL0,Hd,Ur,dgT,HgT,Hb};
}
function pickTheory(a,H){
  let name,why,fam;
  if(H>=a.Hb){name="Breaking / unstable";why="H reaches the Miche breaking limit — no periodic wave theory is valid here.";fam="breaking";}
  else if(a.Ur>=26 && a.dL<0.5){
    if(a.Hd>0.6){name="Solitary wave";why="Very shallow water, high Ursell number and large H/d — close to a single translatory crest.";fam="solitary";}
    else{name="Cnoidal theory";why="Ursell number ≥ 26 in shallow / transitional water — long, peaked waves require cnoidal theory.";fam="cnoidal";}
  }else if(a.dL>=0.5){
    if(a.HL0<0.006){name="Linear (Airy) theory";why="Deep water and very low steepness — small-amplitude linear theory is accurate.";fam="linear";}
    else if(a.HL0<0.04){name="Stokes 2nd-order";why="Deep water with moderate steepness — 2nd-order Stokes captures crest–trough asymmetry.";fam="stokes";}
    else if(a.HL0<0.08){name="Stokes 3rd–4th-order";why="Deep water, high steepness — higher-order Stokes terms are needed.";fam="stokes";}
    else{name="Stokes 5th-order";why="Deep water, near the steepness limit — 5th-order Stokes is appropriate.";fam="stokes";}
  }else{
    if(a.HL<0.008){name="Linear (Airy) theory";why="Transitional depth with low steepness — linear theory is adequate.";fam="linear";}
    else{name="Stokes 2nd–3rd-order";why="Transitional depth, moderate steepness and Ursell < 26 — low-order Stokes applies.";fam="stokes";}
  }
  return {name,why,fam};
}
const FAMHEX={linear:"#1c7293",stokes:"#2e6ca4",cnoidal:"#2e8b57",solitary:"#d08b1e",breaking:"#c0392b"};
function fmt(x,dp){ if(!isFinite(x))return"–"; return x.toFixed(dp); }

// ---- Le Méhauté chart ----
const X0=0.0005, X1=0.2, Y0=0.00005, Y1=0.05;
function dgtFromDL(dL){ const kd=TAU*dL; const dL0=dL*Math.tanh(kd); return {dgt:dL0/TAU, kd}; }
function drawChart(a,theory){
  const cv=$("cv1"), ctx=cv.getContext("2d"); const W=cv.width,Hh=cv.height;
  ctx.clearRect(0,0,W,Hh); ctx.fillStyle="#fff"; ctx.fillRect(0,0,W,Hh);
  const mL=70,mR=26,mT=26,mB=52; const pw=W-mL-mR, ph=Hh-mT-mB;
  const lx=Math.log10(X0), lxr=Math.log10(X1)-lx, ly=Math.log10(Y0), lyr=Math.log10(Y1)-ly;
  const PX=v=>mL+(Math.log10(v)-lx)/lxr*pw;
  const PY=v=>mT+ph-(Math.log10(v)-ly)/lyr*ph;
  ctx.strokeStyle="#eef2f5"; ctx.lineWidth=1; ctx.fillStyle="#5d7079"; ctx.font="11px Segoe UI,Arial";
  [0.0005,0.001,0.002,0.005,0.01,0.02,0.05,0.1,0.2].forEach(v=>{const x=PX(v);
    ctx.beginPath();ctx.moveTo(x,mT);ctx.lineTo(x,mT+ph);ctx.stroke();
    ctx.textAlign="center";ctx.fillText(v.toString(),x,mT+ph+16);});
  [0.00005,0.0001,0.0002,0.0005,0.001,0.002,0.005,0.01,0.02,0.05].forEach(v=>{const y=PY(v);
    ctx.beginPath();ctx.moveTo(mL,y);ctx.lineTo(mL+pw,y);ctx.stroke();
    ctx.textAlign="right";ctx.fillText(v.toString(),mL-6,y+3);});
  ctx.strokeStyle="#8aa1ad"; ctx.lineWidth=1.2; ctx.strokeRect(mL,mT,pw,ph);
  ctx.fillStyle="#12324a"; ctx.font="13px Segoe UI,Arial"; ctx.textAlign="center";
  ctx.fillText("Relative depth   d / gT²", mL+pw/2, Hh-14);
  ctx.save(); ctx.translate(16,mT+ph/2); ctx.rotate(-Math.PI/2);
  ctx.fillText("Wave-height parameter   H / gT²",0,0); ctx.restore();

  const DLs=[]; for(let e=Math.log10(0.0032);e<=Math.log10(0.9);e+=0.008) DLs.push(Math.pow(10,e));
  // breaking region fill + curve
  ctx.beginPath();
  DLs.forEach((dL,i)=>{const {dgt,kd}=dgtFromDL(dL); const Hbg=Math.min(Math.max(0.142*Math.tanh(kd)*Math.tanh(kd)/TAU,Y0),Y1);
    const x=PX(dgt),y=PY(Hbg); i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
  ctx.lineTo(PX(X1),PY(Y1)); ctx.lineTo(PX(X0),PY(Y1)); ctx.closePath();
  ctx.fillStyle="rgba(192,57,43,0.07)"; ctx.fill();
  ctx.beginPath();
  DLs.forEach((dL,i)=>{const {dgt,kd}=dgtFromDL(dL); const Hbg=0.142*Math.tanh(kd)*Math.tanh(kd)/TAU;
    const x=PX(dgt),y=PY(Hbg); i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
  ctx.strokeStyle="#c0392b"; ctx.lineWidth=2; ctx.stroke();
  // Ursell = 26
  ctx.beginPath(); let st=false;
  DLs.forEach(dL=>{const {dgt,kd}=dgtFromDL(dL); const HgT=26*dgt*dL*dL; const Hbg=0.142*Math.tanh(kd)*Math.tanh(kd)/TAU;
    if(HgT>=Y0 && HgT<=Math.min(Y1,Hbg)){const x=PX(dgt),y=PY(HgT); st?ctx.lineTo(x,y):ctx.moveTo(x,y);st=true;}});
  ctx.strokeStyle="#2e8b57"; ctx.lineWidth=1.8; ctx.setLineDash([6,4]); ctx.stroke(); ctx.setLineDash([]);
  // depth-limit verticals
  ctx.strokeStyle="#557"; ctx.lineWidth=1.2; ctx.setLineDash([5,4]);
  [{dL:0.5,lab:"d/L = 0.5"},{dL:0.05,lab:"d/L = 0.05"}].forEach(o=>{const {dgt}=dgtFromDL(o.dL); const x=PX(dgt);
    ctx.beginPath();ctx.moveTo(x,mT);ctx.lineTo(x,mT+ph);ctx.stroke();
    ctx.save();ctx.fillStyle="#445";ctx.font="11px Segoe UI,Arial";ctx.textAlign="left";
    ctx.translate(x+3,mT+ph-6);ctx.fillText(o.lab,0,0);ctx.restore();});
  ctx.setLineDash([]);
  // zone + region labels
  ctx.font="italic 12px Segoe UI,Arial"; ctx.textAlign="center"; ctx.fillStyle="#8a99a3";
  ctx.fillText("SHALLOW",PX(0.0012),mT+13); ctx.fillText("TRANSITIONAL",PX(0.012),mT+13); ctx.fillText("DEEP WATER",PX(0.11),mT+13);
  ctx.font="13px Segoe UI,Arial";
  ctx.fillStyle="rgba(192,57,43,0.85)"; ctx.fillText("Breaking waves",PX(0.02),PY(0.032));
  ctx.fillStyle="#b06a12"; ctx.fillText("Solitary",PX(0.0016),PY(0.007));
  ctx.fillStyle="#2e8b57"; ctx.fillText("Cnoidal",PX(0.0016),PY(0.0013));
  ctx.fillStyle="#2e6ca4"; ctx.fillText("Stokes 2nd–5th",PX(0.03),PY(0.0075));
  ctx.fillStyle="#1c7293"; ctx.fillText("Linear (Airy)",PX(0.05),PY(0.00016));
  // user point
  const px=PX(Math.min(Math.max(a.dgT,X0),X1)), py=PY(Math.min(Math.max(a.HgT,Y0),Y1));
  const col=FAMHEX[theory.fam]||"#12324a";
  ctx.strokeStyle=col; ctx.lineWidth=1; ctx.setLineDash([3,3]);
  ctx.beginPath();ctx.moveTo(mL,py);ctx.lineTo(px,py);ctx.lineTo(px,mT+ph);ctx.stroke();ctx.setLineDash([]);
  drawStar(ctx,px,py,10,col);
  ctx.font="bold 12px Segoe UI,Arial"; ctx.textAlign="left"; ctx.fillStyle="#12324a";
  let lxp=px+13, tw=ctx.measureText(theory.name).width; if(lxp+tw>mL+pw)lxp=px-13-tw;
  ctx.fillText("Your wave",lxp,py-7);
  ctx.font="11px Segoe UI,Arial"; ctx.fillStyle=col; ctx.fillText(theory.name,lxp,py+9);
}
function drawStar(ctx,cx,cy,r,col){
  ctx.beginPath();
  for(let i=0;i<10;i++){const ang=-Math.PI/2+i*Math.PI/5, rr=i%2?r*0.45:r;
    const x=cx+rr*Math.cos(ang), y=cy+rr*Math.sin(ang); i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
  ctx.closePath(); ctx.fillStyle=col; ctx.fill(); ctx.strokeStyle="#fff"; ctx.lineWidth=1.4; ctx.stroke();
}

// ---- surface profile ----
function drawProfile(a,theory,H){
  const cv=$("cv2"), ctx=cv.getContext("2d"); const W=cv.width,Hh=cv.height;
  ctx.clearRect(0,0,W,Hh); ctx.fillStyle="#fff"; ctx.fillRect(0,0,W,Hh);
  const mL=20,mR=20,mT=18,mB=26, pw=W-mL-mR, ph=Hh-mT-mB, midY=mT+ph*0.5;
  ctx.strokeStyle="#eef2f5"; ctx.strokeRect(mL,mT,pw,ph);
  ctx.strokeStyle="#cdd9df"; ctx.setLineDash([4,3]); ctx.beginPath();ctx.moveTo(mL,midY);ctx.lineTo(mL+pw,midY);ctx.stroke(); ctx.setLineDash([]);
  const fam=theory.fam;
  function eta(u){
    const th=2*TAU*u;
    if(fam==="linear"||fam==="breaking") return 0.5*Math.cos(th);
    if(fam==="stokes"){
      const kd=a.kd,s=Math.sinh(kd);
      let b=(a.k*H/16)*(Math.cosh(kd)*(2+Math.cosh(2*kd))/(s*s*s));
      b=Math.max(-0.35,Math.min(0.35,b));
      return 0.5*Math.cos(th)+b*Math.cos(2*th);
    }
    if(fam==="cnoidal"){ const c=0.5*(1+Math.cos(th)); return Math.pow(c,3.0)-0.30; }
    const x=u-0.5, sech=1/Math.cosh(x*10); return sech*sech-0.10; // solitary
  }
  let mn=1e9,mx=-1e9,N=480,vals=[];
  for(let i=0;i<=N;i++){const v=eta(i/N);vals.push(v);if(v<mn)mn=v;if(v>mx)mx=v;}
  const rng=(mx-mn)||1, amp=ph*0.40, mid=(mn+mx)/2, col=FAMHEX[fam]||"#12324a";
  ctx.beginPath();
  for(let i=0;i<=N;i++){const x=mL+(i/N)*pw, y=midY-((vals[i]-mid)/rng)*2*amp; i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
  ctx.strokeStyle=col; ctx.lineWidth=2.2; ctx.stroke();
  ctx.lineTo(mL+pw,mT+ph);ctx.lineTo(mL,mT+ph);ctx.closePath(); ctx.fillStyle=col+"14"; ctx.fill();
  ctx.fillStyle="#5d7079"; ctx.font="11px Segoe UI,Arial"; ctx.textAlign="left"; ctx.fillText("still-water level",mL+4,midY-5);
  ctx.textAlign="right"; ctx.fillText("2 wavelengths →",mL+pw-4,mT+ph-6);
}

// ---- main ----
let LAST=null;
function update(){
  const H=parseFloat($("H").value), T=parseFloat($("T").value), d=parseFloat($("d").value);
  if(!(H>0&&T>0&&d>0))return;
  const a=analyze(H,T,d), theory=pickTheory(a,H); LAST={H,T,d,a,theory};
  $("L").textContent=fmt(a.L,2); $("L0").textContent=fmt(a.L0,2);
  $("dL").textContent=fmt(a.dL,4); $("HL").textContent=fmt(a.HL,4);
  $("Hd").textContent=fmt(a.Hd,3); $("Ur").textContent=fmt(a.Ur,1);
  $("dgT").textContent=fmt(a.dgT,5); $("HgT").textContent=fmt(a.HgT,5);
  $("regime").textContent = a.dL>=0.5?"Deep water":(a.dL<=0.05?"Shallow water":"Transitional");
  $("tname").textContent=theory.name; $("tname").style.color=FAMHEX[theory.fam];
  $("twhy").textContent=theory.why; $("tbox").style.borderLeftColor=FAMHEX[theory.fam];
  $("Hb").textContent=fmt(a.Hb,2);
  const pct=Math.min(100,Math.round(H/a.Hb*100));
  $("brkpct").textContent=pct; $("brkfill").style.width=pct+"%";
  $("brkfill").style.background = pct>90?"var(--breaking)":(pct>65?"var(--solitary)":"var(--teal)");
  $("note2").textContent = (theory.fam==="cnoidal"||theory.fam==="solitary")
    ? "Profile shape is schematic (illustrative) for cnoidal/solitary waves — note the peaked crest and long flat trough."
    : "Profile from the recommended theory; crest–trough asymmetry grows with steepness for Stokes waves.";
  drawChart(a,theory); drawProfile(a,theory,H);
}
["H","T","d"].forEach(id=>$(id).addEventListener("input",update));

// ---- PDF report ----
$("rep").addEventListener("click",()=>{
  if(!LAST)update();
  const J=window.jspdf&&window.jspdf.jsPDF; if(!J){window.print();return;}
  const {H,T,d,a,theory}=LAST, doc=new J({unit:"pt",format:"a4"}), P=40; let y=48;
  doc.setFont("helvetica","bold"); doc.setFontSize(16); doc.setTextColor(18,50,74);
  doc.text("Wave Theory Selection — Report",P,y); y+=18;
  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(90,112,121);
  doc.text("Le Méhauté (1976) region-of-validity chart · M. N. Sahvelet, Troy Lab, Purdue University",P,y); y+=20;
  doc.setDrawColor(210,224,231); doc.line(P,y,555,y); y+=18;
  doc.setFontSize(11); doc.setTextColor(26,42,54); doc.setFont("helvetica","bold"); doc.text("Inputs",P,y); y+=15;
  doc.setFont("helvetica","normal"); doc.setFontSize(10);
  [["Wave height, H",H.toFixed(2)+" m"],["Wave period, T",T.toFixed(2)+" s"],["Water depth, d",d.toFixed(2)+" m"]]
    .forEach(r=>{doc.text(r[0],P,y);doc.text(r[1],240,y);y+=14;});
  y+=6; doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.text("Computed parameters",P,y); y+=15;
  doc.setFont("helvetica","normal"); doc.setFontSize(10);
  [["Wavelength, L",a.L.toFixed(2)+" m"],["Deep-water length, L0",a.L0.toFixed(2)+" m"],
   ["Relative depth, d/L",a.dL.toFixed(4)+"  ("+(a.dL>=0.5?"deep":a.dL<=0.05?"shallow":"transitional")+")"],
   ["Wave steepness, H/L",a.HL.toFixed(4)],["Height / depth, H/d",a.Hd.toFixed(3)],
   ["Ursell number, UR = H L^2 / d^3",a.Ur.toFixed(1)],
   ["Chart depth parameter, d/gT^2",a.dgT.toFixed(5)],["Chart height parameter, H/gT^2",a.HgT.toFixed(5)],
   ["Miche breaking height, Hb",a.Hb.toFixed(2)+" m  ("+Math.round(H/a.Hb*100)+"% of Hb)"]]
    .forEach(r=>{doc.text(r[0],P,y);doc.text(r[1],240,y);y+=14;});
  y+=6; doc.setFillColor(247,250,252); doc.setDrawColor(210,224,231); doc.roundedRect(P,y,515,46,5,5,"FD");
  doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(90,112,121); doc.text("RECOMMENDED THEORY",P+12,y+16);
  const c=FAMHEX[theory.fam], rgb=[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
  doc.setFontSize(15); doc.setTextColor(rgb[0],rgb[1],rgb[2]); doc.text(theory.name,P+12,y+35);
  doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(90,112,121);
  doc.text(doc.splitTextToSize(theory.why,290),P+220,y+15); y+=60;
  try{const img=$("cv1").toDataURL("image/png"), w=515, h=w*560/1020;
    if(y+h>805){doc.addPage();y=48;} doc.addImage(img,"PNG",P,y,w,h); y+=h+12;}catch(e){}
  try{const img2=$("cv2").toDataURL("image/png"), w=515, h=w*230/1020;
    if(y+h>805){doc.addPage();y=48;} doc.addImage(img2,"PNG",P,y,w,h); y+=h+12;}catch(e){}
  if(y>770){doc.addPage();y=48;}
  doc.setFontSize(7.5); doc.setTextColor(120,130,138);
  doc.text(doc.splitTextToSize("Selection guide: UR<26 -> Stokes / Airy family; UR>26 -> cnoidal; H>=Hb -> breaking. "
    +"References: Le Méhauté (1976); USACE Shore Protection Manual / Coastal Engineering Manual; Dean & Dalrymple (1991).",515),P,y);
  doc.save("wave-theory-report.pdf");
});

update();
window.addEventListener("resize",()=>{if(LAST){drawChart(LAST.a,LAST.theory);drawProfile(LAST.a,LAST.theory,LAST.H);}});
</script>
</body>
</html>

{% endraw %}
