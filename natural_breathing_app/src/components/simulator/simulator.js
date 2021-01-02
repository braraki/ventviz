import './simulator.css';
import React from 'react';
import {Chart} from '../chart';
import {Forms} from '../forms';
import {solveODE} from '../../util'
import * as d3 from 'd3'

// put data methods in util
function getVarsDict(varsArr=null) {
  var vars = varsArr ? varsArr : [0, 0, 0, 0, 0, 0];

  // better way to construct this? map variables to indices?  
  return {"time": vars[0], "volume": vars[1], "flow": vars[2], "paw": vars[3], "palv": vars[4], "pmus": vars[5]}
}

class Simulator extends React.Component {
  constructor(props) {
    super(props);


    var startVars = getVarsDict([0, this.props.odeParams["frc"], 0, 0, 0, 0]);
    var soln = solveODE(this.props.chartParams["timeDomain"], this.props.odeParams, startVars)
    var solnZip = d3.zip(soln.time, soln.volume, soln.flow, soln.paw, soln.palv, soln.pmus);

    var data = solnZip.map(getVarsDict);

    // consider whether soln & data both need to be passed - currently do so
    // for convenience
    this.state = {'odeParams': this.props.odeParams,
                  'chartParams': this.props.chartParams,
                  'soln': soln,
                  'data': data,
                  'playing': false};
    this.test = React.createRef();
    
  }

  play() {
    if (!this.state["playing"]) {
      this.setState({
        playing: true
      });
    }
  }

  pause() {
  }

  render() {
    return (
      <div className="simulator-app">
        {
          this.props.charts.map(chartInfo => 
            <Chart key={chartInfo["id"]} soln={this.state.soln} data={this.state.data} chartParams={this.state.chartParams} svgDims={this.props.svgDims} chartInfo={chartInfo} playing={this.state.playing}/>
          )
        }
        <Forms onClick={() => this.play()}/>
      </div>
    );
  }

}

export default Simulator;
