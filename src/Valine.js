/**
 * @Valine
 * Author: xCss
 * Github: https://github.com/xCss/Valine
 * Website: https://valine.js.org
 */
import md5 from 'blueimp-md5';
import marked from 'marked';
import hljs from './common/highlight.js';
import * as xssEscape from 'xss-filters';
import timeago from 'timeago.js';

marked.setOptions({
    gfm: true,
    tables: true,
    breaks: true,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: false,
    highlight: (code) => {
        return hljs.highlightAuto(code).value
    }
});

const gravatar = {
    cdn: 'https://cdn.v2ex.com/gravatar/',
    ds: ['mm', 'identicon', 'monsterid', 'wavatar', 'retro', ''],
    params: '?s=40',
    hide: !1
};
const defaultComment = {
    comment: '',
    rid: '',
    nick: 'Guest',
    mail: '',
    link: '',
    ua: navigator.userAgent,
    url: '',
    pin: 0,
    like: 0
};
const GUEST_INFO = ['nick', 'mail', 'link'];

const store = localStorage;

class Valine {
    /**
     * Valine constructor function
     * @param {Object} option
     * @constructor
     */
    constructor(option) {
        let _root = this;
        // version
        _root.version = '1.1.8-beta-Kinvey-WildFire';

        _root.md5 = md5;
        // Valine init
        !!option && _root.init(option);
    }

