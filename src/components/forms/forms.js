import React from 'react';
import './forms.css';
import {Button, Form, Row, Col, Card, Container, InputGroup} from 'react-bootstrap'
import * as d3 from 'd3';

// change to function component, maybe
class Forms extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      'paramSelected': false,
      'selectedParam': null
    }

    // todo: don't hardcode these
    this.patientParams = ["R", "C", "pbf", "pbmp", "pbit"]
    this.ventParams = ["RR", "IE", "VT", "peep", "frt"]
    this.paramRanges = {
      "R": [1, 200, 1],
      "C": [5, 150, 1],
      "peep": [0, 25, 1],
      "VT": [100, 1000, 50],
      "RR": [5, 25, 1],
      "pbmp": [0, 12, 1],
      "pbf": [0, 40, 1],
      "pbit": [0.2, 6, 0.1],
      "IE": [0.25, 6, 0.25],
      "frt": [0.1, 0.1, 0]
    };

    this.paramInfo = {
      'R': "R: Airway resistance, 1-200 cmH2O*s/L^3",
      'C': "C: Lung compliance, 5-150 mL/cmH2O",
      'pbf': "pbf: Patient breath frequency, 0-40 Hz",
      'pbmp': "pbmp: Patient breath maximum pressure, 0-12 cmH2O",
      'pbit': "pbit: Patient breath inhalation time, 0.2-6 s",
      'peep': 'peep: Positive end-expiratory pressure, 0-25 cmH2O', 
      'VT': 'VT: Tidal volume, 100-1000 mL', 
      'RR': 'RR: Respiratory rate, 5-25 Hz',
      'IE': "IE: Inspiration-exhalation ratio, fix I at 1 and set E from 0.25-6.",
      'frt': 'frt: Flow rise time [s] (not configurable yet)'
    }
  }

  componentDidMount() {
    // manual input update logic since the default behavior is insufficient
    this.patientParams.forEach(function(param) {
      var minVal = this.paramRanges[param][0];
      var maxVal = this.paramRanges[param][1];
      var step = this.paramRanges[param][2];
      var onParamChange = this.props.onParamChange;
      d3.select("#form-" + param)
        .attr("value", this.props.defaultODEParams[param])
        .on("change", function() {
          if (this.value > maxVal) {
            this.value = maxVal;
          } else if (this.value < minVal) {
            this.value = minVal;
          } else {
            this.value = Math.round(this.value/step) * step;
          }
          onParamChange(this.name, this.value);
        });
      }.bind(this));

      this.ventParams.forEach(function(param) {
        var minVal = this.paramRanges[param][0];
        var maxVal = this.paramRanges[param][1];
        var step = this.paramRanges[param][2];
        var onParamChange = this.props.onParamChange;
        d3.select("#form-" + param)
          .attr("value", this.props.defaultODEParams[param])
          .on("change", function() {
            if (this.value > maxVal) {
              this.value = maxVal;
            } else if (this.value < minVal) {
              this.value = minVal;
            } else {
              this.value = Math.round(this.value/step) * step;
            }
            // console.log("d3 change");
            onParamChange(this.name, this.value);
          });
      }.bind(this));
  }

  // handles just checkbox for now
  handleChange(event) {
    // console.log("regular change");
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    this.props.onParamChange(name, value)
  }

  handleStart() {
    // console.log("starting");
    this.props.onPlay();
  }

  handlePause() {
    // console.log("pausing");
    this.props.onPause();
  }

  handleReset() {
    this.props.onReset();
  }

  selectInput(event) {
    // clean up param selection - perhaps change the prepend to a button
    this.setState({
      paramSelected: true,
      selectedParam: event.target.firstChild.nodeValue
    })
  }

  render () { 
    // console.log("rendering forms");
    // console.log(this.props);
    
    // todo: thorough cleanup of css (margins/padding in particular)
    return (
      <Container className="mr-0 pr-0">
        <Card className="h-25 mb-2">
          <Card.Header className="pl-2 pt-1 pb-1">
            Patient
          </Card.Header>
          <Card.Body as={Row} className="pb-0 pt-2">
            {
              this.patientParams.map((param) =>
                <Form.Group key={"form-" + param} controlId={"form-" + param} as={Col} sm={6} className="mb-0 pr-0">
                  <Row className="mb-2 mr-1 p-0">
                  <Form.Label className="sr-only">{param}</Form.Label>
                  <InputGroup.Prepend onClick={this.selectInput.bind(this)} as={Col} sm={5} className="p-0">
                    <InputGroup.Text style={{'justifyContent': 'center', 'fontSize': '0.75em'}} className={"w-100 p-0"}>{param}</InputGroup.Text>
                  </InputGroup.Prepend>
                  <Col sm={7} className="p-0">
                  <Form.Control style={{'textAlign': 'left', 'fontSize': '0.75em'}} 
                    className={"ml-0 pl-2"} sm={7} min={this.paramRanges[param][0]} 
                    max={this.paramRanges[param][1]} step={this.paramRanges[param][2]} 
                    type="number" name={param}></Form.Control>
                  </Col>
                  </Row>
                </Form.Group>
              )
            }
            </Card.Body>
        </Card>
        <Card className="mb-2">
          <Card.Header className="pt-1 pb-0">
            <Row>
            <Col sm={6} className="m-0 p-0">Ventilator</Col>
            
          <Form.Group as={Col} sm={6} className="mb-1" controlId="ventilated">
            <Form.Check className="ml-2" name="ventilated" type="checkbox" defaultChecked={this.props.defaultODEParams.ventilated} onChange={this.handleChange.bind(this)} inline={true} label="On" />
          </Form.Group>
          </Row>
          </Card.Header>
          <Card.Body as={Row} className="pb-0 pt-2">
            
          {
              this.ventParams.map(function(param) {
                // silly hack
                if (param == "IE") {
                  return <Form.Group key={"form-" + param} controlId={"form-" + param} as={Col} sm={6} className="mb-0 pr-0">
                  <Row className="mb-2 mr-1 p-0">
                  <Form.Label className="sr-only">{param}</Form.Label>
                  
                  <InputGroup.Prepend onClick={this.selectInput.bind(this)} as={Col} sm={3} className="p-0">
                    <InputGroup.Text style={{'justifyContent': 'center', 'fontSize': '0.75em'}} className={"w-100 p-0"}>{param}</InputGroup.Text>
                  </InputGroup.Prepend>
                  <InputGroup.Prepend as={Col} sm={2} className="p-0" >
                    <InputGroup.Text style={{'justifyContent': 'center', 'fontSize': '0.75em', 'backgroundColor': 'white'}} className={"w-100 p-0"}>{"1:"}</InputGroup.Text>
                  </InputGroup.Prepend>
                  <Col sm={7} className="p-0">
                  <Form.Control style={{'textAlign': 'left', 'fontSize': '0.75em'}} 
                    disabled={!this.props.ventilated || param=='frt'} min={this.paramRanges[param][0]} 
                    max={this.paramRanges[param][1]} step={this.paramRanges[param][2]} className={"ml-0 pl-2"} 
                    sm={7} type="number" name={param}></Form.Control>
                  </Col>
          
                  </Row>
            
                </Form.Group>
                }
                return <Form.Group key={"form-" + param} controlId={"form-" + param} as={Col} sm={6} className="mb-0 pr-0">
                  <Row className="mb-2 mr-1 p-0">
                  <Form.Label className="sr-only">{param}</Form.Label>
                  
                  <InputGroup.Prepend onClick={this.selectInput.bind(this)} as={Col} sm={5} className="p-0">
                    <InputGroup.Text style={{'justifyContent': 'center', 'fontSize': '0.75em'}} className={"w-100 p-0"}>{param}</InputGroup.Text>
                  </InputGroup.Prepend>
                  <Col sm={7} className="p-0">
                  <Form.Control style={{'textAlign': 'left', 'fontSize': '0.75em'}} 
                    disabled={!this.props.ventilated || param=='frt'} min={this.paramRanges[param][0]} 
                    max={this.paramRanges[param][1]} step={this.paramRanges[param][2]} className={"ml-0 pl-2"} 
                    sm={7} type="number" name={param}></Form.Control>
                  </Col>
          
                  </Row>
            
                </Form.Group>}.bind(this)
              )
            }
          </Card.Body>
          </Card>
          
          <Form.Group as={Row}  className="justify-content-center mt-3">
            <Col sm={{span: 5}}>
              <Button style={{"width": "100%"}} onClick={this.props.animationState !== 'playing' 
                ? this.handleStart.bind(this) : this.handlePause.bind(this)} block>{this.props.animationState !== 'playing' ? 'Start' : 'Pause'}</Button>
            </Col>
            <Col sm={{span: 5}} >
              <Button style={{"width": "100%"}} onClick={this.handleReset.bind(this)}>Reset</Button>
            </Col>
          </Form.Group>
          <Card className="h-100">
            <Card.Header className="pl-2 pt-1 pb-1">
              Parameter Info & Ranges{/*this.state.paramSelected ? ': ' + this.state.selectedParam : ''*/}
            </Card.Header>
            <Card.Body className="" style={{'fontSize': '0.75em', 'height': '100%'}}>
              {
                this.state.paramSelected ? this.paramInfo[this.state.selectedParam] : "Click a parameter's name to display details."
              }
            </Card.Body>
          </Card>            
          
      </Container>
  )}
}

export default Forms;