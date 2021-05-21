import { Component } from 'react';

export class Spinner extends Component {
    constructor(props) {
        super(props)
        this.state = {
            tickCount: 0,
        }
    }

    componentDidMount() {
        this.interval = setInterval(this.tick, this.props.tick||100)
    }

    componentWillUnmount() {
        if(this.interval) clearInterval(this.interval)
    }

    tick = () => {
        this.setState((state) => ({ ...this.state, tickCount: state.tickCount + 1}))
    }

    render() {
        const dotCount = this.props.dotCount || 6
        const width = this.props.width || 2
        return (
            <box width={width * dotCount} {...(this.props.boxProps || {})}>
                {new Array(this.state.tickCount % (dotCount+1)).fill(1).map((one, index) => (
                    <text width={width} left={ width * index } key={index}>.</text>
                ))}
            </box>
        )
    }
}
