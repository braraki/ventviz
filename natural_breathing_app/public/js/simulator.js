// https://www.d3-graph-gallery.com/graph/line_several_group.html

function simulate(params) {
    var y0 = [params["frc"], 0, 0, 0, 0];
    var soln = runODE(params["t0"], params["tf"], y0, params);  
    return soln
}

var param_dict = {
    "R": 2,
    "C": 140,
    "frc": 2,
    "pbf": 10,
    "pbmp": 7,
    "pbit": 1,
    "t0": 0,
    "tf": 10,
    "step": 0.1
}

// https://bl.ocks.org/mbostock/5872848
// follow this logic for updating the charts

// dispatch a resolve/reset function

var ode_soln = simulate(param_dict)


var containerWidth = +d3.select("#chart-stack").style('width').replace(/\D/g, '')

var margin = {top: 10, right: 60, bottom: 60, left: 60},
    width = containerWidth - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;



var dispatch = d3.dispatch("updatefocus", "updateparams");

var param_info = {"C": {"label": "Compliance"}}

// some of the parameters break things when changed, e.g. 
var ode_params = [{"param": "C", "label": "Compliance"}, {"param": "R", "label": "Resistance"}, {"param": "tf", "label": "Ending Time"},
{"param": "pbf", "label": "Patient Breath Frequency"}]

// todo: clean up variable scoping
function createForms() {
    d3.select("#ode-params")
        .selectAll("p")
        .data(ode_params)
        .enter()
        .append("div")
        .each(function(d) {
            d3.select(this).append("span")
                .text(d.label + ": ")
            d3.select(this).append("input")
                .attr("type", "number")
                .attr("value", param_dict[d.param])
                .attr("id", param_dict[d.param] + "-input")
                .attr("min", 0.01)
                .on("change", function() {
                    param_dict[d.param] = this.value;
                    updateParams();
                })
        })
    /*var animate_div = d3.select("#animate-params")
        .append("div")

    animate_div.append("span")
        .text("Time Period")

    animate_div.append("input")
        .attr("type", "number")
        .attr("value", param_dict["tf"] - param_dict["t0"])
        .attr("min", 1)
        .attr("step", 1)
        .on("change", function() {
            
        })*/
}

function createCharts() {
    groupedLineChart({id: "volumeChart", y_info: {"volume": {"color": "red", "label": "Volume (L)"}}, dispatch: dispatch, margin: margin, width: width, height: height})
    groupedLineChart({id: "flowChart", y_info: {"flow": {"color": "red", "label": "Flow (L/s)"}}, dispatch: dispatch, margin: margin, width: width, height: height})
    groupedLineChart({id: "pressureChart", y_info: {"paw": {"color": "red", "label": "Paw"}, "palv": {"color": "blue", "label": "Palv"}, "pmus": {"color": "pink", "label": "Pmus"}}, dispatch: dispatch, margin: margin, width: width, height: height})    
}

function updateParams() {
    var ode_soln = simulate(param_dict);
    dispatch.call("updateparams", this, ode_soln);
}

function init() {
    createForms();
    createCharts();
    updateParams();
}

init();
