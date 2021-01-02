import React from 'react';
import * as d3 from 'd3';
import './chart.css';

// https://www.freecodecamp.org/news/how-to-get-started-with-d3-and-react-c7da74a5bd9f/
// https://medium.com/@numberpicture/react-d3-comparing-alternative-approaches-1a63ced48d66
// alternate way: https://medium.com/@jeffbutsch/using-d3-in-react-with-hooks-4a6c61f1d102
// https://observablehq.com/@d3/multi-line-chart
// https://reactjs.org/docs/state-and-lifecycle.html
// https://reactjs.org/docs/handling-events.html
// https://observablehq.com/@d3/multi-line-chart

// update state when props change or recalc from props every time?
class Chart extends React.Component {
  constructor(props) {
    super(props);
    
    // these shouldn't change
    this.margin = this.props.svgDims.margin;
    this.width = this.props.svgDims.width;
    this.height = this.props.svgDims.height;
    this.yVars = this.props.chartInfo.variables

    this.state = {"data": this.formatData()}
  }

  // should i save
  componentDidMount() {
    this.svg = d3.select(this.container)
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g") 
      .attr("transform",
            "translate(" + this.margin.left + "," + this.margin.top + ")")
    
    this.setAxes();
    this.renderChart();

  }

  formatData() {
    return this.yVars.map(yVar => 
      ({"name": yVar.name, "x": this.props.soln.time, "y": this.props.soln[yVar.name], 
      "color": yVar.color, "label": yVar.label}));
  }

  setAxes() {
    this.x = d3.scaleLinear()
      .domain([0, this.props.chartParams.timeDomain])
      .range([0, this.width]);

    var yArrays = this.yVars.map(yVar =>
      this.props.soln[yVar.name]);

    this.y = d3.scaleLinear()
      .domain(d3.extent(d3.merge(yArrays)))
      .range([this.height, 0]);

    this.svg.append("g")
      .attr("transform", "translate(0," + this.height + ")")
      .classed("x-axis", true)
      .call(d3.axisBottom(this.x));

    this.svg.append("g")
      .call(d3.axisLeft(this.y));
  }
  
  componentDidUpdate() {
    console.log("updated", this.props.chartInfo.id, this.state);
  }

  renderChart() {
    console.log("rendering chart");
    
    this.svg.append("g")
      .selectAll("path")
      .data(this.state.data)
      .enter()
      .append("path")
        .attr("fill", "none")
        .attr("stroke", d => d.color)
        .attr("d", d => d3.line()
          .x(d => this.x(d[0]))
          .y(d => this.y(d[1]))
          .curve(d3.curveMonotoneX)
          (d3.zip(d.x, d.y)))
  }

  render() {
    return (
      <div id={this.props.chartInfo.id} ref={c => this.container = c} />
    );
  }
}
export default Chart;
