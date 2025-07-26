let __DataChat = [], typingTimeout = false, __Setting = {}, host = window.location.hostname;

(async function () {
    const thisScript = document.currentScript;
    const ClientKey = thisScript.getAttribute('client-key');
    const DeviceKey = thisScript.getAttribute('device-key');
    const DomainServer = thisScript.getAttribute('domain-server');
    if (ClientKey) {
        let TagStyle = document.createElement("link");
        TagStyle.rel = "stylesheet";
        TagStyle.type = "text/css";
        TagStyle.href = host == "localhost" ? "./livechat.css" : "https://cdn.jsdelivr.net/gh/HeruPrasetia/cdn/livechat/livechat.css";
        document.head.appendChild(TagStyle);
        let div = document.createElement("div");
        div.id = "divLiveChat";
        document.body.appendChild(div);
        let Toast = document.createElement("div");
        Toast.id = "DivToastLC";
        Toast.className = "toast";
        document.body.appendChild(Toast);
        sessionStorage.setItem("client-key", ClientKey);
        sessionStorage.setItem("device-key", DeviceKey);
        sessionStorage.setItem("domain-server", DomainServer);
        let FirstCome = sessionStorage.getItem("FirstCome") || "YA";
        if (FirstCome == "YA") sessionStorage.setItem("FirstCome", Date.now());
        try {
            fetch(encodeURI(host == "localhost" ? "http://localhost:3001/detaillivechat" : "https://wapi.naylatools.com/detaillivechat"), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ClientKey, DeviceKey, FirstCome, Domain: host }),
            }).then(response => response.text()).then(async (hasil) => {
                let Data = JSON.parse(hasil);
                if (Data.status == "sukses") {
                    __Setting = Data.Device.Setting;
                    document.documentElement.style.setProperty('--color-primary', __Setting.color);
                    RendLiveChat();
                }
            })
        } catch (err) {
            console.error('WebSocket connection failed:', err);
        }
    } else {
        console.warn('client-key attribute not found on script tag!');
    }
})();

function GI(id) {
    return document.getElementById(id);
}

function playSound() {
    const audio = new Audio("https://wapi.naylatools.com/file/bell.mp3");
    audio.play().catch(e => console.warn("Gagal play sound:", e));
}

