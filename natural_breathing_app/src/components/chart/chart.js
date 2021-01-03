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
// 

class Chart extends React.Component {
  constructor(props) {
    super(props);
    
    // these shouldn't change
    this.margin = this.props.svgDims.margin;
    this.width = this.props.svgDims.width;
    this.height = this.props.svgDims.height;
    this.yVars = this.props.chartInfo.variables

    //this.state = {"data": this.formatData(),
     //             "prevData": null}
  }

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

      // extra zero line for the flow chart
    if (this.props.chartInfo.id === "flowChart") {
      this.svg.append("line")
        .attr("x1", 0)  
        .attr("y1", this.y(0))
        .attr("x2", this.width)
        .attr("y2", this.y(0))
        .style("stroke-dasharray", "3,3")
        .style("stroke", "black")
        .style("fill", "none")
        .style("opacity", 0.2);
    }
  }
  
  // https://reactjs.org/docs/react-component.html#the-component-lifecycle
  // https://reactjs.org/docs/react-component.html#static-getderivedstatefromprops
  // https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html#what-about-memoization
  // todo: update logic
  componentDidUpdate() {
    this.updateChart();
    
  }

  renderChart() {
    console.log("rendering chart");
    var data = this.formatData();

    this.clip = this.svg.append("clipPath")
      .attr("id", "clip-" + this.props.idx + "-current")
      .classed("current", true)
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 0)
      .attr("height", this.height);
             // set the y radius

    this.svg.append("g")
      .classed("path-group", true)
      .classed("current", true)
      .selectAll("path.current")
      .data(data)
      .enter()
      .append("path")
        .classed("current", true)
        .attr("fill", "none")
        .attr("stroke", d => d.color)
        .attr("clip-path", "url(#clip-" + this.props.idx + "-current)")
        .attr("d", d => d3.line()
          .x(d => this.x(d[0]))
          .y(d => this.y(d[1]))
          .curve(d3.curveMonotoneX)
          (d3.zip(d.x, d.y)))

    this.focuses = this.svg.selectAll("g.focus-group.current")
      .data(data)
      .enter()
      .append("g")
      .classed("focus-group", true)
      .append("circle")
        .attr("fill", d => d.color)
        .attr("r", 5)
        .attr("transform", d =>
          "translate(" + this.x(d.x[0]) + "," + this.y(d.y[0]) + ")")


  }

  // make sure i'm not leaving stuff/data that should be removed
  updateChart() {
    console.log("updating chart");
    this.svg.selectAll(".previous").remove();
    this.svg.selectAll(".focus-group").remove();
    this.svg.select("#clip-" + this.props.idx + "-current")
      .attr("id", "clip-" + this.props.idx + "-previous");

    this.svg.select(".path-group.current")
      .selectAll("path")
      .attr("clip-path", "url(#clip-" + this.props.idx + "-previous");

    this.svg.selectAll(".current")
      .classed("current", false)
      .classed("previous", true);

    this.renderChart();
  }

  // https://groups.google.com/g/d3-js/c/WC_7Xi6VV50/m/j1HK0vIWI-EJ
  // https://d3-wiki.readthedocs.io/zh_CN/master/Transitions/
  // https://stackoverflow.com/questions/10692100/invoke-a-callback-at-the-end-of-a-transition
  // perhaps designate a parent transition within simulator
  play(sharedTransition) {
    console.log("playing");
    this.svg.select("#clip-" + this.props.idx + "-previous")
      .select("rect")
      .transition(sharedTransition)
      .attr("width", 0)
      .attr("x", this.width);

    this.clip.transition(sharedTransition)
      .attr("width", this.width);

    this.focuses.transition(sharedTransition)
      .attrTween("transform", d =>
        function(t) {
          var idxDec = t*(d.x.length-1);
          var idxInt = Math.floor(idxDec);

          var leftX = this.x(d.x[idxInt]);
          var rightX = t === 1 ? leftX : this.x(d.x[idxInt+1]);
          var leftY = this.y(d.y[idxInt]);
          var rightY = t === 1 ? leftY : this.y(d.y[idxInt+1]);

          var xTrans = d3.interpolateNumber(leftX, rightX)(idxInt-idxDec);
          var yTrans = d3.interpolateNumber(leftY, rightY)(idxInt-idxDec);

        return "translate(" + xTrans + "," + yTrans + ")";
        }.bind(this)
      )
  }

  render() {
    return (
      <div id={this.props.chartInfo.id} ref={c => this.container = c} />
    );
  }
}
export default Chart;
