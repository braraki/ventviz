import './simulator.css';
import React from 'react';
import {Chart} from '../chart';
import {Forms} from '../forms';
import {solveODE} from '../../util'
import * as d3 from 'd3'

class Simulator extends React.Component {
  constructor(props) {
    super(props);

    var startVars = {"time": 0, "volume": this.props.odeParams["frc"], "flow": 0, "paw": 0, "palv": 0, "pmus": 0};
    var soln = solveODE(this.props.chartParams["timeDomain"], this.props.odeParams, startVars)

    this.state = {'odeParams': this.props.odeParams,
                  'chartParams': this.props.chartParams,
                  'soln': soln,
                  'transition': null};

    this.chartElements = this.props.charts.map(() => null);
    
  }

  // https://d3-wiki.readthedocs.io/zh_CN/master/Transitions/#each
  // can i do this without refs, possibly by modifying a prop?
  // perhaps pass in a function that stores the shared transition element t
  // and play when it changes
  play() {
    // should i set this as a prop?
    var t = d3.transition()
      .duration(this.props.chartParams.timeDomain*1000)
      .on("end", function() {
        this.resolve();
      }.bind(this))

    // calling transition on the charts' elements while supplying t
    // makes them inherit the properties of t, so everything is synced
    // if there's any delay, the subelements will snap to the state of
    // the parent transition when rendered
    this.chartElements.forEach(
      d => d.play(t)
    )
  }

  // todo: handle pausing
  // the time rounds - check whether this causes errors
  resolve() {
    console.log("solving for further timesteps");
    var lastIdx = this.state.soln.time.length - 1 ;
    var lastVars = {"time": 0, "volume": this.state.soln.volume[lastIdx], "flow": this.state.soln.flow[lastIdx], 
      "paw": this.state.soln.paw[lastIdx], "palv": this.state.soln.palv[lastIdx], "pmus": this.state.soln.pmus[lastIdx]}
    var nextSoln = solveODE(this.props.chartParams["timeDomain"], this.props.odeParams, lastVars)
    
    // needs fixing: the next solution isn't being solved for correctly
    this.setState({"soln": nextSoln});
    this.play();
  }

  pause() {
  }

  render() {
    return (
      <div className="simulator-app">
        {
          this.props.charts.map((chart, i) => 
            <Chart ref={el => this.chartElements[i] = el} key={"chart-" + i} idx={i} soln={this.state.soln} data={this.state.data} chartParams={this.state.chartParams} svgDims={this.props.svgDims} chartInfo={chart} playTime={this.props.playTime} transition={this.state.transition}/>
          )
        }
        <Forms onClick={() => this.play()}/>
      </div>
    );
  }

}

export default Simulator;
