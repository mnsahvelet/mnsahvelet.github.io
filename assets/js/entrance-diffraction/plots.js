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

  function plotKdMap(divId, xvals, yvals, Kd, B) {
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
      margin: { l: 70, r: 25, t: 40, b: 55 },
      title: { text: "Diffraction Coefficient K\u2091" },
      xaxis: { title: "Distance behind structure, dist (m)" },
      yaxis: { title: "Position along from left, loc (m)" },
      shapes: [ makeBreakwaterOverlay(B) ]
    };

    Plotly.newPlot(divId, data, layout, { responsive: true });
  }

  function plotContour(divId, xvals, yvals, Kd, Lb, levels) {
    const contourSpec = {
      type: "contour",
      x: xvals,
      y: yvals,
      z: Kd,
      coloring: "heatmap",
      line: { width: 1 },
      colorbar: { title: "K<sub>d</sub>" }
    };

    if (levels && levels.length >= 2) {
      contourSpec.contours = {
        start: levels[0],
        end: levels[levels.length - 1],
        size: levels[1] - levels[0],
        showlabels: true,
        labelfont: { size: 10, color: "black" }
      };
    } else {
      contourSpec.contours = { showlabels: true };
    }

    const layout = {
      margin: { l: 70, r: 25, t: 40, b: 55 },
      title: { text: "Diffraction Coefficient K\u2091 (Contour Map)" },
      xaxis: { title: "Distance behind structure, dist (m)" },
      yaxis: { title: "Position along from left, loc (m)" },
      shapes: [ makeBreakwaterOverlay(Lb) ]
    };

    Plotly.newPlot(divId, [contourSpec], layout, { responsive: true });
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
      margin: { l: 70, r: 25, t: 40, b: 55 },
      title: { text: "Centerline K\u2091 (loc = 0)" },
      xaxis: { title: "Distance behind structure, dist (m)" },
      yaxis: { title: "K<sub>d</sub> at loc = 0" }
    };

    Plotly.newPlot(divId, data, layout, { responsive: true });
  }

  window.ED_PLOTS = {
    plotKdMap,
    plotContour,
    plotCenterline
  };

})();
