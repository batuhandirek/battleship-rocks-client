import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

export const persistToken = (token, fileName = 'session.txt') => {
    try {
        const homeDir = os.homedir()
        const folderDir = path.join(homeDir, '.battleship')
        const fileDir = path.join(folderDir, fileName)
        if (!fs.existsSync(folderDir)) fs.mkdirSync(folderDir);
        fs.writeFileSync(fileDir, token, 'utf8')
        return { ok: true }
    }
    catch(e) {
        return { ok: false, error: e }
    }
}

export const getToken = (fileName = 'session.txt') => {
    try {
        const homeDir = os.homedir();
        const folderDir = path.join(homeDir, '.battleship')
        const fileDir = path.join(folderDir, fileName)
        const tokenBuffer = fs.readFileSync(fileDir)
        const token = Buffer.from(tokenBuffer).toString()
        return { ok: true, token }
    }
    catch(e) {
        return { ok: false, error: e }
    }
}
