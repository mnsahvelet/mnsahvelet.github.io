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

function plotKdMap(divId, xvals, yvals, Kd, B) {
  // Plotly heatmap expects z as [row(y)][col(x)]
  const data = [{
    type: "heatmap",
    x: xvals,
    y: yvals,
    z: Kd,
    zmin: 0,
    zmax: 1,
    colorbar: { title: "K\u1D05" }
  }];

  const layout = {
    margin: { l: 60, r: 20, t: 30, b: 55 },
    title: { text: "Diffraction Coefficient K\u1D05" },
    xaxis: { title: "Distance behind structure, dist (m)" },
    yaxis: { title: "Position along from left, loc (m)" },
    shapes: [{
      type: "line",
      x0: 0, x1: 0,
      y0: 0, y1: B,
      line: { color: "black", width: 4 }
    }]
  };

  Plotly.newPlot(divId, data, layout, {responsive:true});
}

  function plotContour(divId, xvals, yvals, Kd, Lb, levels) {
    const contour = {
      type: "contour",
      x: xvals,
      y: yvals,
      z: Kd,
      contours: levels ? { start: levels[0], end: levels[levels.length-1], size: (levels[1]-levels[0]) } : {},
      colorbar: { title: "K<sub>d</sub>" },
      line: { width: 1 }
    };

    const layout = {
      margin: { l: 70, r: 20, t: 40, b: 55 },
      xaxis: { title: "Distance behind structure, dist (m)" },
      yaxis: { title: "Position along from left, loc (m)" },
      shapes: [ makeBreakwaterOverlay(Lb) ]
    };

    Plotly.newPlot(divId, [contour], layout, {responsive: true});
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
      margin: { l: 70, r: 20, t: 40, b: 55 },
      xaxis: { title: "Distance behind structure, dist (m)" },
      yaxis: { title: "K<sub>d</sub> at loc = 0" }
    };

    Plotly.newPlot(divId, data, layout, {responsive: true});
  }

  window.ED_PLOTS = {
    plotMap,
    plotContour,
    plotCenterline
  };

})();
