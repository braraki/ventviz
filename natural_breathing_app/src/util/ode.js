import * as odex from 'odex'

function sinBreath(t, patientBreathMaxPMUS, patientBreathInspiratoryTime) {


    var dpmus = t < patientBreathInspiratoryTime ? 
        - patientBreathMaxPMUS * (Math.PI/patientBreathInspiratoryTime) * 
        Math.cos(Math.PI*t/patientBreathInspiratoryTime) : 0

    return dpmus;
}

// return flow in mL/s
// need to get 'volume' control working for this. right now the rise time
// is tuned for the trapezoidal flow, not for this exponential flow
function exponential_flow(t, flow, inspTime, constFlow, flowRiseTime) {
    var flowML = 1000.0 * flow;
    var dflow;
    dflow = 100.0*(constFlow - flowML);

    return dflow;
}

function solveODE(startTime, endTime, params, current_state) {
    //console.log("solving ode with params:", params);
    var y0 = [current_state["volume"], current_state["flow"], current_state["paw"], current_state["palv"], current_state["pmus"]];
    var soln = runODE(startTime, endTime, params["step"], y0, params);
    
    return soln
}

function runODE(t0, tf, step, y0, params) {
    var s = new odex.Solver(5);
    s.denseOutput = true;  // request interpolation closure in solution callback

    var naturalBreathing = function(params) {
        var R = params["R"];
        var C = params["C"]/1000.;
        //var frc = params["frc"];
        var patientBreathTime = 60./params["pbf"];
        var patientBreathMaxPMUS = params["pbmp"];
        var patientBreathInspiratoryTime = params["pbit"];

        return function(t, y) {
            //var volume = y[0] - frc;
            var flow = y[1];
            //var paw = y[2];
            var palv = y[3];
            //var pmus = y[4];

            var patientBreathT = t % patientBreathTime;

            var dpmus = sinBreath(patientBreathT,
                patientBreathMaxPMUS, patientBreathInspiratoryTime);

            var dpalv = dpmus - palv/(R*C);

            var dflow = -dpalv/R;

            var dvolume = flow;

            var dpaw = 0;

            return [dvolume, dflow, dpaw, dpalv, dpmus];
        };
    };

    var volumeControl = function(params) {
        var R = params["R"];
        var C = params["C"]/1000.;
        //var frc = params["frc"];
        var patientBreathTime = 60./params["pbf"];
        var patientBreathMaxPMUS = params["pbmp"];
        var patientBreathInspiratoryTime = params["pbit"];

        var RR = params["RR"];
        // var IE = params["IE"];
        var inspTime = params['insp']
        var VT = params["VT"];
        var peep = params["peep"];

        var flowRiseTime = params['frt'];

        var breathTime = 60./RR;
        // var inspTime = 1./(1. + IE) * breathTime;
        var constFlow = VT/(inspTime);

        return function(t, y) {
            //var volume = y[0] - frc;
            var flow = y[1];
            var paw = y[2];
            var palv = y[3];
            var pmus = y[4];
            
            var patientBreathT = t % patientBreathTime;

            var dpmus = sinBreath(patientBreathT,
                patientBreathMaxPMUS,patientBreathInspiratoryTime);

            var flowT = t % breathTime;

            var dvolume, dflow, dpalv, dpaw;

            // inpsiratory phase, when the ventilator is delivering
            // a set flow to the patient
            if (flowT < inspTime) {
                dvolume = flow;
                dflow = exponential_flow(flowT, flow, inspTime,
                    constFlow, flowRiseTime)/1000.; // L / s
                dpalv = dpmus + flow/C;
                dpaw = dpalv + R*dflow;
            }
            // this here delivers approximately a step function to reset the flow
            // to be -volume/(R*C) for when expiration starts
            // Paw also needs to be set to PEEP during this time
            else if (flowT >= inspTime && flowT < inspTime + 0.06) {
                dvolume = 0;
                dpaw = -(paw-peep)/0.005;
                dpalv = dpmus;
                dflow = -(flow - (- palv + peep)/R )/0.005 - dpmus/R;
            }
            // expiratory phase, where the ventilator allows the
            // patient to PASSIVELY exhale (the ventilator does not
            // control exhalation in any way in this case, although
            // there are ventilator control modes that can force
            // active exhalation I think)
            else {
                dvolume = flow;
                dflow = -flow/(R*C) - dpmus/R;
                dpalv = - dflow*R;
                dpaw = -(paw-peep)/0.1;
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

    var breathingMode = params["ventilated"] ? volumeControl : naturalBreathing;

    s.solve(breathingMode(params),
            t0,    // initial x value
            y0,  // initial y values
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