    /**
     * Valine Init
     * @param {Object} option
     */
    init(option) {
        let _root = this;
        try {
            let el = ({}).toString.call(option.el) === "[object HTMLDivElement]" ? option.el : document.querySelectorAll(option.el)[0];
            if (({}).toString.call(el) != '[object HTMLDivElement]') {
                throw `The target element was not found.`;
            }
            _root.el = el;
            _root.el.classList.add('valine');

            const guest_info = option.guest_info || GUEST_INFO;
            const inputEl = guest_info.map(item => {
                switch (item) {
                    case 'nick':
                        return '<input name="nick" placeholder="Name" class="vnick vinput" type="text">';
                        break;
                    case 'mail':
                        return '<input name="mail" placeholder="Email" class="vmail vinput" type="email">';
                        break;
                    case 'link':
                        return '<input name="link" placeholder="Website (Optional)" class="vlink vinput" type="text">';
                        break;
                    default:
                        return '';
                        break;
                }
            });

            let placeholder = option.placeholder || 'Leave a comment';
            let eleHTML = `<div class="vwrap"><div class="${`vheader item${inputEl.length}`}">${inputEl.join('')}</div><div class="vedit"><textarea class="veditor vinput" placeholder="${placeholder}"></textarea></div><div class="vcontrol"><div class="col col-60" title="Styling with Markdown is supported"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M14.85 3H1.15C.52 3 0 3.52 0 4.15v7.69C0 12.48.52 13 1.15 13h13.69c.64 0 1.15-.52 1.15-1.15v-7.7C16 3.52 15.48 3 14.85 3zM9 11H7V8L5.5 9.92 4 8v3H2V5h2l1.5 2L7 5h2v6zm2.99.5L9.5 8H11V5h2v3h1.5l-2.51 3.5z"></path></svg> Styling with Markdown is supported</div><div class="col col-40 text-right"><button type="button" class="vsubmit vbtn">Post</button></div></div><div style="display:none;" class="vmark"></div></div><div class="info"><div class="count col"></div></div><div class="vloading"></div><div class="vempty" style="display:none;"></div><ul class="vlist"></ul><div class="vpage txt-center"></div><div class="info"><div class="power txt-right">Powered By <a href="https://github.com/Goshin/Valine-Kinvey" target="_blank">Valine-Kinvey</a></div></div>`;
            _root.el.innerHTML = eleHTML;

            // Empty Data
            let vempty = _root.el.querySelector('.vempty');
            _root.nodata = {
                show(txt) {
                    vempty.innerHTML = txt || `Post the first comment!`;
                    vempty.setAttribute('style', 'display:block;');
                },
                hide() {
                    vempty.setAttribute('style', 'display:none;');
                }
            }

            // loading
            let _spinner = `<div class="spinner"><div class="r1"></div><div class="r2"></div><div class="r3"></div><div class="r4"></div><div class="r5"></div></div>`;
            let vloading = _root.el.querySelector('.vloading');
            vloading.innerHTML = _spinner;
            // loading control
            _root.loading = {
                show() {
                    vloading.setAttribute('style', 'display:block;');
                    _root.nodata.hide();
                },
                hide() {
                    vloading.setAttribute('style', 'display:none;');
                    _root.el.querySelectorAll('.vcard').length === 0 && _root.nodata.show();
                }
            };
            //_root.nodata.show();

            _root.notify = option.notify || !1;
            _root.verify = option.verify || !1;

            gravatar['params'] = '?d=' + (gravatar['ds'].indexOf(option.avatar) > -1 ? option.avatar : 'mm');
            gravatar['hide'] = option.avatar === 'hide' ? !0 : !1;

            let av = option.av || Kinvey;
            let appSecret = option.app_secret || option.appSecret;
            let appKey = option.app_key || option.appKey;
            if (!appSecret || !appKey) {
                _root.loading.hide();
                throw 'Initialization failed, check your App key and App secret';
                return;
            }
            av.applicationId = null;
            av.init({
                appKey: appKey,
                appSecret: appSecret,
            });
            av.ping().then(function (response) {
                console.log('Kinvey Ping Success. Kinvey Service is alive, version: ' + response.version + ', response: ' + response.kinvey);
            }).catch(function (error) {
                console.log('Kinvey Ping Failed. Response: ' + error.description);
            });
            _root.v = av;
            _root.dataStore = av.DataStore.collection('comments', av.DataStoreType.network);
            defaultComment.url = (option.path || location.pathname).replace(/index\.(html|htm)/, '');

        } catch (ex) {
            let issue = 'https://github.com/xCss/Valine/issues';
            if (_root.el) _root.nodata.show(`<pre style="color:red;text-align:left;">${ex}<br>Valine:<b>${_root.version}</b><br>Report：${issue}</pre>`);
            else console && console.log(`%c${ex}\n%cValine%c${_root.version} ${issue}`, 'color:red;', 'background:#000;padding:5px;line-height:30px;color:#fff;', 'background:#456;line-height:30px;padding:5px;color:#fff;');
            return;
        }

        let _mark = _root.el.querySelector('.vmark');
        // alert
        _root.alert = {
            /**
             * {
             *  type:0/1,
             *  text:'',
             *  ctxt:'',
             *  otxt:'',
             *  cb:fn
             * }
             *
             * @param {Object} o
             */
            show(o) {
                _mark.innerHTML = `<div class="valert txt-center"><div class="vtext">${o.text}</div><div class="vbtns"></div></div>`;
                let _vbtns = _mark.querySelector('.vbtns');
                let _cBtn = `<button class="vcancel vbtn">${o && o.ctxt || 'Check Again'}</button>`;
                let _oBtn = `<button class="vsure vbtn">${o && o.otxt || 'Continue'}</button>`;
                _vbtns.innerHTML = `${_cBtn}${o.type && _oBtn}`;
                _mark.querySelector('.vcancel').addEventListener('click', function (e) {
                    _root.alert.hide();
                });
                _mark.setAttribute('style', 'display:block;');
                if (o && o.type) {
                    let _ok = _mark.querySelector('.vsure');
                    Event.on('click', _ok, (e) => {
                        _root.alert.hide();
                        o.cb && o.cb();
                    });
                }
            },
            hide() {
                _mark.setAttribute('style', 'display:none;');
            }
        }

        // Bind Event
        _root.bind(option);
    }

