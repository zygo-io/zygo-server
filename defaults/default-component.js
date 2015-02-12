var React = require('react');

module.exports.default = React.createClass({
  render: function() {
    return (
      <div>
        {"Error: " + this.props.errorCode}
      </div>
    );
  }
});
