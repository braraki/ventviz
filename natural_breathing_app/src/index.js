import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {Simulator} from './components';


// old default params for natural breathing
// var defaultODEParams = {
//   "R": 2,
//   "C": 140,
//   "frc": 2,
//   "pbf": 10, // patient breath frequency
//   "pbmp": 7, // patient breath max pmus
//   "pbit": 1, // patient breath inspiration time
//   "step": 0.001,
//   "RR": 20,
//   "IE": 3,
//   "VT": 200,
//   "peep": 5,
//   "frt": 0.05,
//   "ventilated": false
// }

var defaultODEParams = {
  "R": 10,
  "C": 20,
  "frc": 2,
  "pbf": 16, // patient breath frequency
  "pbmp": 4, // patient breath max pmus
  "pbit": 1, // patient breath inspiration time
  "step": 0.0001,
  "RR": 20,
  "insp": 1,
  // "IE": 3,
  "VT": 200,
  "peep": 5,
  "frt": 0.1,
  "ventilated": true
}

// todo: clean up input parameters

var margin = {top: 25, right: 20, bottom: 25, left: 40};
var width = 400 - margin.left - margin.right;
var height = 200 - margin.top - margin.bottom;
var svgDims = {margin: margin, width: width, height: height};

var defaultChartParams = {
  "timeDomain": 10,
  "downSample": 100
}

var charts = [{id: "volumeChart", chartLabel: 'Volume', unit: 'L', variables: [{"name": "volume", "color": "red", "label": "Volume"}]},
  {id: "flowChart", chartLabel: 'Flow', unit: 'L/s', variables: [{name: "flow", "color": "red", "label": "Flow"}]},
  {id: "pressureChart", chartLabel: 'Pressure', unit: 'cmH2O', variables: [{"name": "paw", "color": "red", "label": "Paw"}, {"name": "palv", "color": "blue", "label": "Palv"}, {"name": "pmus", "color": "pink", "label": "Pmus"}]}]

ReactDOM.render(
  <React.StrictMode>
    <Simulator defaultODEParams={defaultODEParams} chartParams={defaultChartParams} svgDims={svgDims} charts={charts}/>
  </React.StrictMode>,
  document.getElementById('root')
);