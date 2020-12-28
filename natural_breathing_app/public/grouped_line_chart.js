// https://observablehq.com/@d3/line-chart-with-tooltip

function groupedLineChart({
    id,
    x,
    ys,
    colors,
    dispatch,
    margin = {top: 10, right: 60, bottom: 60, left: 60},
    width = 500 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom
  } = {}) {
  
    var y_labels = Object.keys(ys)
    var y_arrays = y_labels.map(function(key) {
        return ys[key]
    });

    var zipped_data = d3.zip(x, ...y_arrays)

    var data = zipped_data.map(function(d) {
        el = {"x": d[0]}
        y_labels.forEach(function(l, i) {
            el[l] = d[i+1]
        })
        return el
    })

    var svg = d3.select("#" + id)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")")

    // Add X axis --> it is a date format
    var x = d3.scaleLinear()
      .domain(d3.extent(x))
      .range([ 0, width ]);
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    y_extent = []
    y_labels.forEach(function(key) {
        y_extent = y_extent.concat(d3.extent(ys[key]))
    });
    y_extent = d3.extent(y_extent)

    // Add Y axis
    var y = d3.scaleLinear()
      .domain(y_extent)
      .range([ height, 0 ]);

    svg.append("g")
      .call(d3.axisLeft(y));

    y_labels.forEach(function(key, i) {
        svg
            .append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", colors[key])
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(function(d) {return x(d.x)})
                .y(function(d) {return y(d[key])})
            )
        svg
          .append("g")
          .append("circle")
          .attr("class", "focus-circle")
          .attr("id", "circle-" + key)
          .style("fill", colors[key])
          .attr("stroke", colors[key])
          .attr("r", 5)
          .style("opacity", 0)

        svg
          .append('text')
          .attr("class", "focus-text")
          .attr("id", "text-" + key)
          .attr('dx', '55%')
          .attr('dy', (20 + i*10) + "%")
          .text(key + ":")
    })

    var bisect = d3.bisector(function(d) { return d.x; }).left;

    svg
      .append('rect')
      .style("fill", "none")
      .style("pointer-events", "all")
      .attr('width', width)
      .attr('height', height)
      .on('mousemove', function(){
        var x0 = x.invert(d3.mouse(this)[0]);
        var i = bisect(data, x0, 1);
        dispatch.call("updatefocus", this, i) // bind as datum?
      })

    dispatch.on("updatefocus." + id, function(i) {
      y_labels.forEach(function(key) {
        svg.selectAll("#circle-" + key)
          .attr("cx", x(data[i].x))
          .attr("cy", y(data[i][key]))
          .style("opacity", 1)
        svg.selectAll("#text-" + key)
          .text(key + ": " + data[i][key].toFixed(3));
    });      
    })

    if (id == "flowChart") {
      svg.append("line")
        .attr("x1", 0)  
        .attr("y1", y(0))
        .attr("x2", width)
        .attr("y2", y(0))
        .style("stroke-dasharray", "3,3")
        .style("stroke", "black")
        .style("fill", "none")
        .style("opacity", 0.2);
    }

    return svg.node();
  }