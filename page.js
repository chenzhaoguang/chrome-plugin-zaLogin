class ChromePluginLogin {
    constructor() {
        this.gApi = null // 网关
        this.token = 'zaLoginCookieKey'
        this.chromeTitle = 'chrome-plugin-login'
        this.isLoading = false
        this.url = null // 当前页面的url
        this.api = {
            /** 获取验证码 */
            apiSendSmsCode: {
                url: '/appapi/dm-account/otp/sendSmsCode',
                gateway: 'appApi',
                method: 'POST',
                description: '获取验证码',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            },
            /** 用户登录接口 */
            apiRegisterAndLogin: {
                url: '/appapi/dm-account/otp/registerAndLogin',
                gateway: 'appApi',
                method: 'POST',
                description: '用户登录接口',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            },
            /** 获取当前登录用户的信息 */
            apiGetUserInfo: {
                url: '/appapi/dm-account/user/getUserInfo',
                gateway: 'appApi',
                method: 'GET',
                description: '获取当前登录用户的信息',
                headers: { 'Content-Type': 'application/json' },
            },
        }
        this.init()
    }

    init() {
        window.onerror = this.stopError
        // 监听消息
        chrome.runtime.onMessage.addListener((data, sender, callback) => {
            const key = data.msg.key
            switch (key) {
                case 'phone':
                    break
                case 'smsCode':
                    break
                case 'getCaptch':
                    this.getCaptch(data.msg.value)
                    break
                case 'handleLogin':
                    this.handleLogin(data.msg)
                    break
                case 'clg':
                    this.clg()
                    break
                case 'clear':
                    this.clear()
                    break
                case 'out':
                    this.out()
                    break
                case 'url':
                    this.getMachine(data.msg.value)
                    this.setUser()
                    break
                default:
                    break
            }
        })
    }
    async setUser() {
        let value = await this.getUserInfo()
        chrome.runtime.sendMessage({
            key: 'init',
            value,
            url: this.url,
        })
    }
    // clg
    clg() {
        const clgUrl = this.changeURLArg(this.url, '_zax', 1)
        window.location.href = clgUrl
    }
    // clear
    clear() {
        const clearUrl = this.changeURLArg(this.url, 'force', 'true')
        window.location.href = clearUrl
    }
    // out
    out() {
        this.setCookie(this.token, '')
        window.location.reload()
    }

    stopError() {
        return true
    }
    getMachine(url) {
        this.url = url
        if (url.indexOf('-test') != -1) {
            this.gApi = `https://mgw-daily.zhongan.com`
        } else if (url.indexOf('-uat') != -1) {
            this.gApi = `https://gwbk-uat.zhongan.com`
        } else {
            this.gApi = `https://gwbk.zhongan.com`
        }
    }
    // set url
    changeURLArg(url, arg, arg_val) {
        var pattern = arg + '=([^&]*)'
        var replaceText = arg + '=' + arg_val
        if (url.match(pattern)) {
            var tmp = '/(' + arg + '=)([^&]*)/gi'
            tmp = url.replace(eval(tmp), replaceText)
            return tmp
        } else {
            if (url.indexOf('#/') != -1) {
                if (url.split('#/')[0].match('[?]')) {
                    return url.split('#/')[0] + '&' + replaceText + '#/' + url.split('#/')[1]
                } else {
                    return url.split('#/')[0] + '?' + replaceText
                }
            } else {
                if (url.match('[?]')) {
                    return url + '&' + replaceText
                } else {
                    return url + '?' + replaceText
                }
            }
        }
    }
    /**
     * [setCookie 设置cookie]
     * [key value t 键 值 时间(秒)]
     */
    setCookie(key, value, t) {
        var oDate = new Date()
        oDate.setDate(oDate.getDate() + t)
        document.cookie = key + '=' + value + '; expires=' + oDate.toDateString()
    }
    // 获取指定名称的cookie
    getCookie(name) {
        var strcookie = document.cookie //获取cookie字符串
        var arrcookie = strcookie.split('; ') //分割
        //遍历匹配
        for (var i = 0; i < arrcookie.length; i++) {
            var arr = arrcookie[i].split('=')
            if (arr[0] == name) {
                return arr[1]
            }
        }
        return ''
    }
    /** 获取当前登录用户的信息 */
    getUserInfo() {
        const _this = this
        try {
            return new Promise(async (resolve, reject) => {
                const accessKey = _this.getCookie(_this.token)
                // 已登录
                if (accessKey) {
                    _this.isLoading = true
                    const response = await window.fetch(
                        `${_this.gApi}${_this.api.apiGetUserInfo.url}`,
                        {
                            method: _this.api.apiGetUserInfo.method,
                            mode: 'cors',
                            headers: Object.assign(_this.api.apiGetUserInfo.headers, {
                                accessKey: _this.getCookie(_this.token),
                            }),
                        }
                    )
                    response.json().then(function (res) {
                        _this.isLoading = false
                        resolve({
                            headImg: res.value.headImg,
                            nickName: res.value.nickName,
                            phone: res.value.phone,
                            login: true,
                        })
                    })
                } else {
                    resolve({
                        headImg: '',
                        nickName: '',
                        phone: '',
                        login: false,
                    })
                }
            })
        } catch (error) {
            _this.isLoading = false
            // console.log(_this.chromeTitle, error)
        }
    }

    /** 获取验证码 */
    async getCaptch(phone) {
        try {
            this.isLoading = true
            await window.fetch(`${this.gApi}${this.api.apiSendSmsCode.url}`, {
                method: this.api.apiSendSmsCode.method,
                mode: 'cors',
                headers: this.api.apiSendSmsCode.headers,
                body: `phone=${phone}`,
            })
            this.isLoading = false
        } catch (error) {
            this.isLoading = false
            // console.log(this.chromeTitle, error)
        }
    }

    /** 登录 */
    async handleLogin(data) {
        const { phone, smsCode } = data
        const _this = this
        try {
            this.isLoading = true
            const response = await window.fetch(`${this.gApi}${this.api.apiRegisterAndLogin.url}`, {
                method: this.api.apiRegisterAndLogin.method,
                mode: 'cors',
                headers: this.api.apiRegisterAndLogin.headers,
                body: `phone=${phone}&smsCode=${smsCode}&channel=8&countryCode=86`,
            })
            response.json().then(function (res) {
                _this.setCookie(
                    _this.token,
                    res.value.token || res.value.accessKey || '',
                    60 * 60 * 72
                )
                window.location.reload()
            })
            this.isLoading = false
        } catch (error) {
            this.isLoading = false
            // console.log(this.chromeTitle, error)
        }
    }
}
new ChromePluginLogin()
