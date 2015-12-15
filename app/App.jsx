import React from "react";
import Nav from "./Nav.jsx";

const App = React.createClass({
    render() {
        console.log("App rendered!");
        return (
            <div id="app">
              <Nav/>
                <div id="content">
                  {this.props.children}
                </div>
            </div>
        )
    }
});

export default App;
