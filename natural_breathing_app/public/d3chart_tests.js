var Chart = function(div_name, names, colors, indices){
  this.div_name = div_name;
  this.names = names;
  this.colors = colors;
  this.indices = indices;
};

// $.extend(Chart.prototype, {
//   get_div_name: function(){
//     return this.div_name;
//   }
// });

var Simulator = function(R, C, frc, pbf, pbmp, pbit, t0, tf) {
    this.R = R;
    this.C = C;
    this.frc = frc;
    this.patient_breath_frequency = pbf;
    this.patient_breath_time = 60./pbf;
    this.patient_breath_max_pmus = pbmp;
    this.patient_breath_inspiratory_time = pbit;
    var params = [this.R, this.C, this.frc, this.patient_breath_time, this.patient_breath_max_pmus, this.patient_breath_inspiratory_time];
    this.t0 = t0;
    this.tf = tf;
    this.y0 = [this.frc, 0, 0, 0, 0];
    var [labels, volume_data, flow_data, paw_data, palv_data, pmus_data] = runODE(t0, tf, this.y0, params);
    // var [volumeChart, flowChart, pressureChart] = renderChart(volume_data, flow_data, paw_data, palv_data, pmus_data, labels);
    
    var dispatch = d3.dispatch('mymousemove');
    
    var volumeChart = new Chart("volumeChart", ["— Volume (mL)"], ['red'], [0]);
    var flowChart = new Chart("flowChart", ["— Flow (L/s)"], ['red'], [1]);
    var pressureChart = new Chart("pressureChart", ["— Paw", "— Palv", "— Pmus"], ['red', 'blue', 'pink'], [2, 3, 4]);

    // renderChartD3([volume_data], "volumeChart", labels, ["— Volume (mL)"], ['red'], [0]);
    // renderChartD3([flow_data], "flowChart", labels, ["— Flow (L/s)"], ['red'], [1]);
    // renderChartD3([paw_data, palv_data, pmus_data], "pressureChart", labels, ["— Paw", "— Palv", "— Pmus"], ['red', 'blue', 'pink'], [2, 3, 4]);
    
    renderChartD3All([volume_data, flow_data, paw_data, palv_data, pmus_data], labels,
      [volumeChart, flowChart, pressureChart]);
    // this.volumeChart = volumeChart;
    // this.flowChart = flowChart;
    // this.pressureChart = pressureChart;
};

$.extend(Simulator.prototype, {
    update: function() {
        this.patient_breath_time = 60./this.patient_breath_frequency;
        var params = [this.R, this.C, this.frc, this.patient_breath_time, this.patient_breath_max_pmus, this.patient_breath_inspiratory_time];
        var [labels, volume_data, flow_data, paw_data, palv_data, pmus_data] = runODE(this.t0, this.tf, this.y0, params);
        
        labels = labels.map(x => x.toFixed(3));
        volume_data = volume_data.map(x => x.toFixed(6));
        flow_data = flow_data.map(x => x.toFixed(6));
        paw_data = paw_data.map(x => x.toFixed(6));
        palv_data = palv_data.map(x => x.toFixed(6));
        pmus_data = pmus_data.map(x => x.toFixed(6));

        this.volumeChart.data.labels = labels;
        this.volumeChart.data.datasets[0].data = volume_data;
        this.volumeChart.update();
        this.flowChart.data.labels = labels;
        this.flowChart.data.datasets[0].data = flow_data;
        this.flowChart.update();
        this.pressureChart.data.labels = labels;
        this.pressureChart.data.datasets[0].data = paw_data;
        this.pressureChart.data.datasets[1].data = palv_data;
        this.pressureChart.data.datasets[2].data = pmus_data;
        this.pressureChart.update();
    }
});

var mySimulator = new Simulator(2, 140, 2, 10, 7, 1, 0, 10);

