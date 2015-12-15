import React, {PropTypes} from "react";
import {Link, History} from "react-router";

const MyLink = React.createClass({
    mixins: [History],
    propTypes: {
        to: PropTypes.string.isRequired
    },
    render() {
        const isCurrent = this.history.isActive(this.props.to);
        return (
            <Link className={isCurrent ? "current" : ""}
               to={this.props.to}>{this.props.children}</Link>
        )
    }
});

export default React.createClass({
    propTypes: {
        tree: PropTypes.object
    },
    render() {
        return (
            <div id="nav">
                <ul>
                    <li> <MyLink to="/">/</MyLink> </li>
                    <li> <MyLink to="/1">/1</MyLink> </li>
                    <li> <MyLink to="/2">/2</MyLink> </li>
                    <li> <MyLink to="/3">/3</MyLink> </li>
                    <li> <MyLink to="/4">/4</MyLink> </li>
                </ul>
            </div>
        )
    }
});
