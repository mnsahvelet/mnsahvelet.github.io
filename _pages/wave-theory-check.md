---
title: "Wave Theory Checker"
permalink: /tools/wave-theory-check/
layout: single
author_profile: false
---

<div class="wrap" style="max-width:980px;margin:0 auto;">
  <h2>Wave Theory Checker (Le Méhauté Validity Chart)</h2>
  <p>Enter wave height, period, and water depth. The tool plots your case on the Le Méhauté (1976) chart and reports depth regime and recommended theory order.</p>

  <div class="panel" style="display:grid;grid-template-columns:340px minmax(640px, 1fr);gap:16px;align-items:start;">
    <div class="card" style="background:#1b1b1b;border:1px solid #333;border-radius:12px;padding:12px;">
      <label>Wave height H (m)</label>
      <input id="H" type="number" step="any" value="1.0" style="width:100%;padding:8px;border-radius:8px;border:1px solid #444;background:#0f0f0f;color:#eee;" />

      <label style="display:block;margin-top:10px;">Wave period T (s)</label>
      <input id="T" type="number" step="any" value="6.0" style="width:100%;padding:8px;border-radius:8px;border:1px solid #444;background:#0f0f0f;color:#eee;" />

      <label style="display:block;margin-top:10px;">Water depth D (m)</label>
      <input id="D" type="number" step="any" value="10.0" style="width:100%;padding:8px;border-radius:8px;border:1px solid #444;background:#0f0f0f;color:#eee;" />

      <button id="plotBtn" style="margin-top:12px;width:100%;padding:10px;border-radius:10px;border:1px solid #555;background:#222;color:#eee;cursor:pointer;">
        Plot / Check
      </button>

      <div id="out" style="margin-top:10px;white-space:pre-line;"></div>
      <div style="font-size:12px;color:#bdbdbd;margin-top:8px;">
        Reference: Le Méhauté (1976), <i>An Introduction to Hydrodynamics and Water Waves</i>.
      </div>
    </div>

    <div class="card" style="background:#1b1b1b;border:1px solid #333;border-radius:12px;padding:12px;">
      <canvas id="chart" width="1200" height="650"
  style="width:100%;height:auto;aspect-ratio: 1200 / 650; background:#0f0f0f;border-radius:12px;border:1px solid #333;display:block;">
</canvas>
    </div>
  </div>
</div>

<script src="{{ '/assets/tools/wave-theory-check/wave-theory-check.js' | relative_url }}"></script>
