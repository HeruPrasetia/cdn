(async function () {
    const thisScript = document.currentScript;
    const clientKey = thisScript.getAttribute('client-key');
    console.log('Client Key:', clientKey);

    if (clientKey) {
        sessionStorage.setItem("client-key", clientKey);

        try {
            const ws = await connectWebSocket(clientKey);
            window.livechatSocket = ws;
            RendLiveChat(clientKey);
        } catch (err) {
            console.error('WebSocket connection failed:', err);
        }

    } else {
        console.warn('client-key attribute not found on script tag!');
    }
})();

function connectWebSocket(clientKey) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://ws.naylatools.com/?token=' + encodeURIComponent(clientKey));

        ws.onopen = () => {
            console.log('WebSocket connected!');
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

async function RendLiveChat() {
    let TagStyle = document.createElement("link");
    TagStyle.rel = "stylesheet";
    TagStyle.type = "text/css";
    TagStyle.href = "https://cdn.jsdelivr.net/gh/HeruPrasetia/cdn@master/livechat.css";
    document.head.appendChild(TagStyle);

    rendElm({
        to: "body",
        add: true,
        elm: [
            {
                elm: "div",
                cls: "floating-btn bounce2",
                id: "chatToggleBtn",
                text: "💬"
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
                        text: "Live Chat"
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

        if (e.target === toggleBtn) {
            chatBox.style.display = (chatBox.style.display === "none" || chatBox.style.display === "")
                ? "block"
                : "none";
        } else if (!chatBox.contains(e.target) && chatBox.style.display === "block") {
            chatBox.style.display = "none";
        }
    });
}