    /**
     * Bind Event
     */
    bind(option) {
        let _root = this;
        let guest_info = (option.guest_info || GUEST_INFO).filter(item => GUEST_INFO.indexOf(item) > -1);

        let expandEvt = (el) => {
            if (el.offsetHeight > 180) {
                el.classList.add('expand');
                el.classList.add('en');
                Event.on('click', el, (e) => {
                    el.setAttribute('class', 'vcontent');
                })
            }
        }

        let commonQuery = (cb) => {
            let query = new _root.v.Query();
            query.equalTo('url', defaultComment['url']);
            query.descending('_kmd.ect');
            return query;
        }
        // let initPages = (cb) => {
        //     commonQuery().count().then(count => {
        //         if (count > 0) {
        //             let _vpage = _root.el.querySelector('.vpage');
        //             _root.el.querySelector('.count').innerHTML = `评论(<span class="num">${count}</span>)`;
        //         }
        //     }).catch(ex => {
        //         console.log(ex);
        //     })
        // }
        let query = (pageNo = 1) => {
            _root.loading.show();
            let cq = commonQuery();
            cq.limit = 1000;
            var stream = _root.dataStore.find(cq);
            stream.subscribe(entities => {
                let len = entities.length;
                if (len) {
                    _root.el.querySelector('.vlist').innerHTML = '';
                    for (let i = 0; i < len; i++) {
                        insertDom(entities[i], !0)
                    }
                    _root.el.querySelector('.count').innerHTML = `${len} Comment${len > 1 ? 's' : ''}`;
                }
                _root.loading.hide();
            }, error => {
                _root.loading.hide();
            }, () => {
            });
        }
        query();

        let insertDom = (ret, mt) => {

            let _vcard = document.createElement('li');
            _vcard.setAttribute('class', 'vcard');
            _vcard.setAttribute('id', ret._id);
            let _img = gravatar['hide'] ? '' : `<img class="vimg" src='${gravatar.cdn + md5(ret['mail'] || ret['nick']) + gravatar.params}'>`;
            _vcard.innerHTML = `${_img}<section><div class="vhead"><a rel="nofollow" href="${xssEscape.uriInDoubleQuotedAttr(getLink({
                link: ret['link'],
                mail: ret['mail']
            })) || 'javascript:void(0);'}" target="_blank" >${xssEscape.inHTMLData(ret["nick"])}</a> · <span class="vtime">${timeago().format(new Date(ret._kmd.ect))}</span></div><div class="vcontent">${marked(ret["comment"])}</div><div class="vfooter"><span rid='${xssEscape.inSingleQuotedAttr(ret._id)}' at='@${xssEscape.inSingleQuotedAttr(ret['nick'])}' mail='${xssEscape.inSingleQuotedAttr(ret['mail'])}' class="vat">Reply</span><div></section>`;
            let _vlist = _root.el.querySelector('.vlist');
            let _vlis = _vlist.querySelectorAll('li');
            let _vat = _vcard.querySelector('.vat');
            let _as = _vcard.querySelectorAll('a');
            for (let i = 0, len = _as.length; i < len; i++) {
                let item = _as[i];
                if (item && item.getAttribute('class') != 'at') {
                    item.setAttribute('target', '_blank');
                    item.setAttribute('rel', 'nofollow');
                }
            }
            if (mt) _vlist.appendChild(_vcard);
            else _vlist.insertBefore(_vcard, _vlis[0]);
            let _vcontent = _vcard.querySelector('.vcontent');
            expandEvt(_vcontent);
            bindAtEvt(_vat);

        }

        let mapping = {
            veditor: "comment"
        }
        for (let i = 0, length = guest_info.length; i < length; i++) {
            mapping[`v${guest_info[i]}`] = guest_info[i];
        }

        let inputs = {};
        for (let i in mapping) {
            if (mapping.hasOwnProperty(i)) {
                let _v = mapping[i];
                let _el = _root.el.querySelector(`.${i}`);
                inputs[_v] = _el;
                Event.on('input', _el, (e) => {
                    defaultComment[_v] = _v === 'comment' ? _el.value : xssEscape.inHTMLData(xssEscape.inDoubleQuotedAttr(_el.value));
                });
            }
        }

        // cache
        let getCache = () => {
            let s = store && store.ValineCache;
            if (s) {
                s = JSON.parse(s);
                let m = guest_info;
                for (let i in m) {
                    let k = m[i];
                    _root.el.querySelector(`.v${k}`).value = s[k];
                    defaultComment[k] = s[k];
                }
            }
        }
        getCache();


        let atData = {
            rmail: '',
            at: ''
        }

        // reset form
        let reset = () => {
            for (let i in mapping) {
                if (mapping.hasOwnProperty(i)) {
                    let _v = mapping[i];
                    let _el = _root.el.querySelector(`.${i}`);
                    _el.value = "";
                    defaultComment[_v] = "";
                }
            }
            atData['at'] = '';
            atData['rmail'] = '';
            defaultComment['rid'] = '';
            defaultComment['nick'] = 'Guest';
            getCache();
        }

        // submit
        let submitBtn = _root.el.querySelector('.vsubmit');
        let submitEvt = (e) => {
            // console.log(defaultComment)
            // return;
            if (submitBtn.getAttribute('disabled')) {
                _root.alert.show({
                    type: 0,
                    text: 'The request is still pending.',
                    ctxt: 'Wait'
                })
                return;
            }
            if (defaultComment.comment == '') {
                inputs['comment'].focus();
                return;
            }
            if (defaultComment.nick == '') {
                defaultComment['nick'] = 'Anonymous';
            }
            let idx = defaultComment.comment.indexOf(atData.at);
            if (idx > -1 && atData.at != '') {
                let at = `<a class="at" href='#${defaultComment.rid}'>${atData.at}</a>`;
                defaultComment.comment = defaultComment.comment.replace(atData.at, at);
            }
            // verify
            let mailRet = check.mail(defaultComment.mail);
            let linkRet = check.link(defaultComment.link);
            defaultComment['mail'] = mailRet.k ? mailRet.v : defaultComment['mail'];
            defaultComment['link'] = linkRet.k ? linkRet.v : defaultComment['link'];
            if (defaultComment['mail'] && defaultComment['link'] && !mailRet.k && !linkRet.k && guest_info.indexOf('mail') > -1 && guest_info.indexOf('link') > -1) {
                _root.alert.show({
                    type: 1,
                    text: 'Invalid site and email. Do you want to continue?',
                    cb() {
                        if (_root.notify || _root.verify) {
                            verifyEvt(commitEvt)
                        } else {
                            defaultComment['mail'] = defaultComment['link'] = "";
                            commitEvt();
                        }
                    }
                })
            } else if (defaultComment['mail'] && !mailRet.k && guest_info.indexOf('mail') > -1) {
                _root.alert.show({
                    type: 1,
                    text: 'Invalid email. Do you want to continue?',
                    cb() {
                        if (_root.notify || _root.verify) {
                            verifyEvt(commitEvt)
                        } else {
                            defaultComment['mail'] = "";
                            commitEvt();
                        }
                    }
                })
            } else if (defaultComment['link'] && !linkRet.k && guest_info.indexOf('link') > -1) {
                _root.alert.show({
                    type: 1,
                    text: 'Invalid site. Do you want to continue?',
                    cb() {
                        if (_root.notify || _root.verify) {
                            verifyEvt(commitEvt)
                        } else {
                            defaultComment['link'] = "";
                            commitEvt();
                        }
                    }
                })
            } else {
                if (_root.notify || _root.verify) {
                    verifyEvt(commitEvt)
                } else {
                    commitEvt();
                }
            }
        }

        let commitEvt = () => {
            submitBtn.setAttribute('disabled', !0);
            _root.loading.show();

            if (!_root.v.User.getActiveUser()) {
                _root.v.User.signup().then(commitEvt);
                return;
            }

            // 声明类型
            // 新建对象
            let comment = {};
            for (let i in defaultComment) {
                if (defaultComment.hasOwnProperty(i)) {
                    let _v = defaultComment[i];
                    comment[i] = _v;
                }
            }
            let acl = new _root.v.Acl(comment);
            acl.globallyReadable = true;
            acl.globallyWritable = false;
            _root.dataStore.save(comment).then((ret) => {
                defaultComment['nick'] != 'Guest' && store && store.setItem('ValineCache', JSON.stringify({
                    nick: defaultComment['nick'],
                    link: defaultComment['link'],
                    mail: defaultComment['mail']
                }));
                let _count = _root.el.querySelector('.num');
                let num = 1;
                try {

                    if (_count) {
                        num = Number(_count.innerText) + 1;
                        _count.innerText = num;
                    } else {
                        _root.el.querySelector('.count').innerHTML = '1 Comment'
                    }
                    insertDom(ret);

                    submitBtn.removeAttribute('disabled');
                    _root.loading.hide();
                    reset();
                } catch (error) {
                    console.log(error)
                }
            }).catch(() => {
                _root.loading.hide();
            })
        }

        let verifyEvt = (fn) => {
            let x = Math.floor((Math.random() * 10) + 1);
            let y = Math.floor((Math.random() * 10) + 1);
            let z = Math.floor((Math.random() * 10) + 1);
            let opt = ['+', '-', 'x'];
            let o1 = opt[Math.floor(Math.random() * 3)];
            let o2 = opt[Math.floor(Math.random() * 3)];
            let expre = `${x}${o1}${y}${o2}${z}`;
            let subject = `${expre} = <input class='vcode vinput' >`;
            _root.alert.show({
                type: 1,
                text: subject,
                ctxt: '取消',
                otxt: '确认',
                cb() {
                    let code = +_root.el.querySelector('.vcode').value;
                    let ret = (new Function(`return ${expre.replace(/x/g, '*')}`))();
                    if (ret === code) {
                        fn && fn();
                    } else {
                        _root.alert.show({
                            type: 1,
                            text: '(T＿T)这么简单都算错，也是没谁了',
                            ctxt: '伤心了，不回了',
                            otxt: '再试试?',
                            cb() {
                                verifyEvt(fn);
                                return;
                            }
                        })
                    }
                }
            })
        }


        // at event
        let bindAtEvt = (el) => {
            Event.on('click', el, (e) => {
                let at = el.getAttribute('at');
                let rid = el.getAttribute('rid');
                let rmail = el.getAttribute('mail');
                atData['at'] = at;
                atData['rmail'] = rmail;
                defaultComment['rid'] = rid;
                inputs['comment'].value = `${at} ，`;
                inputs['comment'].focus();
            })
        }

        Event.off('click', submitBtn, submitEvt);
        Event.on('click', submitBtn, submitEvt);


    }

}

