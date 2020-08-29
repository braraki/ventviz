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
      dPressure = flow/C_static + R*dFlow;
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

    dydt = [dVolume, dPressure, dFlow]'; // '

    return dydt;
  }
}

data {
  int<lower=0> N_t;
  vector[3] y[N_t];
  real ts[N_t];
  real mean_R;
  real mean_C_static;
  real mean_frc;

  real RR;
  real IE;
  real VT;
  real peep;
  real hold_time;
  real flow_rise_time;
}

transformed data {
  real breath_time = 60/RR;
  real insp_time = 1.0/(1.0 + IE) * breath_time;
  real const_flow = VT/(insp_time - flow_rise_time);
  // vector[3] y0 = [frc, peep, 0.0]'; // volume, pressure, flow
  real t0 = 0.0;
  // real R=5;
  // real frc = 2;
  // real C_static = 0.05;
}

parameters {
  real<lower=0> R;
  real<lower=0> C_static;
  real<lower=0> frc;

  // real<lower=0> sigma_v;
  // real<lower=0> sigma_p;
  // real<lower=0> sigma_f;
}

transformed parameters{
  vector[3] y0 = [frc, peep, 0.0]'; // volume, pressure, flow'
  vector[3] y_mu[N_t] = ode_rk45(ventilator, y0, t0, ts,
                   R, C_static, insp_time, const_flow,
                   flow_rise_time, breath_time, hold_time, peep, frc);
}
 
model {
  R ~ gamma(10*mean_R, 10);
  C_static ~ gamma(10*mean_C_static, 10);
  frc ~ gamma(10*mean_frc, 10);

  // sigma_v ~ inv_gamma(1, 0.005);
  // sigma_p ~ inv_gamma(1, 0.2);
  // sigma_f ~ inv_gamma(1, 0.05);

  // y[, 1] ~ normal(y_mu[,1], 0.005);
  // y[, 2] ~ normal(y_mu[, 2], 0.2);
  // y[,, 3] ~ normal(y_mu[,, 3], 0.05);

  // y[:, 1] ~ normal(y_mu[:, 1], 0.005);
  // y[:, 2] ~ normal(y_mu[:, 2], 0.2);
  // y[:, 3] ~ normal(y_mu[:, 3], 0.05);

  for (t in 1:N_t) {
    y[t, 1] ~ normal(y_mu[t, 1], 1);
    y[t, 2] ~ normal(y_mu[t, 2], 1);
    y[t, 3] ~ normal(y_mu[t, 3], 1);
  }
}