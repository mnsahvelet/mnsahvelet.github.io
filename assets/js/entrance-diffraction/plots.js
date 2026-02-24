(() => {
  "use strict";

  function makeBreakwaterOverlay(Lb) {
    return {
      type: "line",
      x0: 0, x1: 0,
      y0: 0, y1: Lb,
      line: { color: "black", width: 4 }
    };
  }

  // IMPORTANT: function name is plotMap (matches what app.js calls)
  function plotMap(divId, xvals, yvals, Kd, Lb) {
    const data = [{
      type: "heatmap",
      x: xvals,
      y: yvals,
      z: Kd,
      zmin: 0,
      zmax: 1,
      colorbar: { title: "K\u2091" } // Kd
    }];

    const layout = {
      title: { text: "Diffraction Coefficient K\u2091" },
      margin: { l: 70, r: 20, t: 40, b: 60 },
      xaxis: { title: "Distance behind structure, dist (m)" },
      yaxis: { title: "Position along from left, loc (m)" },
      shapes: [ makeBreakwaterOverlay(Lb) ]
    };

    Plotly.newPlot(divId, data, layout, { responsive: true, displayModeBar: false });
  }

  function plotContour(divId, xvals, yvals, Kd, Lb, levels) {
    const hasLevels = Array.isArray(levels) && levels.length >= 2;

    const contour = {
      type: "contour",
      x: xvals,
      y: yvals,
      z: Kd,
      contours: hasLevels ? {
        start: levels[0],
        end: levels[levels.length - 1],
        size: (levels[1] - levels[0])
      } : {},
      colorbar: { title: "K\u2091" },
      line: { width: 1, color: "black" }
    };

    const layout = {
      title: { text: "Diffraction Coefficient K\u2091 (Contour Map)" },
      margin: { l: 70, r: 20, t: 40, b: 60 },
      xaxis: { title: "Distance behind structure, dist (m)" },
      yaxis: { title: "Position along from left, loc (m)" },
      shapes: [ makeBreakwaterOverlay(Lb) ]
    };

    Plotly.newPlot(divId, [contour], layout, { responsive: true, displayModeBar: false });
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
      title: { text: "Centerline K\u2091 (loc = 0)" },
      margin: { l: 70, r: 20, t: 40, b: 60 },
      xaxis: { title: "Distance behind structure, dist (m)" },
      yaxis: { title: "K\u2091 at loc = 0" }
    };

    Plotly.newPlot(divId, data, layout, { responsive: true, displayModeBar: false });
  }

  window.ED_PLOTS = { plotMap, plotContour, plotCenterline };
})();