function renderChartD3All(datas, time, charts) {
    // This allows to find the closest X index of the mouse:
    var bisect = d3.bisector(function(d) { return d.x; }).left;

    var data_fixed = datas.map(data => {
      return d3.zip(time, data)
        .map(function(d) {
            return {
                x: d[0].toFixed(3),
                y: d[1].toFixed(3)
            };
      });
    });

    // need to make the y scales before the rest of the chart
    // so that each chart can reference the y scales of the other charts
    // when updating the focus position
    var ys = [];
    charts.forEach(function(chart, c_i){
      var containerWidth = +d3.select("#" + chart.div_name).style('width').slice(0, -2);

      // set the dimensions and margins of the graph
      var margin = {top: 10, right: 60, bottom: 60, left: 60},
          width = containerWidth - margin.left - margin.right,
          height = 300 - margin.top - margin.bottom;

      var y_scale = [];
      chart.indices.forEach(function(index, i_i){
        y_scale = y_scale.concat(d3.extent(datas[index]));
      });
      y_scale = d3.extent(y_scale);

      // Add Y axis
      var y = d3.scaleLinear()
        .domain(y_scale)
        .range([ height, 0 ]);

      ys = ys.concat(y);
    });

    // BIG CHART FUNCTION
    charts.forEach(function(chart, c_i){
      var containerWidth = +d3.select("#" + chart.div_name).style('width').slice(0, -2);

      // set the dimensions and margins of the graph
      var margin = {top: 10, right: 60, bottom: 60, left: 60},
          width = containerWidth - margin.left - margin.right,
          height = 300 - margin.top - margin.bottom;

      // append the svg object to the body of the page
      var svg = d3.select("#" + chart.div_name)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");


      // Add X axis --> it is a date format
      var x = d3.scaleLinear()
        .domain(d3.extent(time))
        .range([ 0, width ]);
      svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

      svg.append("g")
        .call(d3.axisLeft(ys[c_i]));

      var lineGenerator = d3.line()
        .x(function(d) {
          return x(d.x);
        })
        .y(function(d) {
          return ys[c_i](d.y);
        })
        .curve(d3.curveMonotoneX);

        // MAKE PLOT FOR EACH DATA SET IN THE CHART
        chart.indices.forEach(function(index, i_i) {
          data = data_fixed[index];
          var pathData = lineGenerator(data);

          // Add the line
          svg
            .append("path")
            .attr('d', pathData)
            .attr("fill", "none")
            .attr("stroke", chart.colors[i_i])
            .attr("stroke-width", 2)


          // Create the circle that travels along the curve of chart
          var focus = svg
            .append('g')
            .append('circle')
              .style("fill", chart.colors[i_i])
              .attr("class", "circlescrub")
              .attr("id", "circlescrub" + index)
              .attr("stroke", chart.colors[i_i])
              .attr('r', 6)
              .style("opacity", 0)

          // Create the text that travels along the curve of chart
          var focusText = svg
            .append('g')
            .append('text')
            .html(chart.names[i_i])
              .attr("class", "textscrub")
              .attr("id", "textscrub" + index)
              .attr("text-anchor", "left")
              .attr("alignment-baseline", "middle")
              .attr("x", x(7.5))
              .attr("y", height*0.1 + 17*i_i)
              .attr("fill", chart.colors[i_i])

        });

        // Create a rect on top of the svg area: this rectangle recovers mouse position
        svg
          .append('rect')
          .style("fill", "none")
          .style("pointer-events", "all")
          .attr('width', width)
          .attr('height', height)
          .on('mouseover', function(){mouseover();})
          .on('mousemove', function(){mousemove(this);})
          .on('mouseout', function(){mouseout();})


        function mousemove(box) {
          // recover coordinate we need
          var x0 = x.invert(d3.mouse(box)[0]);

          for(var i = 0; i < charts.length; i++) {
            for(var j = 0; j < charts[i].names.length; j++){
              var data_index = bisect(data_fixed[charts[i].indices[j]], x0, 1);
              selectedData = data_fixed[charts[i].indices[j]][data_index];

              d3.select("#circlescrub" + charts[i].indices[j])
                .attr("cx", x(selectedData.x))
                .attr("cy", ys[i](selectedData.y));

              d3.select("#textscrub" + charts[i].indices[j])
                .html(charts[i].names[j] + ": " + selectedData.y);
            }
          }
        };


    });

    function mouseover() {
      d3.selectAll(".circlescrub").style("opacity", 1);
      // focus.style("opacity", 1)
      // focusText.style("opacity",1)
    };

    function mouseout() {
      d3.selectAll(".circlescrub").style("opacity", 0)
      // focus.style("opacity", 0)
      for(var i = 0; i < charts.length; i++){
        for(var j = 0; j < charts[i].names.length; j++){
          d3.select("#textscrub" + charts[i].indices[j])
            .html(charts[i].names[j])
        }
      }
      // focusText.style("opacity", 1)
      // .html(names[index])
    };

}

