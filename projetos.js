
document.addEventListener("DOMContentLoaded", function () {
    const botaoSalvar = document.getElementById("savebutton");
    const botaoAbrir = document.getElementById("loadbutton");
    const campoNome = document.getElementById("projetoNome");
    const campoBpm = document.getElementById("bpm");
    const beatGrid = document.getElementById("beatGrid");
    const arquivoProjeto = document.getElementById("arquivoProjeto");
    const audioImportado = document.getElementById("audioImportado");

    if (!botaoSalvar || !botaoAbrir || !campoNome ||
        !campoBpm || !beatGrid || !arquivoProjeto) {
        console.error("Confira os IDs do HTML do Studio.");
        return;
    }

    // Lê os instrumentos e os 16 passos de cada linha.
    function capturarProjeto() {
        const linhas = Array.from(
            beatGrid.querySelectorAll(".instrument-row")
        );

        return {
            versao: 1,
            nome: campoNome.value.trim(),
            bpm: Math.max(40, Math.min(240, Number(campoBpm.value) || 120)),
            instrumentos: linhas.map(function (linha) {
                return {
                    nome: linha.querySelector(".instrument-name").textContent,
                    passos: Array.from(
                        linha.querySelectorAll(".step")
                    ).map(function (passo) {
                        return passo.classList.contains("active");
                    })
                };
            })
        };
    }

    function nomeArquivo(nome) {
        return nome
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
            .replace(/[. ]+$/g, "")
            .trim() || "Meu Beat";
    }

    // Faz o navegador baixar um arquivo.
    function baixarArquivo(blob, nome) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = nome;
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(function () {
            URL.revokeObjectURL(url);
        }, 60000);
    }

    // Reproduz o mesmo tipo de som sintético do sequenciador.
    function somBumbo(ctx, tempo) {
        const osc = ctx.createOscillator();
        const ganho = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(150, tempo);
        osc.frequency.exponentialRampToValueAtTime(45, tempo + 0.12);

        ganho.gain.setValueAtTime(0.8, tempo);
        ganho.gain.exponentialRampToValueAtTime(0.001, tempo + 0.18);

        osc.connect(ganho);
        ganho.connect(ctx.destination);
        osc.start(tempo);
        osc.stop(tempo + 0.2);
    }

    function somRuido(ctx, tempo, duracao, volumeInicial, frequencia) {
        const tamanho = Math.ceil(ctx.sampleRate * duracao);
        const buffer = ctx.createBuffer(1, tamanho, ctx.sampleRate);
        const dados = buffer.getChannelData(0);

        for (let i = 0; i < tamanho; i++) {
            dados[i] = Math.random() * 2 - 1;
        }

        const fonte = ctx.createBufferSource();
        const filtro = ctx.createBiquadFilter();
        const ganho = ctx.createGain();

        fonte.buffer = buffer;
        filtro.type = "highpass";
        filtro.frequency.value = frequencia;

        ganho.gain.setValueAtTime(volumeInicial, tempo);
        ganho.gain.exponentialRampToValueAtTime(
            0.001,
            tempo + duracao
        );

        fonte.connect(filtro);
        filtro.connect(ganho);
        ganho.connect(ctx.destination);

        fonte.start(tempo);
        fonte.stop(tempo + duracao);
    }

    function tocarSomExportado(ctx, indice, tempo) {
        if (indice === 0) {
            somBumbo(ctx, tempo);
        } else if (indice === 1) {
            somRuido(ctx, tempo, 0.18, 0.45, 700);
        } else if (indice === 2) {
            somRuido(ctx, tempo, 0.045, 0.22, 7000);
        } else if (indice === 3) {
            somRuido(ctx, tempo, 0.12, 0.3, 1500);
        }
    }

    // Converte o áudio renderizado em WAV PCM de 16 bits.
    function converterParaWav(buffer) {
        const canais = buffer.numberOfChannels;
        const amostras = buffer.length;
        const bytesPorAmostra = 2;
        const alinhamento = canais * bytesPorAmostra;
        const tamanhoDados = amostras * alinhamento;

        const arquivo = new ArrayBuffer(44 + tamanhoDados);
        const view = new DataView(arquivo);

        function escreverTexto(offset, texto) {
            for (let i = 0; i < texto.length; i++) {
                view.setUint8(offset + i, texto.charCodeAt(i));
            }
        }

        escreverTexto(0, "RIFF");
        view.setUint32(4, 36 + tamanhoDados, true);
        escreverTexto(8, "WAVE");
        escreverTexto(12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, canais, true);
        view.setUint32(24, buffer.sampleRate, true);
        view.setUint32(28, buffer.sampleRate * alinhamento, true);
        view.setUint16(32, alinhamento, true);
        view.setUint16(34, 16, true);
        escreverTexto(36, "data");
        view.setUint32(40, tamanhoDados, true);

        const dadosCanais = [];

        for (let canal = 0; canal < canais; canal++) {
            dadosCanais.push(buffer.getChannelData(canal));
        }

        let posicao = 44;

        for (let i = 0; i < amostras; i++) {
            for (let canal = 0; canal < canais; canal++) {
                let amostra = Math.max(
                    -1,
                    Math.min(1, dadosCanais[canal][i])
                );

                amostra = amostra < 0
                    ? amostra * 32768
                    : amostra * 32767;

                view.setInt16(posicao, amostra, true);
                posicao += 2;
            }
        }

        return new Blob([arquivo], { type: "audio/wav" });
    }

    // Renderiza quatro compassos do beat em um WAV.
    async function gerarWav(projeto) {
        const AudioOffline =
            window.OfflineAudioContext ||
            window.webkitOfflineAudioContext;

        if (!AudioOffline) {
            throw new Error("Este navegador não suporta exportação de áudio.");
        }

        const bpm = projeto.bpm;
        const passosPorCompasso = 16;
        const compassos = 4;
        const duracao = compassos * 60 * 4 / bpm;
        const taxaAmostragem = 44100;

        const contexto = new AudioOffline(
            2,
            Math.ceil(duracao * taxaAmostragem),
            taxaAmostragem
        );

        const intervalo = 60 / bpm / 4;

        for (let passo = 0; passo < passosPorCompasso * compassos; passo++) {
            const passoDaGrade = passo % passosPorCompasso;
            const tempo = passo * intervalo + 0.01;

            projeto.instrumentos.forEach(function (instrumento, indice) {
                if (instrumento.passos[passoDaGrade]) {
                    tocarSomExportado(contexto, indice, tempo);
                }
            });
        }

        const renderizado = await contexto.startRendering();
        return converterParaWav(renderizado);
    }

    // Salva o áudio WAV e o arquivo editável JSON.
    botaoSalvar.addEventListener("click", async function () {
        const projeto = capturarProjeto();

        if (!projeto.nome) {
            alert("Digite o nome do projeto antes de salvar!");
            campoNome.focus();
            return;
        }

        if (!projeto.instrumentos.length) {
            alert("Não encontrei as grades do sequenciador.");
            return;
        }

        botaoSalvar.disabled = true;
        botaoSalvar.textContent = "Gerando arquivos...";

        try {
            const base = nomeArquivo(projeto.nome);

            const wav = await gerarWav(projeto);
            baixarArquivo(wav, base + ".wav");

            // O JSON guarda as informações para continuar editando.
            const json = new Blob(
                [JSON.stringify(projeto, null, 2)],
                { type: "application/json;charset=utf-8" }
            );

            // Pequeno intervalo para facilitar dois downloads seguidos.
            await new Promise(resolve => setTimeout(resolve, 300));
            baixarArquivo(json, base + ".json");

            alert(
                `Projeto "${projeto.nome}" exportado!\n\n` +
                `Arquivos: ${base}.wav e ${base}.json`
            );
        } catch (erro) {
            console.error("Erro ao exportar projeto:", erro);
            alert("Não foi possível exportar. Confira o console do navegador.");
        } finally {
            botaoSalvar.disabled = false;
            botaoSalvar.textContent = "Salvar Projeto";
        }
    });

    // Abrir um projeto editável JSON ou ouvir um WAV.
    botaoAbrir.addEventListener("click", function () {
        arquivoProjeto.click();
    });

    arquivoProjeto.addEventListener("change", async function () {
        const arquivo = arquivoProjeto.files[0];

        if (!arquivo) return;

        try {
            if (arquivo.name.toLowerCase().endsWith(".json")) {
                const projeto = JSON.parse(await arquivo.text());

                if (
                    !projeto ||
                    !Array.isArray(projeto.instrumentos) ||
                    !Number.isFinite(Number(projeto.bpm))
                ) {
                    throw new Error("Arquivo de projeto inválido.");
                }

                const linhas = Array.from(
                    beatGrid.querySelectorAll(".instrument-row")
                );

                if (projeto.instrumentos.length !== linhas.length) {
                    throw new Error(
                        "Este projeto tem instrumentos diferentes dos do Studio."
                    );
                }

                // Validar antes de alterar as grades.
                for (let i = 0; i < linhas.length; i++) {
                    const passos = projeto.instrumentos[i].passos;

                    if (!Array.isArray(passos) || passos.length !== 16) {
                        throw new Error("Os passos do projeto são inválidos.");
                    }
                }

                projeto.instrumentos.forEach(function (instrumento, indice) {
                    const quadrados = linhas[indice].querySelectorAll(".step");

                    instrumento.passos.forEach(function (ativo, passo) {
                        quadrados[passo].classList.toggle("active", Boolean(ativo));
                        quadrados[passo].setAttribute(
                            "aria-pressed",
                            String(Boolean(ativo))
                        );
                    });
                });

                campoNome.value = String(projeto.nome || arquivo.name.replace(/\.json$/i, ""));
                campoBpm.value = Math.max(
                    40,
                    Math.min(240, Number(projeto.bpm) || 120)
                );

                audioImportado.replaceChildren();
                alert(`Projeto "${campoNome.value}" carregado! Agora você pode editar e tocar.`);
            } else if (
                arquivo.name.toLowerCase().endsWith(".wav") ||
                arquivo.type === "audio/wav" ||
                arquivo.type === "audio/x-wav"
            ) {
                const url = URL.createObjectURL(arquivo);
                const player = document.createElement("audio");

                player.controls = true;
                player.src = url;
                player.style.display = "block";
                player.style.maxWidth = "100%";

                audioImportado.replaceChildren(player);

                campoNome.value = arquivo.name.replace(/\.wav$/i, "");
                alert(
                    "Áudio carregado! Use o player para ouvir.\n" +
                    "Para editar as grades, abra o arquivo JSON correspondente."
                );
            } else {
                alert("Selecione um arquivo WAV ou JSON do Ritymo.");
            }
        } catch (erro) {
            console.error("Erro ao abrir arquivo:", erro);
            alert("Não foi possível abrir esse arquivo: " + erro.message);
        } finally {
            arquivoProjeto.value = "";
        }
    });
});
