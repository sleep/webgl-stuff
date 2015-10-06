import React from "react";

import essay from "./essay.md"

export default React.createClass({
    render() {
        return (
            <div dangerouslySetInnerHTML={{__html: essay}}/>
        )
    }
});
