import React from "react";
import {render} from "react-dom";
import "./style.scss";

import {Router, Route} from "react-router";
import createHistory from 'history/lib/createHashHistory';


import App from "./App.jsx";
import Landing from "./Landing.jsx";


let routes = {
    path: "/",
    component: App,
    indexRoute: {component: Landing},
    childRoutes: [
      {
        path: "1",
        component: require("./1/index.jsx")
      },
      {
        path: "2",
        component: require("./2/index.jsx")
      },
      {
        path: "3",
        component: require("./3/index.jsx")
      },
      {
        path: "4",
        component: require("./4/index.jsx")
      },
    ]
}


render((
    <Router history={createHistory({queryKey: false})}
            children={routes}/>
), document.getElementById("app"));
