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


    renderChartD3(volume_data, "volumeChart", labels);
    renderChartD3(flow_data, "flowChart", labels);
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

function renderChartD3(data, div_name, time) {
    var containerWidth = +d3.select("#" + div_name).style('width').slice(0, -2)

    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 30, left: 30},
        width = containerWidth - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#" + div_name)
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    var data_fixed = d3.zip(time, data)
        .map(function(d) {
            return {
                x: d[0].toFixed(3),
                y: d[1].toFixed(3)
            };
        });

    // Add X axis --> it is a date format
    var x = d3.scaleLinear()
        .domain(d3.extent(time))
        .range([ 0, width ])
        .nice();
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
        .domain(d3.extent(data))
        .range([ height, 0 ])
        .nice();
    svg.append("g")
        .call(d3.axisLeft(y));

      // This allows to find the closest X index of the mouse:
      var bisect = d3.bisector(function(d) { return d.x; }).left;

      // Create the circle that travels along the curve of chart
      var focus = svg
        .append('g')
        .append('circle')
          .style("fill", "none")
          .attr("stroke", "black")
          .attr('r', 8.5)
          .style("opacity", 0)

      // Create the text that travels along the curve of chart
      var focusText = svg
        .append('g')
        .append('text')
          .style("opacity", 0)
          .attr("text-anchor", "left")
          .attr("alignment-baseline", "middle")

      // Add the line
      svg
        .append("path")
        .datum(data_fixed)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
          .x(function(d) { return x(d.x) })
          .y(function(d) { return y(d.y) })
          )

      // Create a rect on top of the svg area: this rectangle recovers mouse position
      svg
        .append('rect')
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr('width', width)
        .attr('height', height)
        .on('mouseover', function(){mouseover(focus, focusText);})
        .on('mousemove', mousemove)
        .on('mouseout', function(){mouseout(focus, focusText);});

    // What happens when the mouse move -> show the annotations at the right positions.


  function mousemove() {
    // recover coordinate we need
    var x0 = x.invert(d3.mouse(this)[0]);
    var i = bisect(data_fixed, x0, 1);
    selectedData = data_fixed[i]
    focus
      .attr("cx", x(selectedData.x))
      .attr("cy", y(selectedData.y))
    focusText
      .html("x:" + selectedData.x + "  -  " + "y:" + selectedData.y)
      .attr("x", x(selectedData.x)+15)
      .attr("y", y(selectedData.y))
    }


}

  function mouseover(focus, focusText) {
    focus.style("opacity", 1)
    focusText.style("opacity",1)
  }

  function mouseout(focus, focusText) {
    focus.style("opacity", 0)
    focusText.style("opacity", 0)
  }

function renderChart(volume_data, flow_data, paw_data, palv_data, pmus_data, time) {
    time = time.map(x => x.toFixed(3));
    volume_data = volume_data.map(x => x.toFixed(6));
    flow_data = flow_data.map(x => x.toFixed(6));
    paw_data = paw_data.map(x => x.toFixed(6));
    palv_data = palv_data.map(x => x.toFixed(6));
    pmus_data = pmus_data.map(x => x.toFixed(6));



    var ctxVolume = document.getElementById("volumeChart").getContext('2d');
    var volumeChart = new Chart(ctxVolume, {
        type: 'line',
        data: {
            labels: time,
            datasets: [{
                label: 'Volume',
                data: volume_data,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
            }]
        },
    });

    var ctxFlow = document.getElementById("flowChart").getContext('2d');
    var flowChart = new Chart(ctxFlow, {
        type: 'line',
        data: {
            labels: time,
            datasets: [{
                label: 'Flow',
                data: flow_data,
                borderColor: 'rgba(192, 0, 0, 1)',
                backgroundColor: 'rgba(192, 0, 0, 0.2)',
            }]
        },
    });

    var ctxPressure = document.getElementById("pressureChart").getContext('2d');
    var pressureChart = new Chart(ctxPressure, {
        type: 'line',
        data: {
            labels: time,
            datasets: [{
                label: 'paw',
                data: paw_data,
                borderColor: 'rgba(0, 192, 0, 1)',
                backgroundColor: 'rgba(0, 192, 0, 0.2)',
            },
            {
                label: '$P_{alv}$',
                data: palv_data,
                borderColor: 'rgba(0, 0, 192, 1)',
                backgroundColor: 'rgba(0, 0, 192, 0.2)',
            },
            {
                label: 'pmus',
                data: pmus_data,
                borderColor: 'rgba(192, 0, 0, 1)',
                backgroundColor: 'rgba(192, 0, 0, 0.2)',
            }],
        },
    });

    return [volumeChart, flowChart, pressureChart];
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
            s.grid(0.05, function(t, y) {
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

$("#renderBtn").click(

    function () {
        var R = 2.;
        var C = 140.;
        var frc = 2.;
        var patient_breath_frequency = 10.;
        var patient_breath_time = 60./patient_breath_frequency;
        var patient_breath_max_pmus = 7;
        var patient_breath_inspiratory_time = 1;
        var params = [R, C, frc, patient_breath_time, patient_breath_max_pmus, patient_breath_inspiratory_time];
        // params.push()
        var t0 = 0;
        var tf = 10;
        var y0 = [frc, 0, 0, 0, 0];
        const [labels, volume_data, flow_data, paw_data, palv_data, pmus_data] = runODE(t0, tf, y0, params);
        // data = [20000, 14000, 12000, 15000, 18000, 19000, 22000];
        // labels =  ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        var [volumeChart, flowChart, pressureChart] = renderChart(volume_data, flow_data, paw_data, palv_data, pmus_data, labels);
    }
);

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

// var R = 2.;
// var C = 140.;
// var frc = 2.;
// var patient_breath_frequency = 10.;
// var patient_breath_time = 60./patient_breath_frequency;
// var patient_breath_max_pmus = 7;
// var patient_breath_inspiratory_time = 1;
// var params = [R, C, frc, patient_breath_time, patient_breath_max_pmus, patient_breath_inspiratory_time];
// var t0 = 0;
// var tf = 10;
// var y0 = [frc, 0, 0, 0, 0];
// const [labels, volume_data, flow_data, paw_data, palv_data, pmus_data] = runODE(t0, tf, y0, params);
// var [volumeChart, flowChart, pressureChart] = renderChart(volume_data, flow_data, paw_data, palv_data, pmus_data, labels);