function connectWebSocket(ClientKey) {
    return new Promise((resolve, reject) => {
        let url = window.location.hostname == "localhost" ? "ws://localhost:3003/" : "wss://ws.naylatools.com/";
        const ws = new WebSocket(`${url}?token=${ClientKey}&domain=${sessionStorage.getItem("domain-server")}&usertype=Client&devicekey=${sessionStorage.getItem("device-key")}`);

        ws.onopen = () => {
            console.log('WebSocket connected!');
            ws.send(JSON.stringify({ type: "list chat client" }));
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
            document.getElementById('chatToggleBtn').classList.add("bounce2");
            let data = JSON.parse(e.data);
            let type = data.type;
            if (type == "detail chat client") {
                __DataChat = data.data;
                handleRendBuble();
                scrollToBottom();
            } else if (type == "pesan dari admin") {
                playSound();
                __DataChat.push(data);
                addBubble(data);
                scrollToBottom();
            }
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
    let UserToken = sessionStorage.getItem("TokenUserLC");
    if (UserToken) {
        rendElm({
            to: "#divLiveChat",
            add: false,
            elm: [
                {
                    elm: "div", cls: "floating-btn", id: "chatToggleBtn", elms: [
                        __Setting.maskot == "none" ? { elm: "img", src: "https://wapi.naylatools.com/file/DefaultLiveChatMaskot.png", style: "width:100%" } : { elm: "img", src: "https://wapi.naylatools.com/file/" + __Setting.maskot, style: "width:100%" }
                    ]
                },
                {
                    elm: "div", cls: "floating-chat", id: "chatBox", style: "display:none;", elms: [
                        { elm: "div", cls: "chat-header", text: __Setting.title },
                        { elm: "div", cls: "chat-body", id: "chatMessages" },
                        {
                            elm: "div", cls: "chat-input", elms: [
                                { elm: "input", type: "text", cls: "form-input", id: "chatInput", placeholder: "Tulis pesan..." },
                                { elm: "button", text: "Kirim", cls: "btn-chat", id: "sendBtn" }
                            ]
                        }
                    ]
                }
            ]
        });

        const ws = await connectWebSocket(UserToken);
        window.ws = ws;

        GI("chatInput").addEventListener("keydown", (e) => {
            if (e.key === 'Enter') {
                this.handleSend();
                if (this.typingTimeout) clearTimeout(typingTimeout);
                window.ws.send(JSON.stringify({ type: "stop_typing_client" }));
            } else {
                window.ws.send(JSON.stringify({ type: "typing" }));

                if (this.typingTimeout) clearTimeout(this.typingTimeout);
                this.typingTimeout = setTimeout(() => {
                    window.ws.send(JSON.stringify({ type: "stop_typing_client" }));
                }, 1500);
            }
        })
        GI('sendBtn').addEventListener("click", () => handleSend());
    } else {
        rendElm({
            to: "#divLiveChat",
            add: false,
            elm: [
                {
                    elm: "div", cls: "floating-btn", id: "chatToggleBtn", elms: [
                        __Setting.maskot == "none" ? { elm: "img", src: "https://wapi.naylatools.com/file/DefaultLiveChatMaskot.png", style: "width:100%" } : { elm: "img", src: "http://" + host + ":3001/file/" + __Setting.maskot, style: "width:100%" }
                    ]
                },
                {
                    elm: "div", cls: "floating-chat", id: "chatBox", style: "display:none;", elms: [
                        { elm: "div", cls: "chat-header", text: __Setting.title },
                        {
                            elm: "div", id: "chatMessages", style: "padding:10px", elms: [
                                { elm: "label", text: "Silahkan masukan data anda" },
                                { elm: "p" },
                                {
                                    elm: "div", cls: "form-group", elms: [
                                        { elm: "label", text: "Nama" },
                                        { elm: "input", type: "text", cls: "form-input", id: "edtNama", placeholder: "Masukan Nama" },
                                    ]
                                },
                                {
                                    elm: "div", cls: "form-group", elms: [
                                        { elm: "label", text: "ALamat Email" },
                                        { elm: "input", type: "email", cls: "form-input", id: "edtEmail", placeholder: "Masukan Alamat Email" },
                                    ]
                                },
                                {
                                    elm: "div", cls: "form-group", elms: [
                                        { elm: "label", text: "No WHatsApp" },
                                        { elm: "input", type: "text", cls: "form-input", id: "edtTelp", placeholder: "Masukan No WhatsApp" },
                                    ]
                                },
                                {
                                    elm: "button", cls: "btn-chat", id: "btnLogin", style: "width:100%; display:flex;  justify-content: center; align-items: center;", elms: [
                                        {
                                            elm: "div", cls: "typing-indicator", id: "divLoading", style: "display:none", elms: [
                                                { elm: "span" },
                                                { elm: "span" },
                                                { elm: "span" },
                                            ]
                                        },
                                        { elm: "span", text: "Mulai Chat" }
                                    ]
                                },
                            ]
                        }
                    ]
                }
            ]
        });

        GI("btnLogin").addEventListener("click", async (e) => {
            try {
                let Nama = GI("edtNama").value;
                if (Nama == "") return showToast("Silahkan isi Nama anda");

                let Email = GI("edtEmail").value;
                if (Email == "") return showToast("Silahkan isi Alamat Email anda");

                let Telp = GI("edtTelp").value;
                if (Telp == "") return showToast("Silahkan isi no WhatsApp anda");

                let btn = e.target;
                btn.disabled = true;
                let load = GI("divLoading");
                load.style.display = "flex";
                fetch(encodeURI(host == "localhost" ? "http://localhost:3001/loginlivechat" : "https://wapi.naylatools.com/loginlivechat"), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ Nama, Email, Telp, ClientKey: sessionStorage.getItem("client-key"), DeviceKey: sessionStorage.getItem("device-key"), Domain: host }),
                }).then(response => response.text()).then(async (hasil) => {
                    if (host === "localhost") console.log(hasil);
                    let Data = JSON.parse(hasil);
                    if (Data.status == "sukses") {
                        sessionStorage.setItem("TokenUserLC", Data.token);
                        const ws = await connectWebSocket(Data.Token);
                        window.ws = ws;
                        btn.disabled = false;
                        load.style.display = "none";
                        rendElm({
                            to: "#chatBox",
                            add: false,
                            elm: [
                                { elm: "div", cls: "chat-header", text: __Setting.title },
                                { elm: "div", cls: "chat-body", id: "chatMessages" },
                                {
                                    elm: "div", cls: "chat-input", elms: [
                                        { elm: "input", type: "text", cls: "form-input", id: "chatInput", placeholder: "Tulis pesan..." },
                                        { elm: "button", text: "Kirim", cls: "btn-chat", id: "sendBtn" }
                                    ]
                                }
                            ]
                        });

                        GI("chatInput").addEventListener("keydown", (e) => {
                            if (e.key === 'Enter') {
                                this.handleSend();
                                if (this.typingTimeout) clearTimeout(typingTimeout);
                                window.ws.send(JSON.stringify({ type: "stop_typing_client" }));
                            } else {
                                window.ws.send(JSON.stringify({ type: "typing" }));

                                if (this.typingTimeout) clearTimeout(this.typingTimeout);
                                this.typingTimeout = setTimeout(() => {
                                    window.ws.send(JSON.stringify({ type: "stop_typing_client" }));
                                }, 1500);
                            }
                        })
                        GI('sendBtn').addEventListener("click", () => handleSend());
                    }
                })
            } catch (err) {
                console.error('WebSocket connection failed:', err);
                btn.disabled = false;
                load.style.display = "none";
            }
        })
    }

    document.addEventListener("click", function (e) {
        const chatBox = GI("chatBox");
        const toggleBtn = GI("chatToggleBtn");

        if (!chatBox || !toggleBtn) return;

        if (e.target.closest("#chatToggleBtn")) {
            chatBox.style.display = (chatBox.style.display === "none" || chatBox.style.display === "")
                ? "block"
                : "none";
            GI('chatToggleBtn').classList.remove("bounce2");
        } else if (!chatBox.contains(e.target) && chatBox.style.display === "block") {
            chatBox.style.display = "none";
        }
    });
}

