import * as odex from 'odex'

function sinBreath(t, patient_breath_max_pmus, patient_breath_inspiratory_time) {


    var dpmus = t < patient_breath_inspiratory_time ? 
        patient_breath_max_pmus * (Math.PI/patient_breath_inspiratory_time) * 
        Math.cos(Math.PI*t/patient_breath_inspiratory_time) : 0

    return dpmus;
}

function solveODE(time, params, current_state) {
    var y0 = [current_state["volume"], current_state["flow"], current_state["paw"], current_state["palv"], current_state["pmus"]];
    var soln = runODE(0, time, params["step"], y0, params);
    return soln
}

function runODE(t0, tf, step, y0, params) {
    var s = new odex.Solver(5);
    s.denseOutput = true;  // request interpolation closure in solution callback

    var naturalBreathing = function(params) {
        var R = params["R"];
        var C = params["C"]/1000.;
        //var frc = params["frc"];
        var patient_breath_time = 60./params["pbf"];
        var patient_breath_max_pmus = params["pbmp"];
        var patient_breath_inspiratory_time = params["pbit"];

        return function(t, y) {
            //var volume = y[0] - frc;
            var flow = y[1];
            //var paw = y[2];
            var palv = y[3];
            //var pmus = y[4];

            var patient_breath_t = t % patient_breath_time;

            var dpmus = sinBreath(patient_breath_t, patient_breath_max_pmus, patient_breath_inspiratory_time);

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

    s.solve(naturalBreathing(params),
            t0,    // initial x value
            y0,  // initial y values (just one in this example)
            tf,
            s.grid(step, function(t, y) {
                t_data.push(t);
                volume_data.push(y[0]);
                flow_data.push(y[1]);
                paw_data.push(y[2]);
                palv_data.push(y[3]);
                pmus_data.push(y[4]);
                // console.log(t, y);
        }));   // final x value

    var soln = {
        "time": t_data,
        "volume": volume_data,
        "flow": flow_data,
        "paw": paw_data,
        "palv": palv_data,
        "pmus": pmus_data
    }

    return soln
}

export { solveODE }