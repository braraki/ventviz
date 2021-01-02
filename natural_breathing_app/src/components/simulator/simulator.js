import './simulator.css';
import React from 'react';
import {Chart} from '../chart';
import {Forms} from '../forms';
import {solveODE} from '../../util'
import * as d3 from 'd3'

// put data methods in util
function getVarsDict(varsArr=null) {
  var vars = varsArr ? varsArr : [0, 0, 0, 0, 0, 0];

  return {"time": vars[0], "volume": vars[1], "flow": vars[2], "paw": vars[3], "palv": vars[4], "pmus": vars[5]}
}

class Simulator extends React.Component {
  constructor(props) {
    super(props);


    var startVars = {"time": 0, "volume": this.props.odeParams["frc"], "flow": 0, "paw": 0, "palv": 0, "pmus": 0};
    var soln = solveODE(this.props.chartParams["timeDomain"], this.props.odeParams, startVars)

    this.state = {'odeParams': this.props.odeParams,
                  'chartParams': this.props.chartParams,
                  'soln': soln};

    this.chartElements = this.props.charts.map(() => null);
    
  }

  // https://d3-wiki.readthedocs.io/zh_CN/master/Transitions/#each
  // can i do this without refs, possibly by modifying a prop?
  // perhaps pass in a function that stores the shared transition element t
  // and play when it changes
  play() {
    console.log(this.chartElements);
    
    var t = d3.transition()
      .duration(this.props.chartParams.timeDomain*1000)
      .on("end", this.resolve);

    // calling transition on the charts' elements while supplying t
    // makes them inherit the properties of t, so everything is synced
    // if there's any delay, the subelements will snap to the state of
    // the parent transition when rendered
    this.chartElements.forEach(
      d => d.play(t)
    )
  }

  // todo: handle pausing
  resolve() {
    console.log("solve for further timesteps");
  }

  pause() {
  }

  render() {
    return (
      <div className="simulator-app">
        {
          this.props.charts.map((chart, i) => 
            <Chart ref={el => this.chartElements[i] = el} key={"chart-" + i} idx={i} soln={this.state.soln} data={this.state.data} chartParams={this.state.chartParams} svgDims={this.props.svgDims} chartInfo={chart} playTime={this.props.playTime}/>
          )
        }
        <Forms onClick={() => this.play()}/>
      </div>
    );
  }

}

export default Simulator;
