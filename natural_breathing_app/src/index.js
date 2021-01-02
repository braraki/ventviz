import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {Simulator} from './components';
//import reportWebVitals from './reportWebVitals';

var defaultODEParams = {
  "R": 2,
  "C": 140,
  "frc": 2,
  "pbf": 10,
  "pbmp": 7,
  "pbit": 1,
  "step": 0.1
}

var margin = {top: 10, right: 60, bottom: 60, left: 60};
var width = 500 - margin.left - margin.right;
var height = 300 - margin.top - margin.bottom;

var svgDims = {margin: margin, width: width, height: height};


var defaultChartParams = {
  "timeDomain": 10
}


var charts = [{id: "volumeChart", variables: [{"name": "volume", "color": "red", "label": "Volume (L)"}]},
  {id: "flowChart", variables: [{name: "flow", "color": "red", "label": "Flow (L/s)"}]},
  {id: "pressureChart", variables: [{"name": "paw", "color": "red", "label": "Paw"}, {"name": "palv", "color": "blue", "label": "Palv"}, {"name": "pmus", "color": "pink", "label": "pmus"}]}]

ReactDOM.render(
  <React.StrictMode>
    <Simulator odeParams={defaultODEParams} chartParams={defaultChartParams} svgDims={svgDims} charts={charts}/>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
