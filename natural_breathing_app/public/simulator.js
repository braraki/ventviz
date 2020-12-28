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
    "tf": 10
}

var soln = simulate(param_dict)

var margin = {top: 10, right: 60, bottom: 60, left: 60},
width = 1200 - margin.left - margin.right,
height = 300 - margin.top - margin.bottom;

var dispatch = d3.dispatch("updatefocus");
console.log(dispatch)
groupedLineChart({id: "volumeChart", "x": soln.time, "ys": {"volume": soln.volume}, "colors": {"volume": "red"}, "dispatch": dispatch})
groupedLineChart({id: "flowChart", "x": soln.time, "ys": {"flow": soln.flow}, "colors": {"flow": "red"}, "dispatch": dispatch})
groupedLineChart({id: "pressureChart", "x": soln.time, "ys": {"paw": soln.paw, "palv": soln.palv, "pmus": soln.pmus}, "colors": {"paw": "red", "palv": "blue", "pmus": "pink"}, "dispatch": dispatch})

