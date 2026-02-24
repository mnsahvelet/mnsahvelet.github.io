(() => {
  "use strict";

  function makeBreakwaterOverlay(Lb) {
    // breakwater along x=0 from y=0..Lb
    return {
      type: "line",
      x0: 0, x1: 0,
      y0: 0, y1: Lb,
      line: { color: "black", width: 4 }
    };
  }

  function plotMap(divId, xvals, yvals, Kd, Lb) {
    const data = [{
      type: "heatmap",
      x: xvals,
      y: yvals,
      z: Kd,
      zmin: 0,
      zmax: 1,
      colorbar: { title: "K<sub>d</sub>" }
    }];

    const layout = {
      margin: { l: 70, r: 30, t: 40, b: 60 },
      title: { text: "Diffraction Coefficient K<sub>d</sub>" },
      xaxis: { title: "Distance behind structure, dist (m)" },
      yaxis: { title: "Position along from left, loc (m)" },
      shapes: [ makeBreakwaterOverlay(Lb) ]
    };

    Plotly.newPlot(divId, data, layout, { responsive: true });
  }

  function plotContour(divId, xvals, yvals, Kd, Lb, levels) {
    // levels can be null, or an array
    let contourSpec = {};
    if (Array.isArray(levels) && levels.length >= 2) {
      const start = levels[0];
      const end = levels[levels.length - 1];
      const size = levels[1] - levels[0];
      if (isFinite(start) && isFinite(end) && isFinite(size) && size > 0) {
        contourSpec = { start, end, size };
      }
    }

    const data = [{
      type: "contour",
      x: xvals,
      y: yvals,
      z: Kd,
      contours: contourSpec,
      colorbar: { title: "K<sub>d</sub>" },
      line: { width: 1 }
    }];

    const layout = {
      margin: { l: 70, r: 30, t: 40, b: 60 },
      title: { text: "Diffraction Coefficient K<sub>d</sub> (Contour Map)" },
      xaxis: { title: "Distance behind structure, dist (m)" },
      yaxis: { title: "Position along from left, loc (m)" },
      shapes: [ makeBreakwaterOverlay(Lb) ]
    };

    Plotly.newPlot(divId, data, layout, { responsive: true });
  }

  function plotCenterline(divId, xvals, centerKd) {
    const data = [{
      type: "scatter",
      mode: "lines",
      x: xvals,
      y: centerKd,
      line: { width: 2 }
    }];

    const layout = {
      margin: { l: 70, r: 30, t: 40, b: 60 },
      title: { text: "Centerline K<sub>d</sub> (loc = 0)" },
      xaxis: { title: "Distance behind structure, dist (m)" },
      yaxis: { title: "K<sub>d</sub> at loc = 0" }
    };

    Plotly.newPlot(divId, data, layout, { responsive: true });
  }

  window.ED_PLOTS = {
    plotMap,
    plotContour,
    plotCenterline
  };

})();
