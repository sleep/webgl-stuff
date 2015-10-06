import React, {PropTypes} from "react";
import marked from "marked";



export default React.createClass({
  propTypes: {
    children: PropTypes.array,
    config: PropTypes.object
  },
  getDefaultProps() {
    return {
      children: [],
      //default marked props
      config: {
        renderer: new marked.Renderer(),
        gfm: true,
        tables: true,
        breaks: false,
        pedantic: false,
        sanitize: true,
        smartLists: true,
        smartypants: false
      }
    };
  },
  render() {

    marked.setOptions(this.props.config);

    // mapToReactElement (String, i) -> (ReactElement)
    // mapToReactElement (ReactElement, i) -> (ReactElement)
    //
    // mapping function from String or ReactElement to ReactElement
    const mapToReactElement = (obj, i) => {
      if (typeof obj === "string") {
        // if string

        let text = obj;
        if (this.props.config.wysiwyg) {
          text = text.replace(/\n\n/g, '\n<br/>');

          // todo: fix bug of <br/>'s popping up in code blocks'
          // split by triple backticks, replace only noncode blocks (odd numbered) and recombine
        }
        let html = marked(text);

        return (
          <div key={i}
               dangerouslySetInnerHTML={{__html: html}}/>
        );
      } else {
        // if ReactElement

        return (
          <div key={i}>
            {obj}
          </div>
        );
      }
    }

    let children = React.Children.map(this.props.children, mapToReactElement);


    return (
      <div>
        {children}
      </div>
    )
  }
});


//TODO: optimize?
