import * as process from 'process'
import * as _ from 'lodash'

import { Component } from 'react';

import { Home } from './pages/home/Home'
import { Game } from './pages/game/Game'
import { Howto } from './pages/howto/Howto';

import { Api } from './lib/api'

export class App extends Component {
    constructor(props) {
        super(props);

        this.state = { 
            page: 'home',
        }

        this.NAV = {
            home: () => <Home onNavigation={this.handleNavigation.bind(this)}/>,
            game: () => <Game  onNavigation={this.handleNavigation.bind(this)}/>,
            howto: () => <Howto onNavigation={this.handleNavigation.bind(this)}/>,
        }

        this.api = new Api()
    }

    // Navigation
    handleNavigation(submitted) {
        if(submitted === 'home') this.goHome()
        if(submitted === 'game') this.goGame()
        if(submitted === 'howto') this.goHowto()
        if(submitted === 'quit') this.quit()
    }

    goHome() { this.setState(state => ({ ...state, page: 'home' })) }
    goGame() { this.setState(state => ({...state, page: 'game' }))}
    goHowto() { this.setState(state => ({ ...state, page: 'howto' })) }

    // Quit
    quit = () => { 
        if(this.socket) this.socket.disconnect()
        process.exit(0)
    }

    render() {
        return (
            <element>
                {this.NAV[this.state.page]()}
            </element>
        );
    }
}

