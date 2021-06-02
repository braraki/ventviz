<h1 align="center">VentViz: An Interactive Ventilator Simulator</h1>

## Project Overview

VentViz is an interactive JavaScript application designed to simulate and visualize human breathing patterns. Given the initial status of a patient, it predicts the progression of the patient's breathing parameters over time and charts this evolution in the manner of a traditional ventilator screen.

The application generates its data according to the RC model of human respiration, which treats the circulatory system as an electrical circuit. It numerically solves the circuit equations to project the evolution of a patient's vital signs. A review of various circuit-inspired models for breathing may be found [here](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5127616/).

VentViz offers an interactive, informative interface. This UI mimicks the display of a physical ventilator, with scrolling graphs displaying evolution over time accompanied by printouts of instantaneous vital signs. The user may additionally alter initial parameter values or pause and inspect data for a particular time.

A working demo of VentViz may be found at [https://ventviz.herokuapp.com/](https://ventviz.herokuapp.com/)

## App Preview
![](img/app_preview.png)

## Tools & Libraries Used

* [odex-js](https://github.com/littleredcomputer/odex-js)
* [D3.js](https://d3js.org/)
* [React](https://reactjs.org/)
* [React-Bootstrap](https://react-bootstrap.github.io/)
* [Node.js](https://nodejs.org/)

## Installation

1. Install NPM if needed
2. Install required packages:
```sh
npm install
```
3. Start the application with:
```sh
npm start
```

The application should then be served on ``localhost:3000``, the default for React.

<!-- CONTACT -->
## Contributors

* [Brandon Araki](https://github.com/braraki)
* [Andrew Zhou](https://github.com/zhouandrewc)

