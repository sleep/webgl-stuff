import React, {PropTypes} from "react";
import Literate from "react-literate";

export default React.createClass({
  propTypes: {
    children: PropTypes.array
  },
  render() {
    let config = {
      wysiwyg: true,
      gfm: true,
      breaks: true,
      html: true,
    };
    return (
      <Literate className="literate" config={config}>
        {this.props.children}
      </Literate>
    );
  }
});
