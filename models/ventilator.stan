// hello

functions {
  real flow_function(real t,
                     real insp_time,
                     real const_flow,
                     real flow_rise_time) {
    real sign = 0;
    if (t <= flow_rise_time)
      sign = 1.0;
    else if (t >= (insp_time - flow_rise_time))
      sign = -1.0;

    real dFlow = sign*const_flow/flow_rise_time;
    return dFlow;
  }

  vector ventilator(real t,
                    vector y,             // [volume, pressure, flow]
                    real R,               // resistance
                    real C_dyn,           // dynamic compliance
                    real C_static,        // static compliance
                    real insp_time,       // inpsiration time
                    real const_flow,      // flow input [mL/s]
                    real flow_rise_time,  // how long it takes the inputted flow to go from 0 to the commanded rate
                    real breath_time,     //total length of breath
                    real hold_time,       // plateau pause time
                    real peep,            // PEEP
                    real frc) {           // functional residual capacity
    vector[3] dydt;

    real dVolume;
    real dPressure;
    real dFlow;

    real volume = y[1] - frc;
    real pressure = y[2];
    real flow = y[3];

    real num_breaths = floor(t / breath_time);

    real mod_t = t - num_breaths * breath_time;

    if (mod_t < insp_time) {
      dVolume = flow;
      dFlow = flow_function(mod_t, insp_time, const_flow, flow_rise_time);
      dPressure = flow/C_dyn + R*dFlow;
    }
    else if (mod_t < (insp_time + hold_time)) {
      dVolume = 0;
      dFlow = 0;
      dPressure = (- pressure + volume/C_static + peep)/(R*C_static);
    }
    else if (mod_t < insp_time + hold_time + 0.02) {
      dVolume = flow;
      dPressure = (- pressure + peep)/(R*C_static);
      dFlow = (-volume/(R*C_static))/0.02;
    }
    else {
      dVolume = flow;
      dPressure = (-pressure + peep)/(R * C_static);
      dFlow = - flow / (R*C_static);
    }

    dydt = [dVolume, dPressure, dFlow]';

    return dydt;
  }
}

data {
  int<lower=0> N_t;
  real ts[N_t];
}

transformed data {
  real RR = 20;
  real IE = 3;
  real VT = 0.500;
  real peep = 5;

  real R = 5;
  real C_dyn = 0.049;
  real C_static = 0.050;
  real hold_time = 0.4;
  real frc = 2.0;
  real breath_time = 60/RR;
  real insp_time = 1.0/(1.0 + IE) * breath_time;
  real flow_rise_time = 0.05;
  real const_flow = VT/(insp_time - flow_rise_time);
  vector[3] y0 = [frc, peep, 0.0]'; // volume, pressure, flow
  real t0 = 0.0;
}
 
generated quantities {
  real breath_timeq = breath_time;
  real insp_timeq = insp_time;
  real const_flowq = const_flow;

  vector[3] y[N_t] = ode_rk45(ventilator, y0, t0, ts,
               R, C_dyn, C_static, insp_time, const_flow,
               flow_rise_time, breath_time, hold_time, peep, frc);

  for (t in 1:N_t) {
    y[t, 1] += normal_rng(0, 0.005);
    y[t, 2] += normal_rng(0, 0.2);
    y[t, 3] += normal_rng(0, 0.05);
  }
}