// const loadAV = (cb) => {
//     let avjs = document.createElement('script');　　　
//     let _doc = document.querySelector('head');　
//     avjs.type = 'text/javascript';　　　　
//     avjs.async = 'async';　　　　
//     avjs.src = '//cdn1.lncld.net/static/js/3.0.4/av-min.js';　　　　
//     _doc.appendChild(avjs);　　　　
//     if (avjs.readyState) { //IE　　　　　　
//         avjs.onreadystatechange = function() {　　　　　　　　
//             if (avjs.readyState == 'complete' || avjs.readyState == 'loaded') {　　　　　　　　　　
//                 avjs.onreadystatechange = null;　　　　　　　　　　
//                 cb && cb();　　　　　　　　
//             }　　　　　　
//         }　　　　
//     } else { //非IE　　　　　　
//         avjs.onload = function() { cb && cb(); }　　　　
//     }
// }

const Event = {
    on(type, el, handler, capture) {
        if (el.addEventListener) el.addEventListener(type, handler, capture || false);
        else if (el.attachEvent) el.attachEvent(`on${type}`, handler);
        else el[`on${type}`] = handler;
    },
    off(type, el, handler, capture) {
        if (el.removeEventListener) el.removeEventListener(type, handler, capture || false);
        else if (el.detachEvent) el.detachEvent(`on${type}`, handler);
        else el[`on${type}`] = null;
    },
    // getEvent(e) {
    //     return e || window.event;
    // },
    // getTarget(e) {
    //     return e.target || e.srcElement;
    // },
    // preventDefault(e) {
    //     e = e || window.event;
    //     e.preventDefault && e.preventDefault() || (e.returnValue = false);
    // },
    // stopPropagation(e) {
    //     e = e || window.event;
    //     e.stopPropagation && e.stopPropagation() || (e.cancelBubble = !0);
    // }
}


const getLink = (target) => {
    return target.link || '';
}

const check = {
    mail(m) {
        return {
            k: /[\w-\.]+@([\w-]+\.)+[a-z]{2,3}/.test(m),
            v: m
        };
    },
    link(l) {
        l = l.length > 0 && (/^(http|https)/.test(l) ? l : `http://${l}`);
        return {
            k: /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/.test(l),
            v: l
        };
    }
}

module.exports = Valine;
