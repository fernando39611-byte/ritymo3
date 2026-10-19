
document.addEventListener("DOMContentLoaded", function () {

    // 1. Encontrar os elementos do HTML
    const beatGrid = document.getElementById("beatGrid");
    const botaoTocar = document.getElementById("tocar");
    const botaoParar = document.getElementById("parar");
    const campoBpm = document.getElementById("bpm");

    if (!beatGrid) {
        console.error("Erro: não encontrei #beatGrid no HTML.");
        return;
    }

    // 2. Criar as grades dos instrumentos
    const instrumentos = ["Bumbo", "Caixa", "Chimbal", "Palmas"];
    const linhas = [];

    // Evita duplicar as grades caso o código seja executado novamente
    beatGrid.innerHTML = "";

    instrumentos.forEach(function (instrumento) {

        const linha = document.createElement("div");
        linha.className = "instrument-row";

        const nome = document.createElement("span");
        nome.className = "instrument-name";
        nome.textContent = instrumento;

        const passos = document.createElement("div");
        passos.className = "steps";

        const quadrados = [];

        for (let i = 0; i < 16; i++) {
            const quadrado = document.createElement("button");

            quadrado.type = "button";
            quadrado.className = "step";
            quadrado.setAttribute(
                "aria-label",
                instrumento + ", passo " + (i + 1)
            );
            quadrado.setAttribute("aria-pressed", "false");

            quadrado.addEventListener("click", function () {
                quadrado.classList.toggle("active");

                quadrado.setAttribute(
                    "aria-pressed",
                    String(quadrado.classList.contains("active"))
                );
            });

            passos.appendChild(quadrado);
            quadrados.push(quadrado);
        }

        linha.appendChild(nome);
        linha.appendChild(passos);
        beatGrid.appendChild(linha);

        linhas.push(quadrados);
    });

    // 3. Configurar o áudio
    let audio = null;
    let temporizador = null;
    let passoAtual = 0;
    let proximoTempo = 0;

    async function prepararAudio() {
        if (!audio) {
            const AudioContextClasse =
                window.AudioContext || window.webkitAudioContext;

            if (!AudioContextClasse) {
                throw new Error("Seu navegador não suporta Web Audio API.");
            }

            audio = new AudioContextClasse();
        }

        if (audio.state === "suspended") {
            await audio.resume();
        }
    }

    // 4. Som do bumbo
    function tocarBumbo(tempo) {
        const oscilador = audio.createOscillator();
        const volume = audio.createGain();

        oscilador.type = "sine";

        oscilador.frequency.setValueAtTime(150, tempo);
        oscilador.frequency.exponentialRampToValueAtTime(
            45,
            tempo + 0.12
        );

        volume.gain.setValueAtTime(0.8, tempo);
        volume.gain.exponentialRampToValueAtTime(
            0.001,
            tempo + 0.18
        );

        oscilador.connect(volume);
        volume.connect(audio.destination);

        oscilador.start(tempo);
        oscilador.stop(tempo + 0.2);
    }

    // 5. Criar sons usando ruído
    function tocarRuido(tempo, duracao, volumeInicial, frequenciaFiltro) {
        const tamanho = Math.ceil(audio.sampleRate * duracao);

        const buffer = audio.createBuffer(
            1,
            tamanho,
            audio.sampleRate
        );

        const dados = buffer.getChannelData(0);

        for (let i = 0; i < tamanho; i++) {
            dados[i] = Math.random() * 2 - 1;
        }

        const fonte = audio.createBufferSource();
        const ganho = audio.createGain();
        const filtro = audio.createBiquadFilter();

        fonte.buffer = buffer;

        filtro.type = "highpass";
        filtro.frequency.value = frequenciaFiltro;

        ganho.gain.setValueAtTime(volumeInicial, tempo);
        ganho.gain.exponentialRampToValueAtTime(
            0.001,
            tempo + duracao
        );

        fonte.connect(filtro);
        filtro.connect(ganho);
        ganho.connect(audio.destination);

        fonte.start(tempo);
        fonte.stop(tempo + duracao);
    }

    // 6. Escolher qual instrumento tocar
    function tocarInstrumento(indice, tempo) {
        if (indice === 0) {
            tocarBumbo(tempo);
        } else if (indice === 1) {
            tocarRuido(tempo, 0.18, 0.45, 700);
        } else if (indice === 2) {
            tocarRuido(tempo, 0.045, 0.22, 7000);
        } else if (indice === 3) {
            tocarRuido(tempo, 0.12, 0.3, 1500);
        }
    }

    // 7. Programar os passos no tempo certo
    function agendarPassos() {
        if (!audio || !campoBpm) return;

        while (proximoTempo < audio.currentTime + 0.1) {
            const passo = passoAtual;

            linhas.forEach(function (quadrados, indice) {
                if (quadrados[passo].classList.contains("active")) {
                    tocarInstrumento(indice, proximoTempo);
                }
            });

            passoAtual = (passoAtual + 1) % 16;

            let bpm = Number(campoBpm.value) || 120;
            bpm = Math.max(40, Math.min(240, bpm));

            // Cada quadrado representa uma semicolcheia
            proximoTempo += 60 / bpm / 4;
        }
    }

    // 8. Botão Tocar
    if (botaoTocar && botaoParar && campoBpm) {

        botaoTocar.addEventListener("click", async function () {
            if (temporizador !== null) return;

            try {
                await prepararAudio();

                passoAtual = 0;
                proximoTempo = audio.currentTime + 0.05;

                temporizador = setInterval(function () {
                    agendarPassos();
                }, 25);

            } catch (erro) {
                console.error("Erro ao iniciar o áudio:", erro);
            }
        });

        // 9. Botão Parar
        botaoParar.addEventListener("click", function () {
            if (temporizador !== null) {
                clearInterval(temporizador);
                temporizador = null;
            }

            passoAtual = 0;
        });

    } else {
        console.warn(
            "As grades foram criadas, mas confira os IDs tocar, parar e bpm no HTML."
        );
    }

});

