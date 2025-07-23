(async function () {
    const thisScript = document.currentScript;
    const ClientKey = thisScript.getAttribute('client-key');
    const DeviceKey = thisScript.getAttribute('device-key');
    console.log('Client Key:', ClientKey);

    if (ClientKey) {
        sessionStorage.setItem("client-key", ClientKey);
        sessionStorage.setItem("device-key", ClientKey);
        let host = window.location.hostname;
        try {
            fetch(encodeURI(host == "localhost" ? "http://localhost:3001/detaillivechat" : "https://wapi.naylatools.com/detaillivechat"), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ClientKey, DeviceKey, Domain: host }),
            }).then(response => response.text()).then(async (hasil) => {
                if (host === "localhost") console.log(hasil);
                let Data = JSON.parse(hasil);
                if (Data.status == "sukses") {
                    const ws = await connectWebSocket(ClientKey);
                    window.livechatSocket = ws;
                    let Setting = Data.Device.Setting;
                    document.documentElement.style.setProperty('--color-primary', Setting.color);
                    RendLiveChat(Setting);
                }
            })
        } catch (err) {
            console.error('WebSocket connection failed:', err);
        }
        // https://cdn.jsdelivr.net/gh/HeruPrasetia/cdn/livechat/livechat.js
    } else {
        console.warn('client-key attribute not found on script tag!');
    }
})();

function connectWebSocket(ClientKey) {
    return new Promise((resolve, reject) => {
        let url = window.location.hostname == "localhost" ? "ws://localhost:3003/" : "wss://ws.naylatools.com/";
        const ws = new WebSocket(`${url}?token=${encodeURIComponent(ClientKey)}&domain=${window.location.hostname}&usertype=Client`);

        ws.onopen = () => {
            console.log('WebSocket connected!');
            ws.send({ type: "getprofile" });
            resolve(ws);
        };

        ws.onerror = (err) => {
            console.error('WebSocket error:', err);
            reject(err);
        };

        ws.onclose = () => {
            console.warn('WebSocket closed');
        };

        ws.onmessage = (e) => {
            console.log('WebSocket message:', e.data);
        };
    });
}

function rendElm(opt) {
    let to = opt.to || null;

    function createElm(elmData) {
        let elm = document.createElement(elmData.elm);

        Object.keys(elmData).forEach(key => {
            if (key === "elm") return;

            if (key === "text") {
                elm.textContent = elmData.text;
            } else if (key === "html") {
                elm.innerHTML = elmData.html;
            } else if (key === "cls") {
                elm.className = elmData.cls;
            } else if (key === "attr") {
                for (let attr in elmData.attr) {
                    elm.setAttribute(attr, elmData.attr[attr]);
                }
            } else if (key === "selected" && elmData.selected === true) {
                elm.selected = true;
            } else if (key === "checked" && elmData.checked === true) {
                elm.checked = true;
            } else if (key === "style") {
                elm.style.cssText = elmData.style;
            } else if (key === "elms") {
                elmData.elms.forEach(childElmData => {
                    let childElm = createElm(childElmData);
                    elm.appendChild(childElm);
                });
            } else {
                elm.setAttribute(key, elmData[key]);
            }
        });

        return elm;
    }

    let fragment = document.createDocumentFragment();
    opt.elm.forEach(elmData => {
        let newElm = createElm(elmData);
        fragment.appendChild(newElm);
    });

    if (to) {
        let target = document.querySelector(to);
        if (target) {
            if (!opt.add) target.innerHTML = "";
            target.appendChild(fragment);
        }
    } else {
        let container = document.createElement("div");
        container.appendChild(fragment);
        return container.innerHTML;
    }
}

async function RendLiveChat(setting) {
    let TagStyle = document.createElement("link");
    TagStyle.rel = "stylesheet";
    TagStyle.type = "text/css";
    TagStyle.href = "https://cdn.jsdelivr.net/gh/HeruPrasetia/cdn/livechat/livechat.css";
    document.head.appendChild(TagStyle);

    rendElm({
        to: "body",
        add: true,
        elm: [
            {
                elm: "div",
                cls: "floating-btn bounce2",
                id: "chatToggleBtn",
                elms: [
                    setting.maskot == "none" ? { elm: "button", cls: "floating-btn" } : { elm: "img", src: setting.maskot, style: "width:100%" }
                ]
            },
            {
                elm: "div",
                cls: "floating-chat",
                id: "chatBox",
                style: "display:none;",
                elms: [
                    {
                        elm: "div",
                        cls: "chat-header",
                        text: setting.title
                    },
                    {
                        elm: "div",
                        cls: "chat-body",
                        id: "chatMessages",
                        elms: [
                            {
                                elm: "div",
                                cls: "chat-message chat-message-user",
                                text: "Halo, ada yang bisa dibantu?"
                            },
                            {
                                elm: "div",
                                cls: "chat-message chat-message-me",
                                text: "Ya, saya mau tanya..."
                            }
                        ]
                    },
                    {
                        elm: "div",
                        cls: "chat-input",
                        elms: [
                            {
                                elm: "input",
                                type: "text",
                                id: "chatInput",
                                placeholder: "Tulis pesan..."
                            },
                            {
                                elm: "button",
                                text: "Kirim",
                                id: "sendBtn"
                            }
                        ]
                    }
                ]
            }
        ]
    });

    document.addEventListener("click", function (e) {
        const chatBox = document.getElementById("chatBox");
        const toggleBtn = document.getElementById("chatToggleBtn");

        if (!chatBox || !toggleBtn) return;

        if (e.target.closest("#chatToggleBtn")) {
            chatBox.style.display = (chatBox.style.display === "none" || chatBox.style.display === "")
                ? "block"
                : "none";
        } else if (!chatBox.contains(e.target) && chatBox.style.display === "block") {
            chatBox.style.display = "none";
        }
    });

}