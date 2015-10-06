import React from "react";
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
        path: "0",
        component: require("./0/index.jsx")
      },
      {
        path: "1",
        component: require("./1/index.jsx")
      },
    ]
}


React.render((
    <Router history={createHistory({queryKey: false})}
            children={routes}/>
), document.getElementById("app"));
