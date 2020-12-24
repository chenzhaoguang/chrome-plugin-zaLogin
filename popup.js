class Popup {
    constructor() {
        this.tab = null
        this.init()
    }

    async init() {
        await this.initTab()
        this.bindEvent()
    }

    initTab() {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
                this.tab = tabs[0]
                await this.updataBackground({ key: 'content' })
                chrome.tabs.executeScript(this.tab.id, { file: 'page.js' }, () => {
                    resolve()
                })
            })
        })
    }

    // 获取数据是必须调用此函数
    updataBackground(msg) {
        return new Promise((resolve, reject) => {
            let port = chrome.extension.connect({
                name: 'popup-name',
            })
            port.postMessage(msg)
            resolve(port)
        })
    }
    // 获取CzgPage值 存在异步 需要放入微任务中
    getCzgPage = msg => {
        return new Promise((resolve, reject) => {
            const bg = chrome.extension.getBackgroundPage()
            setTimeout(() => {
                resolve(bg.getCzgPage())
            }, 0)
        })
    }
    // 获取phone值 存在异步 需要放入微任务中
    getPhone() {
        return new Promise((resolve, reject) => {
            const bg = chrome.extension.getBackgroundPage()
            setTimeout(() => {
                resolve(bg.getPhone())
            }, 0)
        })
    }

    // 获取smsCode值 存在异步 需要放入微任务中
    getSmsCode() {
        return new Promise((resolve, reject) => {
            const bg = chrome.extension.getBackgroundPage()
            setTimeout(() => {
                resolve(bg.getSmsCode())
            }, 0)
        })
    }

    bindEvent() {
        const oPhone = document.querySelector('#czg-chrome-phone')
        const oSmsCode = document.querySelector('#czg-chrome-smsCode')
        const oGetCaptch = document.querySelector('#czg-chrome-getCaptch')
        const oHandleLogin = document.querySelector('#czg-chrome-handleLogin')
        const oClg = document.getElementById('czg-chrome-clg')
        const oClear = document.getElementById('czg-chrome-clear')
        const oOut = document.getElementById('czg-chrome-out')
        // input 事件
        const onInputPhone = async e => {
            chrome.tabs.sendMessage(this.tab.id, {
                msg: {
                    key: 'phone',
                },
            })
        }
        const onInputSmsCode = e => {
            chrome.tabs.sendMessage(this.tab.id, {
                msg: {
                    key: 'smsCode',
                },
            })
        }
        const onClickGetCaptch = async e => {
            await this.updataBackground({
                key: 'onClickGetCaptch',
                value: '',
            })
            const value = await this.getPhone()
            chrome.tabs.sendMessage(this.tab.id, {
                msg: {
                    key: 'getCaptch',
                    value,
                },
            })
        }
        const onClickLogin = async e => {
            await this.updataBackground({
                key: 'onClickLogin',
                value: '',
            })
            const phone = await this.getPhone()
            const smsCode = await this.getSmsCode()
            chrome.tabs.sendMessage(this.tab.id, {
                msg: {
                    key: 'handleLogin',
                    phone,
                    smsCode,
                },
            })
        }
        const onClickClg = async e => {
            chrome.tabs.sendMessage(this.tab.id, {
                msg: {
                    key: 'clg',
                },
            })
        }
        const onClickClear = async e => {
            chrome.tabs.sendMessage(this.tab.id, {
                msg: {
                    key: 'clear',
                },
            })
        }
        const onClickOut = async e => {
            chrome.tabs.sendMessage(this.tab.id, {
                msg: {
                    key: 'out',
                },
            })
        }
        chrome.tabs.sendMessage(this.tab.id, {
            msg: {
                key: 'url',
                value: this.tab.url,
            },
        })

        // 添加绑定事件
        oPhone.addEventListener('input', onInputPhone, false)
        oSmsCode.addEventListener('input', onInputSmsCode, false)
        oGetCaptch.addEventListener('click', onClickGetCaptch, false)
        oHandleLogin.addEventListener('click', onClickLogin, false)
        oClg.addEventListener('click', onClickClg, false)
        oClear.addEventListener('click', onClickClear, false)
        oOut.addEventListener('click', onClickOut, false)
    }
}

new Popup()
