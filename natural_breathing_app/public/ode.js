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

        
        var R = params["R"];
        var C = params["C"]/1000.;
        var frc = params["frc"];
        var patient_breath_time = 60./params["pbf"];
        var patient_breath_max_pmus = params["pbmp"];
        var patient_breath_inspiratory_time = params["pbit"];
       
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

    s.solve(natural_breathing(params),
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

    soln = {
        "time": t_data,
        "volume": volume_data,
        "flow": flow_data,
        "paw": paw_data,
        "palv": palv_data,
        "pmus": pmus_data
    }

    return soln
}