function renderChartD3(datas, div_name, time, names, colors, indices) {
    var containerWidth = +d3.select("#" + div_name).style('width').slice(0, -2)

    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 60, bottom: 60, left: 60},
        width = containerWidth - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#" + div_name)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis --> it is a date format
    var x = d3.scaleLinear()
      .domain(d3.extent(time))
      .range([ 0, width ]);
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
      .domain([-5, 10])
      .range([ height, 0 ]);
    svg.append("g")
      .call(d3.axisLeft(y));


    var lineGenerator = d3.line()
      .x(function(d) {
        return x(d.x);
      })
      .y(function(d) {
        return y(d.y);
      })
      .curve(d3.curveMonotoneX);

    // This allows to find the closest X index of the mouse:
    var bisect = d3.bisector(function(d) { return d.x; }).left;

    var data_fixed = datas.map(data => {
      return d3.zip(time, data)
        .map(function(d) {
            return {
                x: d[0].toFixed(3),
                y: d[1].toFixed(3)
            };
      });
    });

    // MAKE PLOT FOR EACH DATA SET
    data_fixed.forEach(function(data, index){
      var pathData = lineGenerator(data);

      // Add the line
      svg
        .append("path")
        .attr('d', pathData)
        .attr("fill", "none")
        .attr("stroke", colors[index])
        .attr("stroke-width", 2)


      // Create the circle that travels along the curve of chart
      var focus = svg
        .append('g')
        .append('circle')
          .style("fill", colors[index])
          .attr("class", "circlescrub")
          .attr("id", "circlescrub" + indices[index])
          .attr("stroke", colors[index])
          .attr('r', 6)
          .style("opacity", 0)

      // Create the text that travels along the curve of chart
      var focusText = svg
        .append('g')
        .append('text')
        .html(names[index])
          .attr("class", "textscrub")
          .attr("id", "textscrub" + indices[index])
          .attr("text-anchor", "left")
          .attr("alignment-baseline", "middle")
          .attr("x", x(7.5))
          .attr("y", height*0.1 + 17*index)
          .attr("fill", colors[index])

      // Create a rect on top of the svg area: this rectangle recovers mouse position
      svg
          .append('rect')
          .style("fill", "none")
          .style("pointer-events", "all")
          .attr('width', width)
          .attr('height', height)
          .on('mouseover', function(){mouseover();})
          .on('mousemove', function(){mousemove(this, focus, focusText);})
          .on('mouseout', function(){mouseout(focus, focusText);});

      function mousemove(box, focus, focusText) {
        // recover coordinate we need
        var x0 = x.invert(d3.mouse(box)[0]);
        var i = bisect(data, x0, 1);

        for(var j = 0; j < data_fixed.length; j++) {
          selectedData = data_fixed[j][i]
          d3.select("#circlescrub" + indices[j])
            .attr("cx", x(selectedData.x))
            .attr("cy", y(selectedData.y))
          d3.select("#textscrub" + indices[j])
            .html(names[j] + ": " + selectedData.y) // + "  -  " + "y:" + selectedData.y)
          //   .attr("x", x(selectedData.x)+15)
          //   .attr("y", y(selectedData.y))
        }
      };

      function mouseover() {
        d3.selectAll(".circlescrub").style("opacity", 1);
        // focus.style("opacity", 1)
        // focusText.style("opacity",1)
      };

      function mouseout(focus, focusText) {
        d3.selectAll(".circlescrub").style("opacity", 0)
        // focus.style("opacity", 0)
        for(var j = 0; j < names.length; j++){
          d3.select("#textscrub" + indices[j])
            .html(names[j])
        }
        // focusText.style("opacity", 1)
        // .html(names[index])
      };



    })

}

function sinusoidal_breath(t, patient_breath_max_pmus, patient_breath_inspiratory_time) {
    if (t < patient_breath_inspiratory_time){
        dpmus = patient_breath_max_pmus * (Math.PI/patient_breath_inspiratory_time) * Math.cos(Math.PI*t/patient_breath_inspiratory_time)
    }
    else{
        dpmus = 0;
    }
    return dpmus;
}

function runODE(t0, tf, y0, params) {
    var s = new Solver(5);
    s.denseOutput = true;  // request interpolation closure in solution callback

    var natural_breathing = function(params) {
        var R = params[0];
        var C = params[1]/1000.;
        var frc = params[2];
        var patient_breath_time = params[3];
        var patient_breath_max_pmus = params[4];
        var patient_breath_inspiratory_time = params[5];

        return function(t, y) {
            var volume = y[0] - frc;
            var flow = y[1];
            var paw = y[2];
            var palv = y[3];
            var pmus = y[4];

            var patient_breath_t = t % patient_breath_time;

            var dpmus = sinusoidal_breath(patient_breath_t, patient_breath_max_pmus, patient_breath_inspiratory_time);

            var dpalv = dpmus - palv/(R*C);

            var dflow = dpalv/R;

            var dvolume = flow;

            var dpaw = 0;

            return [dvolume, dflow, dpaw, dpalv, dpmus];
        };
    };

    var t_data = [];
    var volume_data = [];
    var flow_data = [];
    var paw_data = [];
    var palv_data = [];
    var pmus_data = [];

    var y = s.solve(natural_breathing(params),
            t0,    // initial x value
            y0,  // initial y values (just one in this example)
            tf,
            s.grid(0.1, function(t, y) {
                t_data.push(t);
                volume_data.push(y[0]);
                flow_data.push(y[1]);
                paw_data.push(y[2]);
                palv_data.push(y[3]);
                pmus_data.push(y[4]);
                // console.log(t, y);
        }));   // final x value

    return [t_data, volume_data, flow_data, paw_data, palv_data, pmus_data];
}

$("#complianceInput").click(
    function () {
        C = $(this).val();
        mySimulator.C = C;
        mySimulator.update();
    }
);

$("#resistanceInput").click(
    function () {
        R = $(this).val();
        mySimulator.R = R;
        mySimulator.update();
    }
);