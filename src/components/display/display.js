import React from 'react';
import './display.css';
import {Container, Card} from 'react-bootstrap'

// change to function component
class Display extends React.Component {
  constructor(props) {
    super(props);
    // don't hardcode these
    this.vars = ["time", "volume", "flow", "paw", "palv", "pmus"];
    this.labels = ["Time (s)", "Volume (L)", "Flow (L/s)", "Paw (cmH20)", "Palv (cmH20)", "Pmus (cmH20)"]
  }

  render () {
    var idx = this.props.soln === null ? 0 : Math.floor((this.props.soln.time.length-1) * this.props.currTime);

    return (
    <Container className="h-100 p-0">
      {
        this.vars.map(function(v, i) {
          var value = "—"
          if (this.props.soln !== null) {
            value = this.props.soln[v][idx].toFixed(2);
          } 
          return <Card key={'card-' + v} style={{'height': '16.6%', 'fontSize': '1.5em', 'justifyContent': 'center'}} className="align-items-center">
            <Card.Text className="mb-0">{value}</Card.Text>
            <Card.Text style={{'fontSize': '0.35em'}}>{this.labels[i]}</Card.Text>
            </Card>;
        }.bind(this))
      }
    </Container>
    )}
}

export default Display;