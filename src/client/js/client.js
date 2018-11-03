"use strict";

import React from 'react';
import ReactDOM from 'react-dom';

import Game from './Game';

ReactDOM.render(
    <Game />,
    document.getElementById('app')
);

module.hot.accept();