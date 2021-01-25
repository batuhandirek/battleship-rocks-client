
export class Api {
    constructor() {
        this.socket = null
    }

    setSocket(socket) { this.socket = socket }

    async createSession() { return this._request('session:create')}
    async continueSession(token) { return this._request('session:continue', token)}

    async findGame(body) { return this._request('game:find', body)}
    async cancelFindGame(body) { return this._request('game:find:cancel', body)}

    async privateGameCreate(body) { return this._request('game:private:create', body)}
    async privateGameCancel(body) { return this._request('game:private:cancel', body)}
    async privateGameJoin(body) { return this._request('game:private:join', body)}

    async placementSubmit(body) { return this._request('game:placement:submit', body)}
    async moveSubmit(body) { return this._request('game:move:submit', body)}

    async _request(method, body) {
        if(!this.socket) throw new Error('No socket is set!')
        else {
            return new Promise(resolve => {
                this.socket.emit(method, body, resolve)
            })
        }
    }
}