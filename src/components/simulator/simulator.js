import './simulator.css';
import React from 'react';
import {Chart} from '../chart';
import {Forms} from '../forms';
import {Display} from '../display';
import {solveODE} from '../../util'
import {Container, Row, Col, Navbar, Card} from 'react-bootstrap';
import {ReactComponent as LungLogo} from '../../lungs.svg';
import * as d3 from 'd3'

class Simulator extends React.Component {
  constructor(props) {
    super(props);

    // rename time so it's clear it refers to transition percentage
    // clean up general state logic
    this.state = {'odeParams': this.props.defaultODEParams,
                  'chartParams': this.props.chartParams,
                  'soln': null,
                  'animationState': 'standby',
                  'action': null,
                  'transition': null,
                  'loop': -1,
                  'pauseTime': 0,
                  'currTime': 0};
  }

  // todo: refactor
  play() {
    
    if (this.state.action !== 'pause') {
      var t = d3.transition("play")
        .duration(this.props.chartParams.timeDomain*1000)
        .ease(d3.easeLinear)
        .tween("track", function() {
          return function(t) {
            this.currTime = t;
            this.setState({currTime: t, action: null});
          }.bind(this);
        }.bind(this));
      t.on("start", function() {
        var initValues;
        
        if (this.state.soln === null) {
          var peep = this.state.odeParams.ventilated ? this.state.odeParams["peep"] : 0;
          initValues = {"time": 0, "volume": this.props.defaultODEParams["frc"],
          "flow": 0, "paw": peep, //this.props.odeParams["peep"],
          "palv": peep, "pmus": 0}
        } else {
          var lastIdx = this.state.soln.time.length - 1 ;
          
          initValues = {"time": this.state.soln.time[lastIdx], "volume": this.state.soln.volume[lastIdx],
            "flow": this.state.soln.flow[lastIdx], 
            "paw": this.state.soln.paw[lastIdx], "palv": this.state.soln.palv[lastIdx],
            "pmus": this.state.soln.pmus[lastIdx]}
        }

        var loopNum = this.state.loop + 1;
        var endTime = this.props.chartParams["timeDomain"]* (loopNum + 1);
      
        var soln = solveODE(initValues["time"], endTime,
          this.state.odeParams, initValues);

        var filteredSoln = this.filterPoints(soln);

        this.setState({"soln": filteredSoln,
                      "action": 'play',
                      animationState: 'playing',
                      "transition": t,
                      "loop": loopNum,
                      'pauseTime': 0})

        }.bind(this))
        .on("interrupt", function() {
          this.setState({
            pauseTime: this.state.currTime,
            animationState: 'paused',
            action: 'pause'
         });
        }.bind(this))
        .on("end", function() {
          this.play();
        }.bind(this))
    } else {
      var tResume = d3.transition("play")
        .duration(this.props.chartParams.timeDomain*1000*(1-this.state.pauseTime))
        .ease(d3.easeLinear)
        .tween("track", function() {
          return function(t) {
            this.setState({currTime: this.state.pauseTime + t*(1-this.state.pauseTime),
              action: null
                           });
          }.bind(this);
        }.bind(this))
        .on("start", function() {
          this.setState({action: 'play',
                        animationState: 'playing',
                        transition: tResume});
        }.bind(this))
        .on('interrupt', function() {
          this.setState({action: 'pause',
                         animationState: 'paused',
                         pauseTime: this.state.currTime});
        }.bind(this))
        .on("end", function() {
          this.play();
        }.bind(this))
    }
    
  }


  pause() {
    if (this.state.transition) {
      this.state.transition.selection().interrupt("play").selectAll("*").interrupt("play");
    }
  }

  reset() {
    if (this.state.transition) {
      this.state.transition.selection().interrupt("play").selectAll("*").interrupt("play");
    }

    this.setState({
      action: 'reset',
      animationState: 'standby',
      loop: -1,
      transition: null,
      soln: null,
      pauseTime: 0
    });
  }

  filterPoints(soln) {
    console.log(soln);
    Object.keys(soln).forEach(function(key) {
      soln[key] = soln[key].filter((_, i) => i % this.props.chartParams.downSample == 0)
    }.bind(this));
    console.log(soln);
    return soln;
  }

  // for now, changing params means reset
  handleParamChange(name, value) {
    if (this.state.transition) {
      this.state.transition.selection().interrupt("play").selectAll("*").interrupt("play");
    }
    this.setState({
      odeParams: {...this.state.odeParams, [name]: +value},
      action: 'reset',
      animationState: 'standby',
      loop: -1,
      transition: null,
      soln: null,
      pauseTime: 0
    });
  }

  // todo: clean up props logic
  render() {
    return (
      <Container>
        <Navbar bg="dark" variant="dark" className="mb-1 pt-0 pb-0">
          <Navbar.Brand>
            <LungLogo fill="white" style={{height: "10%", width: "10%"}} className="mb-1 mr-2"></LungLogo>
            Ventilator Simulator
          </Navbar.Brand>
        </Navbar>
        <Row>
          {
            <Col xs={2} className="pr-1">
              <Display soln={this.state.soln} currTime={this.state.currTime}></Display>
            </Col> 
          }
          <Col xs={6} className="">
            <Card className="h-100"><Card.Body className="pt-1 pb-1">
              { 
                this.props.charts.map((chart, i) => 
                <Row key={"chart-" + i + "-row"}>
                  <Chart chartLabel={this.props.charts[i].chartLabel} unit={this.props.charts[i].unit} loop={this.state.loop} pauseTime={this.state.pauseTime} action={this.state.action} key={"chart-" + i} idx={i} soln={this.state.soln} data={this.state.data} chartParams={this.state.chartParams} svgDims={this.props.svgDims} chartInfo={chart} playTime={this.props.playTime} transition={this.state.transition}/>
                </Row>
                )
              }            
            </Card.Body></Card>
          </Col>
          <Col xs={4} className="pl-1">
            <Forms defaultODEParams={this.props.defaultODEParams} ventilated={this.state.odeParams.ventilated} animationState={this.state.animationState} onParamChange={this.handleParamChange.bind(this)} onReset={this.reset.bind(this)} onPlay={this.play.bind(this)} onPause={this.pause.bind(this)}/>
          </Col>
        </Row>
        <Navbar bg="dark" variant="dark" style={{height: '2em'}} className="mt-2 pt-0 pb-0">
          <Navbar.Brand style={{'fontSize': '0.75em'}}>
           © Andrew Zhou & Brandon Araki 2021
          </Navbar.Brand>
        </Navbar>
      </Container>
    );
  }

}

export default Simulator;
