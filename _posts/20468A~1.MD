---
title: "Why beaches are curved: Dean's equilibrium profile"
date: 2026-07-22
permalink: /posts/2026/07/why-beaches-are-curved/
excerpt: "Wade out from any sandy shoreline and the bottom drops away quickly at first, then flattens. That shape isn't random — it's an equilibrium, and one grain-size number sets it."
tags:
  - coastal engineering
  - morphology
  - sediment
read_time: true
---

Next time you walk into the sea from a sandy beach, pay attention to the bottom. It falls
away steeply near the shore, then flattens as you go out. Almost every sandy beach in the
world does this, and it's not a coincidence — it's an **equilibrium**.

## One curve, one parameter

Bob Dean captured that shape with a beautifully simple expression:

$$h(x) = A\,x^{2/3},$$

where `x` is the distance offshore, `h` is the water depth, and `A` (in m^⅓) is the
**profile scale parameter**. The exponent 2/3 comes from assuming the surf zone tends
toward a **uniform rate of wave energy dissipation per unit volume** — the beach arranges
itself so the breaking waves spread their punch evenly. That single physical idea gives
the concave-up curve.

## The grain does the deciding

What sets `A`? The sediment. Coarser sand settles faster, tolerates steeper slopes, and
pushes `A` up; fine sand does the opposite. A handy link runs through the **fall velocity**
`w_s`:

$$A \approx 0.067\,w_s^{0.44}\quad(w_s \text{ in cm/s}).$$

So the size of the grains under your feet is, quite literally, encoded in how quickly the
water gets deep in front of you. Coarse-sand beaches are steep; fine-sand beaches are flat
and wide.

## Why engineers keep coming back to it

The equilibrium profile is the workhorse behind **beach nourishment** design, dune and
shoreline response, and the idea of a **depth of closure** — the depth beyond which the
profile barely changes. When we place sand on an eroding beach, we're really trying to
rebuild this curve with the right `A`. Fill it with sand that's too fine and the sea will
quietly re-flatten your expensive beach.

Nature solved the optimisation a long time ago. Dean just wrote it down.

*You can see how the profile — and the closure depth — shift with grain size in the
[equilibrium-profile tool](https://mnsahvelet.github.io/coastal-tools/beach-profile-dean.html).*
