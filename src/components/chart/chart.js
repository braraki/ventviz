import React from 'react';
import * as d3 from 'd3';
import './chart.css';
import {Container} from 'react-bootstrap'

// change to function component, maybe
class Chart extends React.Component {
  constructor(props) {
    super(props);
    // these shouldn't change
    this.margin = this.props.svgDims.margin;
    this.width = this.props.svgDims.width;
    this.height = this.props.svgDims.height;
    this.yVars = this.props.chartInfo.variables;
    this.timeDomain = this.props.chartParams.timeDomain;
    
    this.axesSet = false;
  }

  componentDidMount() {
    this.svg = d3.select(this.container)
      .classed("svg-container", true)
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", "0 0 " + (this.width + this.margin.left + this.margin.right) + " " +  (this.height + this.margin.top + this.margin.bottom))
      .classed("svg-content-responsive", true)
      .append("g") 
      .attr("transform",
            "translate(" + this.margin.left + "," + this.margin.top + ")");
    
    this.initChart();
  }

  formatData() {
    return this.yVars.map(yVar => 
      ({"name": yVar.name, "x": this.props.soln.time.map(time => time - this.props.loop * this.timeDomain), "y": this.props.soln[yVar.name], 
      "color": yVar.color, "label": yVar.label}));
  }

  initChart() {
    this.x = d3.scaleLinear()
      .domain([0, this.props.chartParams.timeDomain])
      .range([0, this.width]);

    this.svg.append("g")
      .attr("transform", "translate(0," + this.height + ")")
      .classed("x-axis", true)
      .call(d3.axisBottom(this.x).tickFormat(function(d, i) {
        return d == 0 ? "0s" : d3.format("+.1f")(d)
      }));


    this.svg.append("text")
      .attr("x", this.width*0.02)
      .attr("y", -this.height*0.022)
      .classed("y-unit", true)
      .text(this.props.chartLabel + ' (' + this.props.unit + ')');

    
    this.svg.selectAll("g.text-group")
      .data(this.yVars.map(yVar => ({"label": yVar.label, "color": yVar.color})))
      .enter()
      .append("text")
        .attr("class", "legend-text")
        .attr("font-size", '0.65em')
        .attr("dx", (_, i) => 35 + i*15 + "%")
        .attr("dy", '-2.2%')
        .style("fill", d => d.color)
        .text(d => "— " + d.label);


    this.sweepingLine = this.svg.append("line")
      .attr("x1", 0)  
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", this.height)
      .attr("id", "sweeping-line")
      .style("stroke-dasharray", "3,3")
      .style("stroke", "black")
      .style("fill", "none")
      .style("opacity", 0.5);

    this.addPlaceholderY();
  }

  addPlaceholderY() {
    this.y = d3.scaleLinear()
      .domain([0, 1])
      .range([this.height, 0]);

    this.svg.append("g")
      .classed("placeholder-y-axis", true)
      .call(d3.axisLeft(this.y).tickFormat("").ticks(6));
  }

  setAxes() {

    this.svg.select(".placeholder-y-axis").remove();

    var yArrays = this.yVars.map(yVar =>
      this.props.soln[yVar.name]);

    this.y = d3.scaleLinear()
      .domain(d3.extent(d3.merge(yArrays)))
      .range([this.height, 0])
      .nice();


    this.svg.append("g")
      .classed("y-axis", true)
      .call(d3.axisLeft(this.y).ticks(6));

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
  
  componentDidUpdate() {
    switch (this.props.action) {
      case 'play':
        this.play()
        break;
      case 'reset':
        this.reset();
        break;
      case 'pause':
        // empty for now as the logic is handled in simulator.js
        // consider sending the logic back here using setstate
        break;
      default:
        break;
    }
  }

  // todo: check whether unnecessary dom elements are retained
  reset() {
    this.svg.selectAll("*").transition();
    this.svg.selectAll("*").remove();
    this.initChart();
    this.axesSet = false;
  }

  renderChart() {
    var data = this.formatData();

    this.clipRect = this.svg.append("clipPath")
      .attr("id", "clip-" + this.props.idx + "-current")
      .classed("current", true)
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 0)
      .attr("height", this.height);

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
  loopChart() {
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

    this.sweepingLine
      .attr("x1", 0)  
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", this.height)

    this.svg.select(".x-axis").select("g").select("text").text(this.props.loop * this.timeDomain + "s");
  }

  play() {
    // clean up the logic here for axes/resuming
    if (!this.axesSet) {
      this.setAxes();
      this.axesSet = true;
    }
    if (this.props.pauseTime === 0) {
      this.loopChart();
      this.renderChart();
    }

    this.svg.select("#clip-" + this.props.idx + "-previous")
      .select("rect")
      .transition(this.props.transition)
      .attr("width", 0)
      .attr("x", this.width);

    this.clipRect.transition(this.props.transition)
      .attr("width", this.width);

    this.focuses.transition(this.props.transition)
      .attrTween("transform", d =>
        function(t0) {
          var t = this.props.pauseTime + t0 * (1-this.props.pauseTime);
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
    
    this.sweepingLine.transition(this.props.transition)
        .attr("x1", this.width)
        .attr("x2", this.width);
      
  }

  render() {
    return (
      <Container id={this.props.chartInfo.id} ref={c => this.container = c} />
    );
  }
}
export default Chart;