document.addEventListener("DOMContentLoaded", function () {

    // 1. Encontrar os elementos do HTML
    const beatGrid = document.getElementById("beatGrid");
    const botaoTocar = document.getElementById("tocar");
    const botaoParar = document.getElementById("parar");
    const campoBpm = document.getElementById("bpm");

    if (!beatGrid) {
        console.error("Erro: não encontrei #beatGrid no HTML.");
        return;
    }

    // 2. Criar as grades dos instrumentos
    const instrumentos = ["Bumbo", "Caixa", "Chimbal", "Palmas"];
    const linhas = [];

    // Evita duplicar as grades caso o código seja executado novamente
    beatGrid.innerHTML = "";

    instrumentos.forEach(function (instrumento) {

        const linha = document.createElement("div");
        linha.className = "instrument-row";

        const nome = document.createElement("span");
        nome.className = "instrument-name";
        nome.textContent = instrumento;

        const passos = document.createElement("div");
        passos.className = "steps";

        const quadrados = [];

        for (let i = 0; i < 16; i++) {
            const quadrado = document.createElement("button");

            quadrado.type = "button";
            quadrado.className = "step";
            quadrado.setAttribute(
                "aria-label",
                instrumento + ", passo " + (i + 1)
            );
            quadrado.setAttribute("aria-pressed", "false");

            quadrado.addEventListener("click", function () {
                quadrado.classList.toggle("active");

                quadrado.setAttribute(
                    "aria-pressed",
                    String(quadrado.classList.contains("active"))
                );
            });

            passos.appendChild(quadrado);
            quadrados.push(quadrado);
        }

        linha.appendChild(nome);
        linha.appendChild(passos);
        beatGrid.appendChild(linha);

        linhas.push(quadrados);
    });

    // 3. Configurar o áudio
    let audio = null;
    let temporizador = null;
    let passoAtual = 0;
    let proximoTempo = 0;

    async function prepararAudio() {
        if (!audio) {
            const AudioContextClasse =
                window.AudioContext || window.webkitAudioContext;

            if (!AudioContextClasse) {
                throw new Error("Seu navegador não suporta Web Audio API.");
            }

            audio = new AudioContextClasse();
        }

        if (audio.state === "suspended") {
            await audio.resume();
        }
    }

    // 4. Som do bumbo
    function tocarBumbo(tempo) {
        const oscilador = audio.createOscillator();
        const volume = audio.createGain();

        oscilador.type = "sine";

        oscilador.frequency.setValueAtTime(150, tempo);
        oscilador.frequency.exponentialRampToValueAtTime(
            45,
            tempo + 0.12
        );

        volume.gain.setValueAtTime(0.8, tempo);
        volume.gain.exponentialRampToValueAtTime(
            0.001,
            tempo + 0.18
        );

        oscilador.connect(volume);
        volume.connect(audio.destination);

        oscilador.start(tempo);
        oscilador.stop(tempo + 0.2);
    }

    // 5. Criar sons usando ruído
    function tocarRuido(tempo, duracao, volumeInicial, frequenciaFiltro) {
        const tamanho = Math.ceil(audio.sampleRate * duracao);

        const buffer = audio.createBuffer(
            1,
            tamanho,
            audio.sampleRate
        );

        const dados = buffer.getChannelData(0);

        for (let i = 0; i < tamanho; i++) {
            dados[i] = Math.random() * 2 - 1;
        }

        const fonte = audio.createBufferSource();
        const ganho = audio.createGain();
        const filtro = audio.createBiquadFilter();

        fonte.buffer = buffer;

        filtro.type = "highpass";
        filtro.frequency.value = frequenciaFiltro;

        ganho.gain.setValueAtTime(volumeInicial, tempo);
        ganho.gain.exponentialRampToValueAtTime(
            0.001,
            tempo + duracao
        );

        fonte.connect(filtro);
        filtro.connect(ganho);
        ganho.connect(audio.destination);

        fonte.start(tempo);
        fonte.stop(tempo + duracao);
    }

    // 6. Escolher qual instrumento tocar
    function tocarInstrumento(indice, tempo) {
        if (indice === 0) {
            tocarBumbo(tempo);
        } else if (indice === 1) {
            tocarRuido(tempo, 0.18, 0.45, 700);
        } else if (indice === 2) {
            tocarRuido(tempo, 0.045, 0.22, 7000);
        } else if (indice === 3) {
            tocarRuido(tempo, 0.12, 0.3, 1500);
        }
    }

    // 7. Programar os passos no tempo certo
    function agendarPassos() {
        if (!audio || !campoBpm) return;

        while (proximoTempo < audio.currentTime + 0.1) {
            const passo = passoAtual;

            linhas.forEach(function (quadrados, indice) {
                if (quadrados[passo].classList.contains("active")) {
                    tocarInstrumento(indice, proximoTempo);
                }
            });

            passoAtual = (passoAtual + 1) % 16;

            let bpm = Number(campoBpm.value) || 120;
            bpm = Math.max(40, Math.min(240, bpm));

            // Cada quadrado representa uma semicolcheia
            proximoTempo += 60 / bpm / 4;
        }
    }

    // 8. Botão Tocar
    if (botaoTocar && botaoParar && campoBpm) {

        botaoTocar.addEventListener("click", async function () {
        console.log("O botão Tocar foi clicado!");
        alert("O botão Tocar está funcionando!");
            if (temporizador !== null) return;

            try {
                await prepararAudio();

                passoAtual = 0;
                proximoTempo = audio.currentTime + 0.05;

                temporizador = setInterval(function () {
                    agendarPassos();
                }, 25);

            } catch (erro) {
                console.error("Erro ao iniciar o áudio:", erro);
            }
        });

        // 9. Botão Parar
        botaoParar.addEventListener("click", function () {
            if (temporizador !== null) {
                clearInterval(temporizador);
                temporizador = null;
            }

            passoAtual = 0;
        });

    } else {
        console.warn(
            "As grades foram criadas, mas confira os IDs tocar, parar e bpm no HTML."
        );
          console.error("Erro no teste de áudio:", erro);
    }

});
