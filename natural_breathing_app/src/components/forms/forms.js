import React from 'react';
import './forms.css';
import {Button, Form, Row, Col, Card, Container, InputGroup} from 'react-bootstrap'


// change to function component, maybe
class Forms extends React.Component {
  
  handleChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    //this.setState({name: value})
    this.props.onParamChange(name, value)
  }

  handleStart() {
    this.props.onPlay();
  }

  handlePause() {
    this.props.onPause();
  }

  handleReset() {
    this.props.onReset();
  }

  render () { 
    // todo: don't hardcode these
    var patientParams = ["R", "C", "pbf", "pbmp", "pbit"]
    var ventParams = ["RR", "IE", "VT", "peep", "frt"]
    
    // todo: thorough cleanup of css (margins/padding in particular)
    return (
      <Container>
        <Card className="h-25 mb-2">
          <Card.Header className="pl-2 pt-1 pb-1">
            Patient
          </Card.Header>
          <Card.Body as={Row} className="pb-0 pt-2">
            {
              patientParams.map((param) =>
                <Form.Group key={"form-" + param} as={Col} sm={6} className="mb-0 pr-0">
                  <Row className="mb-2 mr-1 p-0">
                  <Form.Label className="sr-only">{param}</Form.Label>
                  <InputGroup.Prepend as={Col} sm={5} className="p-0">
                    <InputGroup.Text style={{'justifyContent': 'center', 'fontSize': '0.75em'}} className={"w-100 p-0"}>{param}</InputGroup.Text>
                  </InputGroup.Prepend>
                  <Col sm={7} className="p-0">
                  <Form.Control style={{'textAlign': 'left', 'fontSize': '0.75em'}} className={"ml-0 pl-2"} sm={7} type="number" name={param} placeholder={+this.props.defaultODEParams[param]} onChange={this.handleChange.bind(this)}></Form.Control>
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
              ventParams.map((param) =>
                <Form.Group key={"form-" + param} as={Col} sm={6} className="mb-0 pr-0">
                  <Row className="mb-2 mr-1 p-0">
                  <Form.Label className="sr-only">{param}</Form.Label>
                  <InputGroup.Prepend as={Col} sm={5} className="p-0">
                    <InputGroup.Text style={{'justifyContent': 'center', 'fontSize': '0.75em'}} className={"w-100 p-0"}>{param}</InputGroup.Text>
                  </InputGroup.Prepend>
                  <Col sm={7} className="p-0">
                  <Form.Control style={{'textAlign': 'left', 'fontSize': '0.75em'}} disabled={!this.props.ventilated} className={"ml-0 pl-2"} sm={7} type="number" name={param} placeholder={+this.props.defaultODEParams[param]} onChange={this.handleChange.bind(this)}></Form.Control>
                  </Col>
                  </Row>
                </Form.Group>
              )
            }
          </Card.Body>
          </Card>
          
          <Form.Group as={Row}  className="justify-content-center mt-3">
            <Col sm={{span: 6}}>
              <Button style={{"width": "100%"}} onClick={this.handleStart.bind(this)} disabled={this.props.animationState === 'playing'} block>{this.props.animationState !== 'paused' ? 'Start' : 'Resume'}</Button>
            </Col>


          </Form.Group>
          <Form.Group as={Row} className="justify-content-center">
          <Col sm={{span: 6}}>
              <Button style={{"width": "100%"}} onClick={this.handlePause.bind(this)} disabled={this.props.animationState !== 'playing'} block>Pause</Button>
            </Col>
          </Form.Group>
          <Form.Group as={Row} className="justify-content-center">
          <Col sm={{span: 6}} >
              <Button style={{"width": "100%"}} onClick={this.handleReset.bind(this)}>Reset</Button>
            </Col>
          </Form.Group>            
          
      </Container>
  )}
}

export default Forms;