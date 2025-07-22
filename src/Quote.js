import React, {Component} from 'react';

class Quote extends Component {
    render() {
        return (
            <div className="quote-section">
                <blockquote>
                    "Hard work beats talent when talent doesn't work hard."
                </blockquote>
                <cite>- Tim Notke</cite>
            </div>
        );
    }
}

export default Quote;