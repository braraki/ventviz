import os
from cmdstanpy import CmdStanModel, cmdstan_path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
# import pdb

ventilator_dir = os.path.join(os.getcwd(), 'models')
data_dir = os.path.join(os.getcwd(), 'data')
data_path = os.path.join(data_dir, 'simulated.csv')

def simulate_data():

    ventilator_path = os.path.join(ventilator_dir, 'ventilator.stan')

    # instantiate, compile bernoulli model
    ventilator_model = CmdStanModel(stan_file=ventilator_path)

    nt = 10
    times = np.linspace(0.0001, 1, nt)

    # nt = 4
    # times = [1.1, 1.2, 1.3, 1.4]

    data = {'N_t': nt,
            'ts': times}
    ventilator_sample = ventilator_model.sample(data=data, fixed_param=True)

    # new_quantities = ventilator_model.generate_quantities(data=data, mcmc_sample=ventilator_model)

    results = ventilator_sample.sample[0, 0]
    start_index = 5
    volume = results[start_index:nt+start_index]
    pressure = results[nt+start_index:2*nt+start_index]
    flow = results[2*nt+start_index:]

    fig, [ax1, ax2, ax3] = plt.subplots(3, 1)
    ax1.plot(times, volume)
    ax2.plot(times, pressure)
    ax3.plot(times, flow)

    data = []
    for (t, v, p, f) in zip(times, volume, pressure, flow):
        data.append([t, v, p, f])
    data = np.array(data)

    df = pd.DataFrame(data=data, columns=["Time", "Volume", "Pressure", "Flow"])
    df.to_csv(data_path)

    plt.show()
    # pdb.set_trace()

def load_data():
    df = pd.read_csv(data_path, index_col=0)

    times = df['Time'].to_numpy()
    nt = times.size

    y = df[['Volume', 'Pressure', 'Flow']].to_numpy()   

    data = {'N_t': nt, 'ts': times, 'y': y}

    return data

def infer_model():
    ventilator_path = os.path.join(ventilator_dir, 'ventilator_model.stan')
    # instantiate, compile bernoulli model
    ventilator_model = CmdStanModel(stan_file=ventilator_path)

    data = load_data()

    data['mean_R'] = 5.
    data['mean_C_static'] = 0.050
    data['mean_frc'] = 2.0

    data['RR'] = 20
    data['IE'] = 3
    data['VT'] = 0.500
    data['peep'] = 5
    data['hold_time'] = 0.4
    data['flow_rise_time'] = 0.05

    ventilator_fit = ventilator_model.sample(data=data,
        show_progress=True, iter_warmup=1000,
        iter_sampling=1000, cores=4, chains=4,
        max_treedepth=5, output_dir=data_dir,
        save_diagnostics=True)

    # pdb.set_trace()

    print(ventilator_fit.summary())

    # pdb.set_trace()

    print('f f f f f')

if __name__ == "__main__":
    # simulate_data()

    infer_model()