---
title: "The Iribarren number: one number, many answers"
date: 2026-08-08
permalink: /posts/2026/08/iribarren-number/
excerpt: "Whether a wave spills, plunges or surges — and whether your armour holds — often comes down to a single dimensionless number. Here is why I reach for ξ before almost anything else."
tags:
  - coastal engineering
  - waves
  - breaking
read_time: true
---

If I had to keep only one number from coastal engineering, it would probably be the
**Iribarren number** (the surf-similarity parameter):

$$\xi = \frac{\tan\alpha}{\sqrt{H/L_0}}$$

It compares how steep the structure or beach is (`tanα`) to how steep the wave is
(`√(H/L₀)`). That single ratio quietly decides a surprising number of things.

## It tells you how a wave breaks

The same wave breaks in completely different ways depending on the slope it meets:

<div style="max-width:640px;margin:1rem 0;">
<svg viewBox="0 0 640 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;background:#0e2130;border-radius:10px;">
  <!-- spilling -->
  <g>
    <text x="105" y="24" fill="#9fb6cf" font-family="sans-serif" font-size="13" text-anchor="middle">Spilling</text>
    <text x="105" y="182" fill="#6f88a4" font-family="sans-serif" font-size="11" text-anchor="middle">ξ &lt; 0.5 · gentle slope</text>
    <path d="M20 150 L190 110" stroke="#8a7d55" stroke-width="4" fill="none"/>
    <path d="M30 90 q40 -14 70 -2 q30 10 60 18" stroke="#4db6e6" stroke-width="2.5" fill="none"/>
    <path d="M92 84 q6 -10 14 -4" stroke="#dfeaf5" stroke-width="2" fill="none"/>
    <circle cx="100" cy="82" r="2" fill="#dfeaf5"/><circle cx="108" cy="80" r="1.6" fill="#dfeaf5"/>
  </g>
  <!-- plunging -->
  <g transform="translate(215,0)">
    <text x="105" y="24" fill="#9fb6cf" font-family="sans-serif" font-size="13" text-anchor="middle">Plunging</text>
    <text x="105" y="182" fill="#6f88a4" font-family="sans-serif" font-size="11" text-anchor="middle">0.5 &lt; ξ &lt; 3 · the classic curl</text>
    <path d="M20 150 L190 95" stroke="#8a7d55" stroke-width="4" fill="none"/>
    <path d="M30 96 q50 -20 92 -20 q22 0 24 20 q-2 20 -26 16 q-16 -3 -8 -18" stroke="#4db6e6" stroke-width="2.5" fill="none"/>
  </g>
  <!-- surging -->
  <g transform="translate(430,0)">
    <text x="105" y="24" fill="#9fb6cf" font-family="sans-serif" font-size="13" text-anchor="middle">Surging</text>
    <text x="105" y="182" fill="#6f88a4" font-family="sans-serif" font-size="11" text-anchor="middle">ξ &gt; 3 · steep slope</text>
    <path d="M40 155 L150 55" stroke="#8a7d55" stroke-width="4" fill="none"/>
    <path d="M30 120 q40 -6 66 -30 q16 -14 24 -26" stroke="#4db6e6" stroke-width="2.5" fill="none"/>
  </g>
</svg>
</div>

Low `ξ` (flat beach, steep wave) gives you **spilling** whitecaps that foam gently down
the face. Around `ξ ≈ 0.5–3` you get the **plunging** breaker every surfer chases — the
crest throws forward and curls over. Higher still, on a steep structure, the wave doesn't
really break at all: it **surges** up and down the slope. I built a small
[wave-routing tool](https://mnsahvelet.github.io/coastal-tools/wave-routing.html) that
computes the breaker type live if you want to feel this.

## The same number keeps showing up

What I find beautiful is that `ξ` doesn't stop at breaking:

- **Run-up and overtopping** scale almost linearly with `ξ` in the breaking regime
  (that's the whole basis of the EurOtop run-up formula).
- **Wave reflection** follows `K_r = \tanh(a\,\xi^b)` — smooth steep walls (high `ξ`)
  reflect strongly; rough mounds dissipate.
- **Armour stability** even splits its design formula at a critical `ξ_{mc}` into a
  plunging branch and a surging branch.

So before I open any design formula, I compute `ξ`. It tells me which physical regime I'm
in — and therefore which equation is even allowed to be used.

## The takeaway

One dimensionless group, built from a slope and a wave steepness, silently organises
breaking, run-up, reflection and stability. If a student remembers nothing else from a
coastal course, I'd want it to be this: **compute ξ first, then think.**

*If you'd like to play with any of this, the interactive tools live
[here](https://mnsahvelet.github.io/coastal-tools/).*
