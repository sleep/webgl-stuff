import React from "react";

import Remarkable from "remarkable";
let md = new Remarkable();


// literalify (String, i) -> (ReactElement)
// literalify (ReactElement, i) -> (ReactElement)
//
// mapping function from String or ReactElement to ReactElement
export default function literalify(obj, i) {
  if (typeof obj === "string") {
    // if string

    let html = md.render(obj);

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

