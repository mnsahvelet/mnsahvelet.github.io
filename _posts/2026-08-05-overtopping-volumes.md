---
title: "The average lies: why the biggest wave sets the crest"
date: 2026-08-05
permalink: /posts/2026/08/overtopping-volumes/
excerpt: "We design sea walls against a mean overtopping discharge in litres per second. But a person on the promenade never feels a mean — they feel one wave. Here is why V_max, not q, is the number that matters for safety."
tags:
  - coastal engineering
  - overtopping
  - EurOtop
read_time: true
---

Ask most people how we size a sea wall against overtopping and they'll mention a number in
**litres per second per metre** — the mean overtopping discharge, `q`. It's a good design
parameter. But it hides something important.

`q` is an *average* over a whole storm. A pedestrian standing behind the crest never
experiences an average. They experience **one wave** — and it's almost always one of the
big ones that does the damage. That single volume is `V_max`, the maximum overtopping
volume from any one wave in the event.

## The counter-intuitive part

Here is what surprised me the first time I saw it. Take the **same** mean discharge, say
`q = 5 l/s/m`, and change only the wave height:

- With `H_m0 = 1 m` you get **hundreds** of small overtopping waves, and `V_max` stays
  modest — a few hundred litres per metre.
- With `H_m0 = 5 m` only a **handful** of waves overtop during the whole hour — but each
  one can throw **several cubic metres** per metre over the crest.

Same average. Wildly different hazard. EurOtop makes this explicit: individual volumes
follow a two-parameter Weibull distribution, and the largest expected one is

$$V_{max} = a\,[\ln(N_{ow})]^{1/b}$$

where `N_ow` is the number of overtopping waves in the storm and `a`, `b` come from the
mean discharge and the wave conditions.

## Why it changes design

Once you accept that the tail matters, the tolerable limits in EurOtop's Chapter 3 start
to make sense — they are given in terms of `V_max` (litres per metre), not just `q`.
"Safe for pedestrians" is a volume limit. "Rear slope will erode" is a volume limit. The
average was never the right currency for safety.

So when I check a crest now, I look at both: the mean discharge tells me the hydraulic
loading; `V_max` tells me whether someone standing behind it will be knocked off their
feet.

*You can watch `V_max` explode as you raise the wave height (at fixed `q`) in the
[individual-overtopping tool](https://mnsahvelet.github.io/coastal-tools/wave-overtopping-volumes.html).*
