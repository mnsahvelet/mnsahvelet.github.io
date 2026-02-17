---
layout: single
title: "Wave Dispersion Calculator"
permalink: /tools/dispersion/
author_profile: true
---

<p>Enter wave period <strong>T</strong> and water depth <strong>h</strong>. Outputs are based on the linear dispersion relation: ω² = g k tanh(kh).</p>

<div style="max-width: 520px;">
  <label>Wave period T (s)</label><br>
  <input id="T" type="number" step="0.01" value="8.0" style="width: 100%; padding: 8px; margin: 6px 0 12px 0;">

  <label>Water depth h (m)</label><br>
  <input id="h" type="number" step="0.01" value="10.0" style="width: 100%; padding: 8px; margin: 6px 0 12px 0;">

  <button onclick="computeDispersion()" style="padding: 10px 14px;">Compute</button>
</div>

<div id="out" style="margin-top: 16px;"></div>

<script>
function computeDispersion() {
  const g = 9.81;
  const T = parseFloat(document.getElementById("T").value);
  const h = parseFloat(document.getElementById("h").value);

  if (!(T > 0) || !(h > 0)) {
    document.getElementById("out").innerHTML = "<p style='color:#d33;'>Please enter positive values for T and h.</p>";
    return;
  }

  const omega = 2 * Math.PI / T;

  // Solve dispersion: f(k) = g k tanh(kh) - omega^2 = 0  via Newton-Raphson
  // Initial guess: deep water k0 = omega^2 / g
  let k = (omega * omega) / g;
  const maxIter = 50;
  const tol = 1e-12;

  for (let i = 0; i < maxIter; i++) {
    const kh = k * h;
    const t = Math.tanh(kh);
    const sech = 1 / Math.cosh(kh);
    const sech2 = sech * sech;

    const f = g * k * t - omega * omega;
    const df = g * t + g * k * h * sech2;

    const dk = -f / df;
    k += dk;

    if (Math.abs(dk) < tol * Math.max(1, Math.abs(k))) break;
  }

  const L = 2 * Math.PI / k;
  const c = omega / k;

  const kh = k * h;
  const t = Math.tanh(kh);
  const n = 0.5 * (1 + (2 * kh) / Math.sinh(2 * kh)); // group factor
  const cg = n * c;

  let regime = "Intermediate depth";
  if (kh < 0.5) regime = "Shallow water (kh < 0.5)";
  if (kh > 3.0) regime = "Deep water (kh > 3)";

  document.getElementById("out").innerHTML = `
    <hr>
    <p><strong>Results</strong></p>
    <ul>
      <li>ω = ${omega.toFixed(6)} rad/s</li>
      <li>k = ${k.toFixed(8)} 1/m</li>
      <li>L = ${L.toFixed(3)} m</li>
      <li>c = ${c.toFixed(3)} m/s</li>
      <li>c<sub>g</sub> = ${cg.toFixed(3)} m/s</li>
      <li>kh = ${kh.toFixed(3)} (${regime})</li>
    </ul>
  `;
}
</script>
