var s = new Solver(1);
s.denseOutput = true;  // request interpolation closure in solution callback

var f = function(x, y) {
  return y;
}

var results = [];

var y = s.solve(f,
        0,    // initial x value
        [1],  // initial y values (just one in this example)
        1,
        s.grid(0.2, function(x, y) {
            results.push([x, y[0]])
    }));   // final x value

document.getElementById("ode").innerHTML = results.toString();