function showToast(message, duration = 3000) {
    const toast = document.getElementById("DivToastLC");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, duration);
}


const tanggalIndo = function (data, time = false) {
    let d = new Date(data);
    if (isNaN(d.getTime())) return '';

    let year = d.getFullYear();
    let month = ('0' + (d.getMonth() + 1)).slice(-2);
    let day = ('0' + d.getDate()).slice(-2);

    let hasil = [year, month, day].join('-');
    if (hasil === "0000-00-00" || hasil == null) return hasil;

    const BulanIndo = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

    let tgl = hasil.substring(8, 10);
    let bln = hasil.substring(5, 7);
    let thn = hasil.substring(2, 4);

    let result = `${tgl} ${BulanIndo[parseInt(bln, 10) - 1]} ${thn}`;

    if (time === true) {
        let jam = ('0' + d.getHours()).slice(-2);
        let menit = ('0' + d.getMinutes()).slice(-2);
        let detik = ('0' + d.getSeconds()).slice(-2);
        result += ` ${jam}:${menit}:${detik}`;
    }

    return result;
};

function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: 'smooth' // biar smooth scroll
        });
    }
}

function handleSend() {
    let pesan = GI('chatInput').value;
    if (pesan == "") return;
    __DataChat.push({ UserType: "Client", Pesan: pesan, Waktu: Date.now() });
    window.ws.send(JSON.stringify({ type: "pesan ke admin", pesan }));
    GI("chatInput").value = "";
    addBubble({ UserType: "Client", Pesan: pesan, Waktu: Date.now() });
    scrollToBottom();
}

function handleRendBuble() {
    rendElm({
        to: "#chatMessages", add: false, elm: __DataChat.map((div, i) => {
            return ({
                elm: "div",
                cls: div.UserType == "Client" ? "chat-message chat-message-user" : "chat-message chat-message-me",
                elms: [
                    { elm: "span", text: div.Pesan, style: "font-size:15px" },
                    { elm: "br" },
                    { elm: "b", style: "font-size:10px", text: tanggalIndo(div.Waktu, true) }
                ]
            })
        })
    })
}

function addBubble(div) {
    rendElm({
        to: "#chatMessages", add: true, elm: [{
            elm: "div",
            cls: div.UserType == "Client" ? "chat-message chat-message-user" : "chat-message chat-message-me",
            elms: [
                { elm: "span", text: div.Pesan, style: "font-size:15px" },
                { elm: "br" },
                { elm: "b", style: "font-size:10px", text: tanggalIndo(div.Waktu, true) }
            ]
        }]
    })
}