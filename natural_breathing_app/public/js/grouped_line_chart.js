// https://observablehq.com/@d3/line-chart-with-tooltip

function groupedLineChart({
    id,
    y_info,
    dispatch,
    margin = {top: 10, right: 60, bottom: 60, left: 60},
    width = 500 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom
  } = {}) {

    // y_info is a dict that contains information
    // about each label, e.g. color

    // unsure whether the following might be better practice:
    
    // var zipped_data = d3.zip(time, ...y_arrays)

    // var data_test = zipped_data.map(function(d) {
    //     el = {"x": d[0]}
    //     y_labels.forEach(function(l, i) {
    //         el[l] = d[i+1]
    //     })
    //     return el
    // })


    var svg = d3.select("#" + id)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")")

    function render(ode_soln) {
      svg.selectAll("*").remove();

      var times = ode_soln["time"]

      var y_labels = Object.keys(y_info)
      var y_arrays = y_labels.map(function(key) {
          return ode_soln[key]
      });
  
      var data = times.map(function(d, i) {
        var el = {"x": d}
        y_labels.forEach(function(key) {
          el[key] = ode_soln[key][i]
        });
        return el
      })

      var x = d3.scaleLinear()
        .domain(d3.extent(times))
        .range([ 0, width ]);

      svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

      y_extent = d3.extent(d3.merge(y_arrays))

      // Add Y axis
      var y = d3.scaleLinear()
        .domain(y_extent)
        .range([ height, 0 ]);

      svg.append("g")
        .call(d3.axisLeft(y));

      y_labels.forEach(function(key, i) {

          var path = svg
              .append("path")
              .datum(data)
              .attr("fill", "none")
              .attr("stroke", y_info[key]["color"])
              .attr("stroke-width", 1.5)
              .attr("d", d3.line()
                .x(function(d) {return x(d.x)})
                .y(function(d) {return y(d[key])})
                .curve(d3.curveMonotoneX))
              
          svg
            .append("g")
            .append("circle")
            .datum(y_info[key]["color"])
            .attr("class", "focus-circle")
            .attr("id", "circle-" + key)
            .style("fill", d => d)
            .attr("r", 5)
            .style("opacity", 0)

          svg
            .append('text')
            .datum(y_info[key]["label"])
            .attr("class", "focus-text")
            .attr("id", "text-" + key)
            .attr('dx', '55%')
            .attr('dy', (10 + i*10) + "%")
            .style("fill", y_info[key]["color"])
            .text(d => "— " + d + ":")

            var bisect = d3.bisector(function(d) { return d.x; }).left;

            // interpolate rather than bisect?
            svg
              .append('rect')
              .datum(data)
              .style("fill", "none")
              .style("pointer-events", "all")
              .attr('width', width)
              .attr('height', height)
              .on('mousemove', function(d){
                var x0 = x.invert(d3.mouse(this)[0]);
                var i = bisect(d, x0, 1);
                dispatch.call("updatefocus", this, i)
              })
              
            dispatch.on("updatefocus." + id, function(i) {
              y_labels.forEach(function(key) {
                svg.selectAll("#circle-" + key)
                  .attr("cx", x(data[i].x))
                  .attr("cy", y(data[i][key]))
                  .style("opacity", 1)
                svg.selectAll("#text-" + key)
                  .text(d => "— " + d + ": " + data[i][key].toFixed(3));
              });      
            })
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
    }

    dispatch.on("updateparams." + id, function(ode_soln) {
      console.log(ode_soln);
      render(ode_soln);
    });

    return svg.node();
  }