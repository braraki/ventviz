import React from 'react';
import './forms.css';


function Forms(props) {
  return (
      <button className="play" onClick={props.onClick}>
        Play
      </button>
    )
}

export default Forms;