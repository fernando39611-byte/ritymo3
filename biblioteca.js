
const batidas = [
    {
        nome: "Trap Beat 01",
        estilo: "Trap",
        bpm: 140,
        arquivo: "sons/trap01.mp3"
    },
    {
        nome: "Lo-Fi Relax 01",
        estilo: "Lo-Fi",
        bpm: 85,
        arquivo: "sons/lofi01.mp3"
    },
    {
        nome: "Funk Beat 01",
        estilo: "Funk",
        bpm: 130,
        arquivo: "sons/funk01.mp3"
    }
];

const biblioteca = document.getElementById("listaBatidas");

batidas.forEach((batida) => {
    const card = document.createElement("article");
    card.className = "card-batida";

    card.innerHTML = `
        <div class="capa-batida">♫</div>

        <h3>${batida.nome}</h3>
        <p>${batida.estilo} • ${batida.bpm} BPM</p>

        <audio controls preload="none">
            <source src="${batida.arquivo}" type="audio/mpeg">
            Seu navegador não suporta áudio.
        </audio>

        <a
            class="botao-download"
            href="${batida.arquivo}"
            download
        >
            ⬇ Baixar batida
        </a>
    `;

    biblioteca.appendChild(card);
});
