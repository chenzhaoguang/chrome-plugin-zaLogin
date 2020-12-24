class Background {
    constructor() {
        this.smsCode = null
        this.phone = null
        this.token = 'zaLoginCookieKey'
        this.defaultAvatar =
            'https://static.zhongan.com/website/assets/common/images/default-avatar.png'
        this.machine = {
            test: '当前环境：test',
            pre: '当前环境：pre',
            prd: '当前环境：prd',
            other: '请在众安环境下使用',
        }
        this.init()
    }

    static getInstance() {
        // 判断对象是否已经被创建,若创建则返回旧对象
        if (!this.instance) {
            this.instance = new Background()
        }
        return this.instance
    }

    async init() {
        await this.initConnect()
        await this.initMessage()
    }

    initConnect() {
        return new Promise((resolve, reject) => {
            // 使用长连接 - 监听 popup 传递来的消息
            chrome.extension.onConnect.addListener(port => {
                console.log('连接中------------')
                port.onMessage.addListener(msg => {
                    console.log('接收消息：', msg)
                    if (msg.key != 'content') {
                        this.getAll(msg)
                    }
                    port.postMessage('popup，我收到了你的信息~')
                    resolve()
                })
            })
        })
    }
    initMessage() {
        return new Promise((resolve, reject) => {
            // 于contentjs 通讯
            chrome.runtime.onMessage.addListener(async (req, sender, sendResponse) => {
                console.log('我是background，我接收了来自 content.js的消息：', req)
                this.getAll(req)
                resolve()
                // const tabId = await this.getCurrentTabId()
                // 在背景页面发送消息，需要当前 tabID
                // chrome.tabs.sendMessage(tabId, '我是background，我在发送消息', function (res) {
                //     console.log('background：', res)
                // })
            })
        })
    }

    getMachine(url) {
        if (url.indexOf('zhongan') != -1) {
            if (url.indexOf('-test') != -1) {
                return this.machine.test
            } else if (url.indexOf('-uat') != -1) {
                return this.machine.pre
            } else {
                return this.machine.prd
            }
        } else {
            return this.machine.other
        }
    }
    // 获取所有 tab
    getAll(msg) {
        const { key, value, url } = msg
        const views = chrome.extension.getViews({
            type: 'popup',
        })
        const localPhone = localStorage.getItem('phone')
        console.log(key, value)
        for (let o of views) {
            const domTitle = o.document.getElementById('czg-chrome-title')
            const domPhone = o.document.getElementById('czg-chrome-phone')
            const domSmsCode = o.document.getElementById('czg-chrome-smsCode')
            const domInfo = o.document.getElementById('czg-chrome-info')
            const domLogin = o.document.getElementById('czg-chrome-login')
            const domInfoHeadImg = o.document.getElementById('czg-chrome-headImgText')
            const domInfoNickName = o.document.getElementById('czg-chrome-nickNameText')
            const domInfoPhone = o.document.getElementById('czg-chrome-phoneText')
            let env = ''

            if (key == 'init') {
                const { headImg, nickName, phone, login } = value
                if (login) {
                    env = `${this.getMachine(url)} 已登录`
                    domLogin.style.display = 'none'
                    domInfo.style.display = 'flex'
                    domInfoHeadImg.src = headImg || this.defaultAvatar
                    domInfoNickName.innerText = nickName || '-'
                    domInfoPhone.innerText = phone || '-'
                } else {
                    env = `${this.getMachine(url)} 未登录`
                    domLogin.style.display = 'flex'
                    domInfo.style.display = 'none'
                    if (localPhone && !domPhone.value) {
                        domPhone.value = localPhone
                    }
                }
            }
            if (domPhone.value && domPhone.value.length === 11) {
                localStorage.setItem('phone', domPhone.value)
            }
            console.log(domPhone)
            domTitle.innerText = env
            this.phone = domPhone.value || ''
            console.log((domPhone.value))
            this.smsCode = domSmsCode.value || ''
        }
    }
    getCurrentTabId() {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                resolve(tabs.length ? tabs[0].id : null)
            })
        })
    }
    get(key) {
        return this[key]
    }
}

const czgBg = new Background()

function getPhone() {
    return czgBg.get('phone')
}
function getSmsCode() {
    return czgBg.get('smsCode')
}
