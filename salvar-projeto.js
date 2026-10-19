
const botaoSalvar = document.getElementById("salvarProjeto");

botaoSalvar.addEventListener("click", function () {
    const nomeInput = document.getElementById("nomeProjeto");
    const nomeProjeto = nomeInput.value.trim();

    if (nomeProjeto === "") {
        alert("Digite o nome do seu projeto!");
        return;
    }

    const projeto = {
        nome: nomeProjeto,
        data: new Date().toLocaleDateString("pt-BR"),
        bpm: document.getElementById("bpm")?.value || 120,
        passos: Array.from(
            document.querySelectorAll("#beatGrid .instrument-row")
        ).map((linha) => ({
            instrumento: linha.querySelector(".instrument-name")?.textContent,
            ativos: Array.from(linha.querySelectorAll(".step"))
                .map((passo, indice) =>
                    passo.classList.contains("active") ? indice : null
                )
                .filter((indice) => indice !== null)
        }))
    };

    const conteudo = JSON.stringify(projeto, null, 2);

    const arquivo = new Blob(
        [conteudo],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");

    link.href = url;
    link.download = nomeProjeto.replace(/[<>:"/\\|?*]/g, "_") + ".json";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    alert("Projeto baixado com sucesso!");
});
