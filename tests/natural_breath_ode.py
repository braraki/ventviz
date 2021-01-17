from scipy.integrate import solve_ivp
from scipy.integrate import odeint
import numpy as np
import matplotlib.pyplot as plt
import pdb

def sinusoidal_breath(t, patient_breath_max_pmus, patient_breath_inspiratory_time):
    if t < patient_breath_inspiratory_time:
        dpmus = -patient_breath_max_pmus * \
            (np.pi/patient_breath_inspiratory_time) * np.cos(np.pi*t/patient_breath_inspiratory_time)
    else:
        dpmus = 0
    return dpmus

# volume flow control
# so y = [v, p] and
# params(t) = v'(t)
def natural_breathing(y, t, params):

    R = params[0]  # cmH2O / (L / s)
    C_static = params[1]/1000. # L/cmH2O
    frc = params[2]
    patient_breath_time = params[3]
    patient_breath_max_pmus = params[4]
    patient_breath_inspiratory_time = params[5]

    volume = float(y[0]) - frc
    flow = float(y[1])
    paw = float(y[2])
    palv = float(y[3])
    pmus = float(y[4])

    patient_breath_t = t % patient_breath_time

    dpmus = sinusoidal_breath(patient_breath_t, patient_breath_max_pmus, patient_breath_inspiratory_time)

    dpalv = dpmus - palv/(R*C_static)

    dflow = -dpalv/R

    dvolume = flow

    dpaw = 0

    return [dvolume, dflow, dpaw, dpalv, dpmus]

# Times for observation
R = 2 # 5.
C_static = 140 # 50.
frc = 2.0 # functional residual capacity in [L]
patient_breath_frequency = 10.
patient_breath_time = 60./patient_breath_frequency
patient_breath_max_pmus = 7 # 20.
patient_breath_inspiratory_time = 1 # 3.
run_time = 10.
times = np.arange(0,run_time,0.001)
v0 = frc; f0 = 0.; paw0 = 0; palv0 = 0; pmus0 = 0.
output = odeint(natural_breathing, t=times, y0=[v0, f0, paw0, palv0, pmus0],
    args=([R, C_static, frc, patient_breath_time, patient_breath_max_pmus, patient_breath_inspiratory_time],))

v = output[:, 0]
flow = output[:, 1]
paw = output[:, 2]
palv = output[:, 3]
pmus = output[:, 4]

sigma = 0.02
vobs = np.random.normal(v,sigma)

# pdb.set_trace()

fig, ax = plt.subplots(3, 1, dpi=120)

begin_patient_breath = [patient_breath_time*i for i in range(int(run_time/patient_breath_time)+1)]
end_patient_breath = [patient_breath_time*i + patient_breath_inspiratory_time for i in range(int(run_time/patient_breath_time)+1)]

# ax[0].plot(times, vobs, label='observed volume [mL]', linestyle='dashed', marker='o', color='red')
ax[0].plot(times, v, label='True volume [L]', color='k', alpha=0.5)
ax[0].set_xlabel('Time [s]')
ax[0].set_ylabel('Volume [L]')

ax[1].plot(times, flow)
ax[1].set_ylabel('Flow [mL/s]')
ax[1].set_xlabel('Time [s]')


ax[2].plot(times, paw, label="$P_{aw}$")
ax[2].plot(times, palv, label="$P_{alv}$")
ax[2].plot(times, pmus, label="$P_{mus}$")
ax[2].legend()
ax[2].set_ylabel('Pressure [cmH2O]')
ax[2].set_xlabel('Time [s]')


for patient_breath_start, patient_breath_end in zip(begin_patient_breath, end_patient_breath):
    for axis in ax:
        axis.axvspan(patient_breath_start, patient_breath_end, alpha=0.2, color='red')
        # axis.axvline(patient_breath_start)
        # axis.axvline(patient_breath_end)

plt.show()