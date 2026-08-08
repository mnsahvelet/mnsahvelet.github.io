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
