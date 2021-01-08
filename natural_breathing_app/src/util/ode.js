import * as odex from 'odex'

function sinBreath(t, patient_breath_max_pmus, patient_breath_inspiratory_time) {


    var dpmus = t < patient_breath_inspiratory_time ? 
        patient_breath_max_pmus * (Math.PI/patient_breath_inspiratory_time) * 
        Math.cos(Math.PI*t/patient_breath_inspiratory_time) : 0

    return dpmus;
}

// return flow in mL/s
// need to get 'volume' control working for this. right now the rise time
// is tuned for the trapezoidal flow, not for this exponential flow
function exponential_flow(t, flow, insp_time, const_flow, flow_rise_time) {
    flow = 1000.0 * flow;
    if (t < flow_rise_time) {
        var dflow = 100.0*(const_flow - flow);
    }
    else if (t >= (insp_time - flow_rise_time) && t < insp_time) {
        var dflow = 100.0 * (0 - flow);
    }
    else {
        var dflow = 0;
    }

    return dflow;
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

            var dpmus = sinBreath(patient_breath_t,
                patient_breath_max_pmus, patient_breath_inspiratory_time);

            var dpalv = dpmus - palv/(R*C);

            var dflow = dpalv/R;

            var dvolume = flow;

            var dpaw = 0;

            return [dvolume, dflow, dpaw, dpalv, dpmus];
        };
    };

    var volumeControl = function(params) {
        var R = params["R"];
        var C = params["C"]/1000.;
        //var frc = params["frc"];
        var patient_breath_time = 60./params["pbf"];
        var patient_breath_max_pmus = params["pbmp"];
        var patient_breath_inspiratory_time = params["pbit"];

        var RR = params["RR"];
        var IE = params["IE"];
        var VT = params["VT"];
        var peep = params["peep"];

        var flow_rise_time = params['flow_rise_time'];

        var breath_time = 60./RR;
        var insp_time = 1./(1. + IE) * breath_time;
        var const_flow = VT/(insp_time - flow_rise_time);

        return function(t, y) {
            //var volume = y[0] - frc;
            var flow = y[1];
            var paw = y[2];
            var palv = y[3];
            var pmus = y[4];

            var patient_breath_t = t % patient_breath_time;

            var dpmus = sinBreath(patient_breath_t,
                patient_breath_max_pmus,patient_breath_inspiratory_time);

            t = t % breath_time;

            // inpsiratory phase, when the ventilator is delivering
            // a set flow to the patient
            if (t < insp_time) {
                var dvolume = flow;
                var dflow = exponential_flow(t, flow, insp_time,
                    const_flow, flow_rise_time)/1000.; // L / s
                var dpalv = - dpmus + flow/C;
                var dpaw = dpalv + R*dflow;
            }
            // this here delivers approximately a step function to reset the flow
            // to be -volume/(R*C) for when expiration starts
            // Paw also needs to be set to PEEP during this time
            else if (t >= insp_time && t < insp_time + 0.02) {
                var dvolume = 0;
                var dpaw = -(paw-peep)/0.005;
                var dpalv = 0;
                var dflow = ((- palv + peep)/R)/0.02 + pmus/R;
            }
            // expiratory phase, where the ventilator allows the
            // patient to PASSIVELY exhale (the ventilator does not
            // control exhalation in any way in this case, although
            // there are ventilator control modes that can force
            // active exhalation I think)
            else {
                var dvolume = flow;
                var dflow = -flow/(R*C) + dpmus/R;
                var dpalv = - dflow*R;
                var dpaw = -(paw-peep)/0.1;
            }
            return [dvolume, dflow, dpaw, dpalv, dpmus];
        };
    };

    var t_data = [];
    var volume_data = [];
    var flow_data = [];
    var paw_data = [];
    var palv_data = [];
    var pmus_data = [];

    s.solve(volumeControl(params),
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