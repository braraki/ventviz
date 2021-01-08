from scipy.integrate import solve_ivp
from scipy.integrate import odeint
import numpy as np
import matplotlib.pyplot as plt
import pdb

def sinusoidal_breath(t, patient_breath_max_pmus, patient_breath_inspiratory_time):
    if t < patient_breath_inspiratory_time:
        dpmus = patient_breath_max_pmus * (np.pi/patient_breath_inspiratory_time) * np.cos(np.pi*t/patient_breath_inspiratory_time)
    else:
        dpmus = 0
    return dpmus

# return flow in mL/s
# need to get 'volume' control working for this. right now the rise time
# is tuned for the trapezoidal flow, not for this exponential flow
def exponential_flow(t, flow, insp_time, const_flow, flow_rise_time):
    const = 0
    flow = 1000.0 * flow
    if t < flow_rise_time:
        dflow = 100.0*(const_flow - flow)
        # const = 1
    elif t >= (insp_time - flow_rise_time) and t < insp_time:
        dflow = 100.0 * (0 - flow)

    else:
        dflow = 0

    return dflow

# return flow in mL/s
# it has an issue that if the flow at the start of the command isn't 0,
# then it doesn't adjust for that, so the flow at the end of the command may not be 0
# usually, the flow is a little under 0 at the beginning of the command and is
# therefore a little under 0 at the end of the command
def trapezoidal_flow(t, flow, insp_time, const_flow, flow_rise_time):
    const = 0
    if t < flow_rise_time:
        const = 1
    elif t >= (insp_time - flow_rise_time) and t < insp_time:
        const = -1
    else:
        dflow = 0

    dflow = const*const_flow*np.ones_like(t, dtype=np.float32)/flow_rise_time # mL/s

    return dflow

# volume flow control
# so y = [v, p] and
# params(t) = v'(t)
def flow_control(y, t, params):

    flow_function = params[0]
    R = params[1]  # cmH2O / (L / s)
    C_dyn = params[2]/1000.
    C_static = params[3]/1000. # L/cmH2O
    insp_time = params[4] # s
    const_flow = params[5] # mL/s
    flow_rise_time = params[6]
    breath_time = params[7]
    peep = params[8]
    frc = params[9]
    patient_breath_time = params[10]
    patient_breath_max_pmus = params[11]
    patient_breath_inspiratory_time = params[12]

    volume = float(y[0]) - frc
    flow = float(y[1])
    paw = float(y[2])
    palv = float(y[3])
    pmus = float(y[4])

    # ot = t

    patient_breath_t = t % patient_breath_time

    # these derivatives are common to all vent circuits
    dpmus = sinusoidal_breath(patient_breath_t, patient_breath_max_pmus, patient_breath_inspiratory_time)

    t = t % breath_time

    # inpsiratory phase, when the ventilator is delivering
    # a set flow to the patient
    if t < insp_time:
        dV = flow
        dflow = flow_function(t, flow, insp_time, const_flow, flow_rise_time)/1000. # L / s
        dpalv = -dpmus + flow/C_static
        dpaw = dpalv + R*dflow
    # this here delivers approximately a step function to reset the flow
    # to be -volume/(R*C) for when expiration starts
    # Paw also needs to be set to PEEP during this time
    elif t >= insp_time and t < insp_time + 0.02:
        dV = 0
        dpaw = -(paw-peep)/0.005
        dpalv = 0
        dflow = ((- palv + peep)/R)/0.02 + pmus/R
    # expiratory phase, where the ventilator allows the
    # patient to PASSIVELY exhale (the ventilator does not
    # control exhalation in any way in this case, although
    # there are ventilator control modes that can force
    # active exhalation I think)
    else:
        dV = flow
        dflow = -flow/(R*C_static) + dpmus/R
        dpalv = - dflow*R
        dpaw = -(paw-peep)/0.1

    return [dV, dflow, dpaw, dpalv, dpmus]

# Times for observation
RR = 20.
IE = 3.
VT = 200.
peep = 5.
R = 10.
C_dyn = 49.
C_static = 20.
frc = 2.0 # functional residual capacity in [L]
breath_time = 60./RR
insp_time = 1./(1 + IE) * breath_time
flow_rise_time = 0.05 # seconds for the flow to do the step change
const_flow = VT/(insp_time-flow_rise_time) # from area of trap 
const_pressure = 25.
pressure_rise_time = 0.1
patient_breath_frequency = 16.
patient_breath_time = 60./patient_breath_frequency
patient_breath_max_pmus = 4.
patient_breath_inspiratory_time = 1.
run_time = 20.
times = np.arange(0,run_time,0.001)
v0 = frc
paw0 = peep
palv0 = peep
f0 = 0.
pmus0 = 0.
sigma = 0.02
output = odeint(flow_control, t=times, y0=[v0, f0, paw0, palv0, pmus0],
    args=([exponential_flow, R, C_dyn, C_static, insp_time,
        const_flow, flow_rise_time, 
        breath_time, peep, frc,
        patient_breath_time, patient_breath_max_pmus,
        patient_breath_inspiratory_time],))
# pdb.set_trace()
v = output[:, 0]
all_flow = output[:, 1]
paw = output[:, 2]
palv = output[:, 3]
pmus = output[:, 4]
# airway pressure
# paw = v/C + R*flow(times)
vobs = np.random.normal(v,sigma)

# pdb.set_trace()

fig, ax = plt.subplots(5, 1, dpi=120)

begin_patient_breath = [patient_breath_time*i for i in range(int(run_time/patient_breath_time)+1)]
end_patient_breath = [patient_breath_time*i + patient_breath_inspiratory_time for i in range(int(run_time/patient_breath_time)+1)]

# ax[0].plot(times, vobs, label='observed volume [mL]', linestyle='dashed', marker='o', color='red')
ax[0].plot(times, v, label='True volume [L]', color='k', alpha=0.5)
ax[0].set_xlabel('Time [s]')
ax[0].set_ylabel('Volume [L]')

ax[1].plot(times, all_flow)
ax[1].set_ylabel('Flow [mL/s]')
ax[1].set_xlabel('Time [s]')


ax[2].plot(times, paw)
ax[2].set_ylabel('Paw')
ax[2].set_xlabel('Time [s]')

ax[3].plot(times, palv)
ax[3].set_ylabel('Palv')
ax[3].set_xlabel('Time [s]')

ax[4].plot(times, pmus)
ax[4].set_ylabel('Pmus')
ax[4].set_xlabel('Time [s]')

for patient_breath_start, patient_breath_end in zip(begin_patient_breath, end_patient_breath):
    for axis in ax:
        axis.axvspan(patient_breath_start, patient_breath_end, alpha=0.5, color='red')
        # axis.axvline(patient_breath_start)
        # axis.axvline(patient_breath_end)

plt.show()