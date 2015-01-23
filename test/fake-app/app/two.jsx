import React from 'react';

import './two.css!';

export default React.createClass({
  render: function() {
    return (
      <div>
        <h5> Two </h5>
        <div> {this.props.children} </div>
      </div>
    );
  }
});
