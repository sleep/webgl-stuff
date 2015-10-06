import React from "react";
import Literate from "./Literate.jsx";

export default React.createClass({
  render() {
    let content = [
      `
# Computer Graphics

This is Sean Lee's page
for Computer Graphics...

This is a counter:
      `,
      React.createElement(require("./Counter")),
      `
*Let me test some markdown...*
Paragraph


List
- foo
- bar
- foobar

\`The tricky part is expressing backticks...\`
\`\`\`
and code



sequences
\`\`\`
       `,
    ];
    let config = {
      wysiwyg: true,
      gfm: true,
      breaks: true,
      html: true,
    };
    return (
      <Literate config={config}>
        {content}
      </Literate>
    );
  }
});
