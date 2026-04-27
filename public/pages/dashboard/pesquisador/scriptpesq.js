import {
    getAllUserCommentsByDate,
    getAllUserGeneralComments,
    getUser,
} from "../../../db/getters.js";
import { auth } from "../../../db/firebase.js";
import {
    signOut,
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import runMicrogrid, {
    bat_efficiency_list,
    bat_cap_cost_list,
    bat_lf_list,
    bat_cycle_list,
} from "../../../js/run_microgrid.js";
import {
    deleteGeneralUserComment,
    deleteUserCommentByDate,
    saveGeneralUserComment,
    saveUserCommentByDate,
} from "../../../db/setters.js";

document.addEventListener("DOMContentLoaded", async () => {
    const profileImg = document.getElementById("profile-img");
    const userNameElement = document.querySelector(".user-name");
    const logoutButton = document.getElementById("logout");

    // Autenticação
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userData = await getUser(user.uid);

            if (userData) {
                userNameElement.textContent = userData.nome;
                profileImg.src =
                    userData.photoURL || "../../../assets/perfil.png";
            } else {
                userNameElement.textContent = "Convidado";
                profileImg.src = "../../../assets/perfil.png";
            }
        } else {
            userNameElement.textContent = "Convidado";
            profileImg.src = "../../../assets/perfil.png";
        }
    });

    // Logout
    logoutButton.addEventListener("click", async () => {
        try {
            window.location.href = "../../../index.html";
            await signOut(auth);
        } catch (error) {
            console.error("Erro ao deslogar:", error);
        }
    });
});

/* =============================================================
   LÓGICA DO MENU DE PERFIL (TOGGLE)
   ============================================================= */
const userContainer = document.querySelector(".user-container");
const profileDropdown = document.querySelector(".dropdown-menu");

if (userContainer && profileDropdown) {
    userContainer.addEventListener("click", (e) => {
        // Alterna a classe que mostra o menu
        profileDropdown.classList.toggle("show-profile");

        // Impede que o clique se propague imediatamente e feche o menu se tiver um listener na window
        e.stopPropagation();
    });
}

// Fechar o menu se clicar fora dele
window.addEventListener("click", (e) => {
    if (profileDropdown && profileDropdown.classList.contains("show-profile")) {
        if (!userContainer.contains(e.target)) {
            profileDropdown.classList.remove("show-profile");
        }
    }
});


/*==================== RESPONSIVIDADE DROPDOWN (MOBILE/TABLET) ====================*/
// Seleciona todos os dropdowns da sidebar
const navDropdowns = document.querySelectorAll(".nav-dropdown");

navDropdowns.forEach((dropdown) => {
    // Seleciona o link principal (ex: Energia, Bateria)
    const dropdownLink = dropdown.querySelector(".nav-link");

    dropdownLink.addEventListener("click", (e) => {
        // Verifica se é um dispositivo móvel/tablet (largura <= 1024px conforme seu CSS)
        if (window.innerWidth <= 1024) {
            // Previne o comportamento padrão (pular para a âncora) se preferir que apenas abra o menu
            // e.preventDefault();

            // Alterna a classe 'expanded' para abrir/fechar
            dropdown.classList.toggle("expanded");

            // Opcional: Fechar outros dropdowns abertos para focar apenas neste
            navDropdowns.forEach((otherDropdown) => {
                if (otherDropdown !== dropdown) {
                    otherDropdown.classList.remove("expanded");
                }
            });
        }
    });
});

/*==================== RODANDO SIMULAÇÃO ====================*/

document.addEventListener("DOMContentLoaded", function () {
    const runButton = document.querySelector(".run_btn");
    const runButtonText = document.querySelector(".run_btn_text");
    const configButtons = document.querySelector(".config_buttons");
    const confirmButton = document.getElementById("confirm_button");
    const pauseButton = document.getElementById("pause_button");
    const runningSimStatus = document.getElementById("running_sim_status");
    const valorContainer = document.querySelectorAll(".valor-container");
    const batteryButton = document.getElementById("battery_button");

    let fixedValues = { turbines: null, panels: null };
    let valuesBeforePause = { turbines: null, panels: null };
    const fixedIcons = {
        turbines: document.getElementById("fixedTurbines"),
        panels: document.getElementById("fixedPanelGen"),
    };

    let isPaused = false;
    let isRunning = false;
    let selectedIteration = 10;
    let selectedPeriod = 8640; // 12 meses (8640 horas)
    let selectedBattery = 0; // LAG AGM (0)

    const periodMapping = {
        "1 semana": 168,
        "2 semanas": 336,
        "1 mês": 720,
        "3 meses": 2160,
        "6 meses": 4320,
        "9 meses": 6480,
        "12 meses": 8640,
    };

    function updateBatteryInfo(index) {
        const eff = parseFloat((bat_efficiency_list[index] * 100).toFixed(2))
            .toString()
            .replace(".", ",");
        const cost = bat_cap_cost_list[index].toFixed(2).replace(".", ",");
        const lf = bat_lf_list[index];
        const cycles = bat_cycle_list[index];

        const effEl = document.getElementById("bat_eff");
        const costEl = document.getElementById("bat_cost");
        const lfEl = document.getElementById("bat_lf");
        const cyclesEl = document.getElementById("bat_cycles");

        if (effEl) effEl.innerText = `${eff}%`;
        if (costEl) costEl.innerText = cost;
        if (lfEl) lfEl.innerText = lf;
        if (cyclesEl) cyclesEl.innerText = cycles;
    }

    // Monta os botões de seleção de período e iterações
    function setupDropdown(buttonId, dropdownId) {
        const button = document.getElementById(buttonId);
        const dropdown = document.getElementById(dropdownId);

        function toggleDropdown(event) {
            event.stopPropagation();
            if (buttonId === "battery_button" && isRunning && !isPaused) {
                return;
            }
            dropdown.style.display =
                dropdown.style.display === "block" ? "none" : "block";
        }

        function closeDropdown(event) {
            if (
                !button.contains(event.target) &&
                !dropdown.contains(event.target)
            ) {
                dropdown.style.display = "none";
            }
        }

        // Remove event listeners antes de adicionar novos
        button.removeEventListener("click", toggleDropdown);
        document.removeEventListener("click", closeDropdown);

        // Adiciona os eventos corretamente
        button.addEventListener("click", toggleDropdown);
        document.addEventListener("click", closeDropdown);

        dropdown.querySelectorAll(".dropdown_item").forEach((item) => {
            item.addEventListener("click", function () {
                const newValue = item.dataset.value;

                if (buttonId === "battery_button") {
                    button.innerText = item.innerText;
                    selectedBattery = parseInt(newValue);
                    updateBatteryInfo(selectedBattery);
                } else {
                    button.innerText =
                        button.innerText.split(":")[0] + ": " + newValue + " ▼";

                    if (buttonId === "iterations_button") {
                        selectedIteration = parseInt(newValue);
                    } else {
                        selectedPeriod = periodMapping[newValue];
                    }
                }

                dropdown.style.display = "none";
            });
        });
    }

    // Configura os dropdowns apenas uma vez
    setupDropdown("iterations_button", "iterations_dropdown");
    setupDropdown("period_button", "period_dropdown");
    setupDropdown("battery_button", "battery_dropdown");
    updateBatteryInfo(0); // Atualiza com os valores iniciais

    runButton.addEventListener("click", function () {
        configButtons.style.display =
            configButtons.style.display === "flex" ? "none" : "flex";
    });

    confirmButton.addEventListener("click", function () {
        configButtons.style.display = "none";
        pauseButton.style.display = "flex";
        fixedValues = { turbines: null, panels: null };
        valuesBeforePause = { turbines: null, panels: null };
        Object.values(fixedIcons).forEach(
            (icon) => (icon.style.display = "none"),
        );
        runSimulation();
    });

    pauseButton.addEventListener("click", () => {
        isPaused = !isPaused;
        const metricas = document.querySelectorAll(".metrica-texto .valor");
        const gifs = document.querySelectorAll(".loadingGif");

        if (isPaused) {
            // Ao pausar
            pauseButton.innerHTML = "<h3>Continuar</h3>";
            runButtonText.innerHTML = "Simulação pausada";
            gifs.forEach((gif) => (gif.style.display = "none"));
            batteryButton.classList.remove("running");

            // Mantém os ícones de fixado visíveis se o valor já estiver fixado
            Object.keys(fixedValues).forEach((key) => {
                if (fixedValues[key] === null) {
                    fixedIcons[key].style.display = "none";
                } else {
                    fixedIcons[key].style.display = "inline";
                }
            });

            // Salva os valores exatos que estão na tela antes de torná-los editáveis
            valuesBeforePause.turbines = metricas[3].innerText
                .trim()
                .replace(/\s*kW$/, "");
            valuesBeforePause.panels = metricas[4].innerText
                .trim()
                .replace(/\s*kW$/, "");

            // Torna editáveis apenas se não estiverem fixos
            [3, 4].forEach((i) => {
                const key = i === 3 ? "turbines" : "panels";
                if (fixedValues[key] === null) {
                    const valorAtual = metricas[i].innerText
                        .trim()
                        .split(" ")[0];
                    metricas[i].innerHTML =
                        `<span class="editavel-numero" contenteditable="true">${valorAtual}</span>` +
                        ' <span class="sufixo-unidade">kW</span>';
                }
            });
        } else {
            // Ao despausar
            pauseButton.innerHTML = "<h3>Pausar</h3>";
            batteryButton.classList.add("running");

            // Para cada campo, verifica se o valor foi alterado pelo usuário
            // Se foi alterado, atualiza o 'fixedValues'. Se não, não faz nada.

            // TURBINAS (índice 3)
            if (fixedValues.turbines === null) {
                const turbinasSpan =
                    metricas[3].querySelector(".editavel-numero");
                if (turbinasSpan) {
                    const novoValorStr = turbinasSpan.innerText.trim();
                    if (novoValorStr !== valuesBeforePause.turbines) {
                        const novoValorNum = parseInt(
                            novoValorStr.replace(/[^\d]/g, ""),
                        );
                        if (!isNaN(novoValorNum)) {
                            fixedValues.turbines = Math.max(
                                10,
                                Math.min(150, novoValorNum),
                            );
                        }
                    }
                    const valorFinal =
                        fixedValues.turbines !== null
                            ? fixedValues.turbines
                            : novoValorStr;
                    metricas[3].innerText = valorFinal + " kW";
                }
            }

            // GERAÇÃO (índice 4)
            if (fixedValues.panels === null) {
                const geracaoSpan =
                    metricas[4].querySelector(".editavel-numero");
                if (geracaoSpan) {
                    const novoValorStr = geracaoSpan.innerText.trim();
                    if (novoValorStr !== valuesBeforePause.panels) {
                        const novoValorNum = parseInt(
                            novoValorStr.replace(/[^\d]/g, ""),
                        );
                        if (!isNaN(novoValorNum)) {
                            fixedValues.panels = Math.max(
                                10,
                                Math.min(150, novoValorNum),
                            );
                        }
                    }
                    const valorFinal =
                        fixedValues.panels !== null
                            ? fixedValues.panels
                            : novoValorStr;
                    metricas[4].innerText = valorFinal + " kW";
                }
            }

            // Atualiza a visibilidade dos ícones de "fixado" e dos GIFs
            Object.keys(fixedValues).forEach((key) => {
                if (fixedValues[key] !== null) {
                    fixedIcons[key].style.display = "inline";
                } else {
                    fixedIcons[key].style.display = "none"; // Garante que sumam se não estiverem fixos
                }
            });

            gifs.forEach((gif, index) => {
                const isFixed =
                    (index === 3 && fixedValues.turbines !== null) ||
                    (index === 4 && fixedValues.panels !== null);
                if (index < 3 || !isFixed) {
                    gif.style.display = "inline";
                }
            });
        }
    });

    // Roda a simulação: Chama o CDEEPSO e preenche os cards das métricas após a execução
    async function runSimulation() {
        isRunning = true;
        let metricas = document.querySelectorAll(".metrica-texto .valor");
        let gifs = document.querySelectorAll(".loadingGif");

        let texts = [
            "Rodando simulação.",
            "Rodando simulação..",
            "Rodando simulação...",
        ];
        let textIndex = 0;
        let interval;

        try {
            // Escurece fundo dos lugares onde ficam as métricas, indicando que está executando a simulação.
            valorContainer.forEach((container) => {
                container.style.backgroundColor = "#4D4D4D";
                container.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
            });

            // Desabilita botão durante a simulação
            runButton.disabled = true;
            runButton.style.opacity = "0.5";
            runButton.style.cursor = "not-allowed";
            batteryButton.classList.add("running");

            // Animação do botão
            runningSimStatus.innerText = `Rodando iteração 1/${selectedIteration}`;
            interval = setInterval(() => {
                if (isPaused) {
                    runButtonText.innerHTML = "Simulação pausada";
                } else {
                    runButtonText.innerHTML = texts[textIndex];
                    textIndex = (textIndex + 1) % texts.length;
                }
            }, 500);

            // Esconde os valores e mostra GIFs de carregamento
            metricas.forEach((el) => (el.style.display = "none"));
            metricas.forEach((el) => el.classList.remove("temp")); // limpa antes
            gifs.forEach((gif) => (gif.style.display = "inline"));

            // Dá tempo ao navegador para renderizar os GIFs na tela antes de iniciar o processamento pesado
            await new Promise((resolve) => setTimeout(resolve, 10));

            let resultado = await runMicrogrid(
                selectedIteration,
                selectedBattery,
                () => isPaused,
                () => fixedValues,
                () => selectedBattery,
                (data) => {
                    runningSimStatus.innerText = `Rodando iteração ${Math.min(data.iteration + 2, selectedIteration)}/${selectedIteration}`;
                    let valores = [
                        (data.rf * 100).toFixed(2).replace(".", ",") + "%",
                        (data.meef * 100).toFixed(2).replace(".", ",") + "%",
                        "R$" + data.lcoe.toFixed(3).replace(".", ",") + "/kWh",
                        data.max_wind + " kW",
                        data.max_pan + " kW",
                    ];
                    metricas.forEach((el, index) => {
                        if (
                            isPaused &&
                            (index === 3 || index === 4) &&
                            fixedValues[index === 3 ? "turbines" : "panels"] ===
                                null
                        ) {
                            return; // Se estiver pausado e não fixado, não sobrescreve a edição
                        }
                        el.style.display = "inline";
                        if (index === 3 && fixedValues.turbines !== null) {
                            el.innerText = fixedValues.turbines + " kW";
                        } else if (index === 4 && fixedValues.panels !== null) {
                            el.innerText = fixedValues.panels + " kW";
                        } else {
                            el.innerText = valores[index];
                        }
                        el.classList.remove("temp");
                    });
                    gifs.forEach((gif, index) => {
                        if (index === 3 && fixedValues.turbines !== null) {
                            gif.style.display = "none";
                        }
                        if (index === 4 && fixedValues.panels !== null) {
                            gif.style.display = "none";
                        }
                    });
                },
            );
            localStorage.setItem("simulationData", JSON.stringify(resultado));
        } catch (error) {
            console.error("Erro ao rodar a simulação:", error);
            localStorage.clear();
            metricas.forEach((el) => (el.innerText = "Erro"));
        } finally {
            isRunning = false;
            clearInterval(interval);

            valorContainer.forEach((container) => {
                container.style.backgroundColor = "transparent";
                container.style.boxShadow = "none";
            });
            pauseButton.style.display = "none";
            runningSimStatus.innerText = "";
            runButtonText.innerHTML = "Rodar simulação";
            runButton.disabled = false;
            runButton.style.opacity = "1";
            runButton.style.cursor = "pointer";
            batteryButton.classList.remove("running");

            gifs.forEach((gif) => (gif.style.display = "none"));

            // Esconde os ícones de "fixado" no final da simulação
            Object.values(fixedIcons).forEach(
                (icon) => (icon.style.display = "none"),
            );

            let simulationData = JSON.parse(
                localStorage.getItem("simulationData"),
            );

            // Preenche cards de métricas
            if (simulationData) {
                let valores = [
                    (simulationData.rf * 100).toFixed(2).replace(".", ",") +
                        "%",
                    (simulationData.meef * 100).toFixed(2).replace(".", ",") +
                        "%",
                    "R$" +
                        simulationData.lcoe.toFixed(3).replace(".", ",") +
                        "/kWh",
                    simulationData.max_wind + " kW",
                    simulationData.max_pan + " kW",
                ];

                metricas.forEach((el, index) => {
                    el.style.display = "inline";
                    el.innerText = valores[index];
                    el.classList.remove("temp"); // removendo opacidade
                });

                if (simulationData.chartData) {
                    updateChartsWithData(simulationData.chartData, true);
                }
            }
        }
    }
});

// Recuperar valores das métricas ao recarregar a página
window.addEventListener("load", () => {
    if (!localStorage) return;

    let savedData = JSON.parse(localStorage.getItem("simulationData"));
    let metricas = document.querySelectorAll(".metrica-texto .valor");
    if (savedData) {
        metricas[0].innerText =
            (savedData.rf * 100).toFixed(2).replace(".", ",") + "%";
        metricas[1].innerText =
            (savedData.meef * 100).toFixed(2).replace(".", ",") + "%";
        metricas[2].innerText =
            "R$" + savedData.lcoe.toFixed(3).replace(".", ",") + "/kWh";
        metricas[3].innerText = savedData.max_wind + " kW";
        metricas[4].innerText = savedData.max_pan + " kW";
    }
});

/*==================== BOTÕES DE SEÇÃO DE GRÁFICOS ====================*/
document.addEventListener("DOMContentLoaded", () => {
    const btnEnergia = document.getElementById("btn_section_energia");
    const btnBateria = document.getElementById("btn_section_bateria");
    const btnSerieTemp = document.getElementById("btn_section_serietemp");

    const contentEnergia = document.getElementById("section_energia_content");
    const contentBateria = document.getElementById("section_bateria_content");
    const contentSerieTemp = document.getElementById(
        "section_serietemp_content",
    );

    const buttons = [btnEnergia, btnBateria, btnSerieTemp];
    const contents = [contentEnergia, contentBateria, contentSerieTemp];

    function switchSection(activeIndex) {
        buttons.forEach((btn, index) => {
            if (btn && contents[index]) {
                if (index === activeIndex) {
                    btn.classList.add("active");
                    contents[index].style.display = "block";
                } else {
                    btn.classList.remove("active");
                    contents[index].style.display = "none";
                }
            }
        });
        // Disparar o evento de redimensionamento da janela ajuda a forçar a
        // atualização de largura dos gráficos ApexCharts renderizados em divs que estavam ocultas.
        window.dispatchEvent(new Event("resize"));
        setTimeout(() => {
            window.dispatchEvent(new Event("resize"));
        }, 50);
    }

    if (btnEnergia)
        btnEnergia.addEventListener("click", () => switchSection(0));
    if (btnBateria)
        btnBateria.addEventListener("click", () => switchSection(1));
    if (btnSerieTemp)
        btnSerieTemp.addEventListener("click", () => switchSection(2));
});

/*==================== DROPDOWNS DOS GRÁFICOS (Mês e 6M) ====================*/

document.addEventListener("DOMContentLoaded", () => {
    const dropdownButtons = document.querySelectorAll(".meses");

    dropdownButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();

            const dropdownContent = btn.nextElementSibling;

            closeAllChartDropdowns(dropdownContent);

            if (dropdownContent) {
                dropdownContent.classList.toggle("show");
            }
        });
    });

    window.addEventListener("click", (e) => {
        if (!e.target.matches(".meses")) {
            closeAllChartDropdowns(null);
        }
    });

    function closeAllChartDropdowns(exceptThisOne) {
        const allDropdowns = document.querySelectorAll(".mes");
        allDropdowns.forEach((dropdown) => {
            if (dropdown !== exceptThisOne) {
                dropdown.classList.remove("show");
            }
        });
    }
});

/*==================== COMENTÁRIO POR DATA ====================*/

// adicionar um comentário para um ponto específico
function addAnnotationToChart(xDate, comment, chart, options) {
    const time = new Date(xDate).getTime();

    // encontrar o índice do timestamp mais próximo no array de categorias
    const closestIndex = options.xaxis.categories.reduce(
        (prevIndex, currTimestamp, index) => {
            return Math.abs(currTimestamp - time) <
                Math.abs(options.xaxis.categories[prevIndex] - time)
                ? index
                : prevIndex;
        },
        0,
    );

    // adicionar anotação no ponto exato do gráfico correspondente
    chart.addPointAnnotation({
        x: options.xaxis.categories[closestIndex], // timestamp exato do gráfico
        y: options.series[0].data[closestIndex], // valor correspondente no eixo Y
        label: {
            text: comment,
            style: {
                background: "#ff4560",
                color: "#fff",
            },
        },
        marker: {
            size: 6,
            fillColor: "#ff4560",
        },
    });
}

/* ==================== COMENTÁRIO POR DATA ==================== */
document.addEventListener("DOMContentLoaded", async function () {
    try {
        await loadData();
        function setupCommentSection(
            buttonId,
            commentSectionId,
            commentInputId,
            chart,
            options,
            name,
        ) {
            const buttonElement = document.querySelector(buttonId);
            if (!buttonElement) return;

            var selectedDate = null;
            const commentSection = document.querySelector(commentSectionId);
            const commentInput = document.querySelector(commentInputId);

            // inicializar flatpickr no botão específico
            const calendar = flatpickr(buttonId, {
                minDate: "2004-02-01", // data mínima
                maxDate: "2005-02-03", // data máxima
                position: "above", // exibir calendário sobre o botão
                clickOpens: false, // tirando a abertura automática porque o clique no botão pode ser pra fechar a caixa de comentário
                disable: [
                    function (date) {
                        return !(date.getDate() % 31); // desabilitar dias 31
                    },
                ],
                onOpen: function (selectedDates, dateStr, instance) {
                    if (commentSection.style.display === "flex") {
                        commentSection.style.display = "none";
                        instance.close();
                        commentInput.value = "";
                        calendar = instance;
                    }
                },
                onChange: function (selectedDates) {
                    selectedDate = selectedDates[0].toISOString().split("T")[0]; // armazenar a data selecionada em formato YYYY-MM-DD
                    const commentSection =
                        document.querySelector(commentSectionId);
                    const commentInput = document.querySelector(commentInputId);

                    commentSection.style.display = "flex"; // mostrar a caixa de comentário
                    commentInput.focus();
                },
            });

            buttonElement.addEventListener("click", function (e) {
                e.stopPropagation();

                // Se a caixa de texto estiver visível, fecha ela e NÃO abre o calendário
                if (commentSection.style.display === "flex") {
                    commentSection.style.display = "none";
                    commentInput.value = "";
                } else {
                    // Se a caixa estiver fechada, abre o calendário manualmente
                    calendar.open();
                }
            });

            async function handleKeyDown(event) {
                if (event.key === "Enter" && selectedDate) {
                    event.preventDefault();

                    var comment = commentInput.value.trim();

                    if (comment !== "") {
                        // adicionar no gráfico
                        if (chart) {
                            addAnnotationToChart(
                                selectedDate,
                                comment,
                                chart,
                                options,
                            );
                        }

                        // salvar o comentário no firestore
                        await saveUserCommentByDate(
                            commentSectionId,
                            comment,
                            selectedDate,
                        );

                        document.getElementById(
                            `delete_date_container_${name}`,
                        ).style.display = "flex";
                        document.getElementById(
                            `delete_date_${name}`,
                        ).style.display = "block";
                        document.querySelector(commentSectionId).style.display =
                            "none";
                        commentInput.value = "";
                    }
                }
            }
            commentInput.addEventListener("keydown", handleKeyDown);
        }

        const commentSections = [
            {
                selectId: "#select_date_demanda",
                commentSectionId: "#comment_section_demanda",
                commentInputId: "#comment_input_demanda",
                chart: chartDemanda,
                options: optionsDemanda,
                name: "demanda",
            },
            {
                selectId: "#select_date_fotoXDemanda",
                commentSectionId: "#comment_section_fotoXDemanda",
                commentInputId: "#comment_input_fotoXDemanda",
                chart: chartFotoXDemanda,
                options: optionsFotoXDemanda,
                name: "fotoXDemanda",
            },
            {
                selectId: "#select_date_eolicaXDemanda",
                commentSectionId: "#comment_section_eolicaXDemanda",
                commentInputId: "#comment_input_eolicaXDemanda",
                chart: chartEolicaXDemanda,
                options: optionsEolicaXDemanda,
                name: "eolicaXDemanda",
            },
            {
                selectId: "#select_date_desempenho",
                commentSectionId: "#comment_section_desempenho",
                commentInputId: "#comment_input_desempenho",
                chart: chartDesempenho,
                options: optionsDesempenho,
                name: "desempenho",
            },
            {
                selectId: "#select_date_energiaComprada",
                commentSectionId: "#comment_section_energiaComprada",
                commentInputId: "#comment_input_energiaComprada",
                chart: chartEnergiaComprada,
                options: optionsEnergiaComprada,
                name: "energiaComprada",
            },
            {
                selectId: "#select_date_energiaCreditada",
                commentSectionId: "#comment_section_energiaCreditada",
                commentInputId: "#comment_input_energiaCreditada",
                chart: chartEnergiaCreditada,
                options: optionsEnergiaCreditada,
                name: "energiaCreditada",
            },
            {
                selectId: "#select_date_energiaCompensada",
                commentSectionId: "#comment_section_energiaCompensada",
                commentInputId: "#comment_input_energiaCompensada",
                chart: chartEnergiaCompensada,
                options: optionsEnergiaCompensada,
                name: "energiaCompensada",
            },
            {
                selectId: "#select_date_energiaDescartada",
                commentSectionId: "#comment_section_energiaDescartada",
                commentInputId: "#comment_input_energiaDescartada",
                chart: chartEnergiaDescartada,
                options: optionsEnergiaDescartada,
                name: "energiaDescartada",
            },
            {
                selectId: "#select_date_cargaBateria",
                commentSectionId: "#comment_section_cargaBateria",
                commentInputId: "#comment_input_cargaBateria",
                chart: chartCargaBateria,
                options: optionsCargaBateria,
                name: "cargaBateria",
            },
            {
                selectId: "#select_date_bateria",
                commentSectionId: "#comment_section_bateria",
                commentInputId: "#comment_input_bateria",
                chart: chartBateria,
                options: optionsBateria,
                name: "bateria",
            },
            {
                selectId: "#select_date_stsolar",
                commentSectionId: "#comment_section_stsolar",
                commentInputId: "#comment_input_stsolar",
                chart: chartSTSolar,
                options: optionsSTSolar,
                name: "stsolar",
            },
            {
                selectId: "#select_date_stvento",
                commentSectionId: "#comment_section_stvento",
                commentInputId: "#comment_input_stvento",
                chart: chartSTVento,
                options: optionsSTVento,
                name: "stvento",
            },
        ];

        commentSections.forEach(
            ({
                selectId,
                commentSectionId,
                commentInputId,
                chart,
                options,
                name,
            }) => {
                setupCommentSection(
                    selectId,
                    commentSectionId,
                    commentInputId,
                    chart,
                    options,
                    name,
                );
            },
        );
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
});

/*==================== COMENTÁRIO GERAL ====================*/
document.addEventListener("DOMContentLoaded", function () {
    function setupGeneralComment(section) {
        const gcWindow = document.getElementById(`gc_window_${section}`);
        if (!gcWindow) return;

        const textarea = document.getElementById(`gc_input_${section}`);
        const openButton = document.getElementById(`open_gc_${section}`);
        const editButton = document.getElementById(`edit_gc_${section}`);
        const deleteButton = document.getElementById(`delete_gc_${section}`);
        const saveButton = document.getElementById(`save_gc_${section}`);
        const warningText = document.querySelector(`#gc_warning_${section}`);
        let savedComment = "";

        function showWarning(message) {
            warningText.textContent = message;
            warningText.style.opacity = "1";
            warningText.style.transition = "opacity 0.5s";

            setTimeout(() => {
                warningText.style.opacity = "0";
            }, 3000);
        }

        // ajustar a altura da janela com base na altura do textarea
        function adjustWindowHeight() {
            const newHeight = textarea.offsetHeight + 20; // Adiciona padding extra
            gcWindow.style.height = `${newHeight}px`;
        }

        // colocar o foco no textarea e mover o cursor para o final
        function focusTextarea() {
            textarea.focus();
            textarea.selectionStart = textarea.value.length;
            textarea.selectionEnd = textarea.value.length;
        }

        // mostrar/esconder janela
        openButton.addEventListener("click", function () {
            if (
                gcWindow.style.display === "none" ||
                gcWindow.style.display === ""
            ) {
                gcWindow.style.display = "flex";
            } else {
                gcWindow.style.display = "none";
            }
        });

        // Evento no botão de alterar: foco no textarea
        editButton.addEventListener("click", function () {
            focusTextarea();
        });

        // Evento no botão de deletar: alerta de confirmação e deletar o texto
        deleteButton.addEventListener("click", async function () {
            if (textarea.value) {
                const confirmDelete = confirm(
                    "Tem certeza que deseja deletar o texto?",
                );
                if (confirmDelete) {
                    textarea.value = "";
                    savedComment = "";
                    adjustWindowHeight(); // Ajusta a altura da janela após deletar

                    // Chama a função para remover do Firestore
                    await deleteGeneralUserComment(section);
                    showWarning("Texto deletado com sucesso.");
                }
            }
        });

        // Evento no botão de salvar: remove o foco do textarea
        saveButton.addEventListener("click", async function () {
            savedComment = textarea.value.trim();
            if (!savedComment) return;

            await saveGeneralUserComment(section, savedComment);
            textarea.blur();
            showWarning("Texto salvo com sucesso.");
        });

        // Ajustar a altura da janela dinamicamente ao digitar ou redimensionar
        textarea.addEventListener("input", adjustWindowHeight);
        textarea.addEventListener("mouseup", adjustWindowHeight);
    }

    const sections = [
        { section: "Demanda" },
        { section: "FotoXDemanda" },
        { section: "EolicaXDemanda" },
        { section: "Desempenho" },
        { section: "EnergiaComprada" },
        { section: "EnergiaCreditada" },
        { section: "EnergiaCompensada" },
        { section: "EnergiaDescartada" },
        { section: "CargaBateria" },
        { section: "Bateria" },
        { section: "DemandaBateria" },
        { section: "stsolar" },
        { section: "stvento" },
    ];

    sections.forEach(({ section }) => {
        setupGeneralComment(section);
    });
});

/*==================== CARREGANDO COMENTÁRIOS AO LOGAR ====================*/

document.addEventListener("DOMContentLoaded", async () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userCommentsByDate = await getAllUserCommentsByDate();
            const userGeneralComments = await getAllUserGeneralComments();

            loadDateCommentsIntoCharts(userCommentsByDate);
            loadGeneralCommentsIntoDashboard(userGeneralComments);

            const sections = [
                "Demanda",
                "FotoXDemanda",
                "EolicaXDemanda",
                "Desempenho",
                "EnergiaComprada",
                "EnergiaCreditada",
                "EnergiaCompensada",
                "EnergiaDescartada",
                "CargaBateria",
                "Bateria",
                "DemandaBateria",
                "stsolar",
                "stvento",
            ];

            const firebaseNames = [
                "commentByDateDemanda",
                "commentByDateFotoXDemanda",
                "commentByDateEolicaXDemanda",
                "commentByDateDesempenho",
                "commentByDateEnergiaComprada",
                "commentByDateEnergiaCreditada",
                "commentByDateEnergiaCompensada",
                "commentByDateEnergiaDescartada",
                "commentByDateCargaBateria",
                "commentByDateBateria",
                "commentByDateDemandaBateria",
                "commentByDateSTSolar",
                "commentByDateSTVento",
            ];

            sections.forEach((section, index) => {
                setupDeleteCommentForSection(
                    section,
                    userCommentsByDate,
                    firebaseNames[index],
                );
            });
        }
    });
});

function loadDateCommentsIntoCharts(userComments) {
    const sections = [
        {
            section: "Demanda",
            chart: chartDemanda,
            options: optionsDemanda,
        },
        {
            section: "FotoXDemanda",
            chart: chartFotoXDemanda,
            options: optionsFotoXDemanda,
        },
        {
            section: "EolicaXDemanda",
            chart: chartEolicaXDemanda,
            options: optionsEolicaXDemanda,
        },
        {
            section: "Desempenho",
            chart: chartDesempenho,
            options: optionsDesempenho,
        },
        {
            section: "EnergiaComprada",
            chart: chartEnergiaComprada,
            options: optionsEnergiaComprada,
        },
        {
            section: "EnergiaCreditada",
            chart: chartEnergiaCreditada,
            options: optionsEnergiaCreditada,
        },
        {
            section: "EnergiaCompensada",
            chart: chartEnergiaCompensada,
            options: optionsEnergiaCompensada,
        },
        {
            section: "EnergiaDescartada",
            chart: chartEnergiaDescartada,
            options: optionsEnergiaDescartada,
        },
        {
            section: "CargaBateria",
            chart: chartCargaBateria,
            options: optionsCargaBateria,
        },
        {
            section: "Bateria",
            chart: chartBateria,
            options: optionsBateria,
        },
        {
            section: "DemandaBateria",
            chart: chartDemandaBateria,
            options: optionsDemandaBateria,
        },
        { section: "stsolar", chart: chartSTSolar, options: optionsSTSolar },
        { section: "stvento", chart: chartSTVento, options: optionsSTVento },
    ];

    sections.forEach(({ section, chart, options }) => {
        const comments = userComments[section] || []; // Obtém os comentários do Firestore

        if (chart && typeof chart.clearAnnotations === "function") {
            chart.clearAnnotations();
        }

        const divId = `delete_date_container_${section}`;
        const divElement = document.getElementById(divId);
        if (divElement) {
            if (comments.length > 0) {
                divElement.style.display = "flex";
            } else {
                if (chart && typeof chart.clearAnnotations === "function") {
                    chart.clearAnnotations();
                }
                divElement.style.display = "none";
            }
        }

        comments.forEach(({ comment, date }) => {
            if (chart) {
                addAnnotationToChart(date, comment, chart, options);
            }
        });
    });
}

function loadGeneralCommentsIntoDashboard(userComments) {
    const sections = [
        {
            section: "Demanda",
            chart: chartDemanda,
            options: optionsDemanda,
        },
        {
            section: "FotoXDemanda",
            chart: chartFotoXDemanda,
            options: optionsFotoXDemanda,
        },
        {
            section: "EolicaXDemanda",
            chart: chartEolicaXDemanda,
            options: optionsEolicaXDemanda,
        },
        {
            section: "Desempenho",
            chart: chartDesempenho,
            options: optionsDesempenho,
        },
        {
            section: "EnergiaComprada",
            chart: chartEnergiaComprada,
            options: optionsEnergiaComprada,
        },
        {
            section: "EnergiaCreditada",
            chart: chartEnergiaCreditada,
            options: optionsEnergiaCreditada,
        },
        {
            section: "EnergiaCompensada",
            chart: chartEnergiaCompensada,
            options: optionsEnergiaCompensada,
        },
        {
            section: "EnergiaDescartada",
            chart: chartEnergiaDescartada,
            options: optionsEnergiaDescartada,
        },
        {
            section: "CargaBateria",
            chart: chartCargaBateria,
            options: optionsCargaBateria,
        },
        {
            section: "Bateria",
            chart: chartBateria,
            options: optionsBateria,
        },
        {
            section: "DemandaBateria",
            chart: chartDemandaBateria,
            options: optionsDemandaBateria,
        },
        { section: "stsolar", chart: chartSTSolar, options: optionsSTSolar },
        { section: "stvento", chart: chartSTVento, options: optionsSTVento },
    ];

    sections.forEach(({ section }) => {
        const textarea = document.getElementById(`gc_input_${section}`); // area do comentario geral
        if (!textarea) return;

        // carregar comentário geral
        const generalComment = userComments[`generalComment${section}`] || "";
        if (generalComment) {
            textarea.value = generalComment;
        }
    });
}

/*==================== DELETANDO COMENTÁRIOS POR DATA ====================*/

function setupDeleteCommentForSection(section, userComments, name) {
    const deleteBtn = document.getElementById(`delete_date_${section}`);
    if (!deleteBtn) return;
    const dateOptionsDiv = document.getElementById(`date_options_${section}`);
    const confirmBtn = document.getElementById(`confirm_delete_${section}`);
    let allComments = userComments;

    let selectedDate = null; // data selecionada pelo usuário

    deleteBtn.addEventListener("click", async () => {
        // Pega as datas dos comentários dessa seção
        const userComments = await getAllUserCommentsByDate();
        allComments = userComments;
        const comments = userComments[section] || [];
        const dates = comments.map((c) => c.date);

        if (dates.length === 0) {
            return;
        }

        // Mostra o container e limpa qualquer flatpickr anterior
        dateOptionsDiv.style.display =
            dateOptionsDiv.style.display === "block" ? "none" : "block";
        dateOptionsDiv.innerHTML = ""; // limpar

        // Cria um input para o flatpickr (hidden para não duplicar)
        const input = document.createElement("input");
        input.type = "date";
        input.placeholder = "Data";
        input.id = `flatpickr_delete_${section}`;
        dateOptionsDiv.appendChild(input);

        // Inicializa flatpickr com datas permitidas (dates)
        flatpickr(input, {
            enable: dates, // habilita somente essas datas
            dateFormat: "Y-m-d",
            minDate: "2004-02-01", // data mínima
            maxDate: "2005-02-03",
            position: "above",
            onChange: function (dateStr) {
                if (dateStr.length > 0) {
                    const dt = dateStr[0];
                    const year = dt.getFullYear();
                    const month = String(dt.getMonth() + 1).padStart(2, "0");
                    const day = String(dt.getDate()).padStart(2, "0");

                    selectedDate = `${year}-${month}-${day}`;
                    confirmBtn.style.display = "flex";
                }
            },
        });

        input.focus(); // abre o calendário
    });

    confirmBtn.addEventListener("click", async () => {
        if (!selectedDate) {
            return;
        }

        try {
            // Chama a função para deletar comentário no Firebase
            await deleteUserCommentByDate(name, selectedDate);

            const updatedUserComments = await getAllUserCommentsByDate();

            userComments = updatedUserComments;

            // Atualiza o gráfico
            loadDateCommentsIntoCharts(userComments);

            // Esconde o flatpickr e botão confirmar
            dateOptionsDiv.style.display = "none";
            dateOptionsDiv.innerHTML = "";
            confirmBtn.style.display = "none";

            selectedDate = null;

            // Se não tiver mais comentários, esconde o botão deletar
            if (userComments[section].length === 0) {
                deleteBtn.style.display = "none";
                const deleteContainer = document.getElementById(
                    `delete_date_container_${section}`,
                );
                if (deleteContainer) deleteContainer.style.display = "none";
            }
        } catch (error) {
            console.error("Erro ao deletar comentário:", error);
        }
    });
}

/*==================== LINK ACTIVE ====================*/
const linkColor = document.querySelectorAll(".nav-link");

function colorLink() {
    linkColor.forEach((l) => l.classList.remove("active"));
    this.classList.add("active");
}

linkColor.forEach((l) => l.addEventListener("click", colorLink));

/*==================== CARREGANDO DADOS DO JSON ====================*/

let optionsDemanda;
let optionsFotoXDemanda;
let optionsEolicaXDemanda;
let optionsDesempenho;
let optionsEnergiaComprada;
let optionsEnergiaCreditada;
let optionsEnergiaCompensada;
let optionsEnergiaDescartada;
let optionsCargaBateria;
let optionsBateria;
let optionsDemandaBateria;
let optionsSTSolar;
let optionsSTVento;

// Carrega os dados do json e preenche nos gráficos
// Poderia estar em um outro arquivo talvez.
async function loadData() {
    try {
        const response = await fetch("../../../dados/dados.json");
        const data = await response.json();

        let savedData = null;
        if (localStorage) {
            savedData = JSON.parse(localStorage.getItem("simulationData"));
        }
        let chartData =
            savedData && savedData.chartData ? savedData.chartData : null;

        // Gerando pontos a partir de 01/Fev/2004
        const startTimestamp = new Date("01 Feb 2004").getTime();

        const timestampsHourly = [];
        for (let i = 0; i < 8640; i++) {
            timestampsHourly.push(startTimestamp + i * 3600000); // adiciona 1 hora em milissegundos
        }

        const timestampsDaily = [];
        for (let i = 0; i < 360; i++) {
            timestampsDaily.push(startTimestamp + i * 86400000); // adiciona 1 dia em milissegundos (24h)
        }

        const maxRangeMs = 720 * 3600000; // 30 dias de 24h em milissegundos
        const chartEvents = {
            beforeZoom: function (e, { xaxis }) {
                if (xaxis.max - xaxis.min > maxRangeMs) {
                    return {
                        xaxis: {
                            min: xaxis.min,
                            max: xaxis.min + maxRangeMs,
                        },
                    };
                }
            },
            beforeReset: function (e, opts) {
                return {
                    xaxis: {
                        min: startTimestamp,
                        max: startTimestamp + maxRangeMs,
                    },
                };
            },
        };

        let generateTemplate = (titleText, yaxisTitle, seriesData, colors) => {
            let maxVal = 0;
            let minVal = 0;
            seriesData.forEach((s) => {
                if (s.data && s.data.length > 0) {
                    let sMax = Math.max(...s.data);
                    let sMin = Math.min(...s.data);
                    if (sMax > maxVal) maxVal = sMax;
                    if (sMin < minVal) minVal = sMin;
                }
            });
            let yMax = Math.ceil(maxVal) || 10;
            let yMin = Math.floor(minVal);
            if (yMin > 0) yMin = 0;

            let template = {
                series: seriesData,
                chart: {
                    height: 350,
                    type: "line",
                    width: "100%",
                    zoom: { autoScaleYaxis: false },
                    events: chartEvents,
                },
                responsive: [
                    {
                        breakpoint: 768,
                        options: {
                            chart: { height: 300 },
                            legend: {
                                position: "bottom",
                                offsetX: 0,
                                offsetY: 0,
                            },
                            title: { style: { fontSize: "15px" } },
                            xaxis: {
                                tickAmount: 4,
                                labels: {
                                    show: true,
                                    rotate: -45,
                                    hideOverlappingLabels: true,
                                },
                            },
                        },
                    },
                ],
                dataLabels: { enabled: false },
                stroke: { curve: "straight" },
                title: {
                    text: titleText,
                    align: "center",
                    margin: 60,
                    style: {
                        fontSize: "20px",
                        fontWeight: "bold",
                        fontFamily: "Arial",
                        color: "#263238",
                    },
                },
                grid: {
                    row: { colors: ["#f3f3f3", "transparent"], opacity: 0.5 },
                },
                xaxis: {
                    title: { text: "Dia" },
                    type: "datetime",
                    min: startTimestamp,
                    categories: timestampsDaily,
                },
                yaxis: {
                    title: { text: yaxisTitle },
                    decimalsInFloat: 3,
                    min: yMin,
                    max: yMax,
                },
            };

            if (colors) {
                template.colors = colors;
            }

            return template;
        };

        optionsDemanda = generateTemplate(
            "Demanda Energética",
            "Energia (kWh)",
            [
                {
                    name: "Demanda Energética",
                    data: chartData ? chartData.demanda : [],
                },
            ],
            ["#FEB019"]
        );

        optionsFotoXDemanda = generateTemplate(
            "Produção Fotovoltaica x Demanda Suprida",
            "Energia (kWh)",
            [
                {
                    name: "Produção Fotovoltaica",
                    data: chartData ? chartData.energiaF : [],
                },
                {
                    name: "Demanda Suprida",
                    data: chartData ? chartData.pv_meet : [],
                },
            ],
        );

        optionsEolicaXDemanda = generateTemplate(
            "Produção Eólica x Demanda Suprida",
            "Energia (kWh)",
            [
                {
                    name: "Produção Eólica",
                    data: chartData ? chartData.energiaV : [],
                },
                {
                    name: "Demanda Suprida",
                    data: chartData ? chartData.wt_meet : [],
                },
            ],
        );

        const sumArrays = (arr1, arr2) => {
            if (!arr1 || !arr2) return [];
            return arr1.map((val, idx) => Number((val + (arr2[idx] || 0)).toFixed(3)));
        };

        const energiaProduzida = chartData
            ? sumArrays(chartData.energiaF, chartData.energiaV)
            : [];
        const demandaSupridaTotal = chartData
            ? sumArrays(chartData.pv_meet, chartData.wt_meet)
            : [];

        optionsDesempenho = generateTemplate("Desempenho", "Energia (kWh)", [
            {
                name: "Energia produzida",
                data: energiaProduzida,
            },
            {
                name: "Demanda Suprida pelas Fontes Renováveis",
                data: demandaSupridaTotal,
            },
            {
                name: "Demanda Energética Total",
                data: chartData ? chartData.demanda : [],
            },
            {
                name: "Energia Comprada da Rede",
                data: chartData ? chartData.energiaComprada : [],
            },
        ],
        ["#008FFB", "#00E396", "#FEB019", "#9C27B0"]
        );

        optionsEnergiaComprada = generateTemplate(
            "Energia Comprada da Rede",
            "Energia (kWh)",
            [
                {
                    name: "Energia Comprada da Rede",
                    data: chartData ? chartData.energiaComprada : [],
                },
            ],
            ["#9C27B0"]
        );
        optionsEnergiaCreditada = generateTemplate(
            "Energia Creditada",
            "Energia (kWh)",
            [
                {
                    name: "Energia Creditada",
                    data: chartData ? chartData.energiaCreditada : [],
                },
            ],
        );
        optionsEnergiaCompensada = generateTemplate(
            "Energia Compensada",
            "Energia (kWh)",
            [
                {
                    name: "Energia Compensada",
                    data: chartData ? chartData.energiaCompensada : [],
                },
            ],
        );
        optionsEnergiaDescartada = generateTemplate(
            "Excesso de Energia Descartada",
            "Energia (kWh)",
            [
                {
                    name: "Excesso de Energia Descartada",
                    data: chartData ? chartData.energiaDescartada : [],
                },
            ],
        );

        optionsCargaBateria = generateTemplate(
            "Nível de carga na bateria",
            "Carga (kWh)",
            [
                {
                    name: "Nível de carga na bateria",
                    data: chartData ? chartData.cargaBateria : [],
                },
            ],
        );
        optionsDemandaBateria = generateTemplate(
            "Demanda Suprida pela Bateria",
            "Energia (kWh)",
            [
                {
                    name: "Demanda Suprida pela Bateria",
                    data: chartData ? chartData.bateria_meet : [],
                },
            ],
        );

        /* OPTIONS BATERIA */
        let batMax = 0;
        let batMin = 0;
        const batSeries = [
            {
                name: "Carga",
                data: chartData ? chartData.carga : data.carga || [],
            },
            {
                name: "Descarga",
                data: chartData ? chartData.descarga : data.descarga || [],
            },
        ];

        batSeries.forEach((s) => {
            if (s.data && s.data.length > 0) {
                let mMax = Math.max(...s.data);
                let mMin = Math.min(...s.data);
                if (mMax > batMax) batMax = mMax;
                if (mMin < batMin) batMin = mMin;
            }
        });
        let yMaxBat = Math.ceil(batMax) || 10;
        let yMinBat = Math.floor(batMin) || -10;

        optionsBateria = {
            series: batSeries,
            chart: {
                type: "bar",
                height: 440,
                stacked: true,
                width: "100%",
                zoom: { autoScaleYaxis: false },
                events: chartEvents,
            },
            responsive: [
                {
                    breakpoint: 768,
                    options: {
                        chart: {
                            height: 300,
                        },
                        legend: {
                            position: "bottom",
                            offsetX: 0,
                            offsetY: 0,
                        },
                        title: {
                            style: {
                                fontSize: "15px",
                            },
                        },
                        xaxis: {
                            tickAmount: 4,
                            labels: {
                                show: true,
                                rotate: -45,
                                hideOverlappingLabels: true, // Evita sobreposição
                            },
                        },
                    },
                },
            ],
            colors: ["#165BAA", "#A155B9"],
            plotOptions: {
                bar: {
                    borderRadius: 5,
                    borderRadiusApplication: "end", // 'around', 'end'
                    borderRadiusWhenStacked: "all", // 'all', 'last'
                    horizontal: false,
                    barHeight: "80%",
                },
            },
            dataLabels: {
                enabled: false,
            },
            stroke: {
                width: 1,
                colors: ["#fff"],
            },
            grid: {
                xaxis: {
                    lines: {
                        show: false,
                    },
                },
                padding: {
                    left: 25,
                    right: 25,
                },
            },
            tooltip: {
                shared: false,
                x: {
                    format: "dd MMM yyyy",
                },
                y: {
                    formatter: function (val) {
                        return Math.abs(val);
                    },
                },
            },
            title: {
                text: "Carregamento e descarregamento na bateria",
                align: "center",
                margin: 60,
                style: {
                    fontSize: "20px",
                    fontWeight: "bold",
                    fontFamily: "Arial",
                    color: "#263238",
                },
            },
            xaxis: {
                type: "datetime",
                min: startTimestamp,
                categories: timestampsDaily,
                title: {
                    text: "Dia",
                },
                labels: {
                    format: "MMM 'yy",
                },
            },
            yaxis: {
                title: {
                    text: "Energia (kWh)",
                },
                stepSize: 10,
                decimalsInFloat: 3,
                min: yMinBat,
                max: yMaxBat,
            },
        };

        /* OPTIONS ST SOLAR */
        const irradiacoes = data.irradiacao.map((item) => item[1]);
        const maxIrradiacao = Math.max(...irradiacoes);
        const yMaxSolar = Math.ceil(maxIrradiacao);
        const mediaIrradiacao =
            irradiacoes.reduce((sum, val) => sum + val, 0) / irradiacoes.length;
        optionsSTSolar = {
            title: {
                text: "Irradiação Solar Anual",
                align: "center",
                margin: 60,
                style: {
                    fontSize: "20px",
                    fontWeight: "bold",
                    fontFamily: "Arial",
                    color: "#263238",
                },
            },
            series: [
                {
                    name: "Irradiação solar (Wh/m^2)",
                    data: data.irradiacao,
                },
            ],
            chart: {
                id: "area-datetime",
                type: "area",
                height: 350,
                zoom: {
                    autoScaleYaxis: true,
                    autoScaleYaxis: false,
                },
                width: "100%",
                events: chartEvents,
            },
            responsive: [
                {
                    breakpoint: 768,
                    options: {
                        chart: {
                            height: 300, // Gráfico um pouco menor no mobile
                        },
                        legend: {
                            position: "bottom",
                            offsetX: 0,
                            offsetY: 0,
                        },
                        title: {
                            style: {
                                fontSize: "15px",
                            },
                        },
                        xaxis: {
                            tickAmount: 4,
                            labels: {
                                show: true,
                                rotate: -45,
                                hideOverlappingLabels: true, // Evita sobreposição
                            },
                        },
                    },
                },
            ],
            annotations: {
                yaxis: [
                    {
                        y: 30,
                        borderColor: "#999",
                        label: {
                            show: true,
                            text: "Support",
                            style: {
                                color: "#fff",
                                background: "#00E396",
                            },
                        },
                    },
                    {
                        y: mediaIrradiacao,
                        borderColor: "#FF0000",
                        strokeDashArray: 5,
                        label: {
                            show: true,
                            text: `Média do ano: ${mediaIrradiacao.toFixed(3)}`,
                            style: {
                                color: "#fff",
                                background: "#FF0000",
                            },
                            offsetX: 0,
                            offsetY: -5,
                        },
                    },
                ],
            },
            dataLabels: {
                enabled: false,
            },
            markers: {
                size: 0,
                style: "hollow",
            },
            xaxis: {
                title: {
                    text: "Dia",
                },
                type: "datetime",
                min: startTimestamp,
                categories: timestampsHourly,
            },
            yaxis: {
                title: {
                    text: "Irradiação solar (Wh/m^2)",
                },
                decimalsInFloat: 3,
                min: 0,
                max: yMaxSolar,
            },
            fill: {
                type: "gradient",
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0.9,
                    stops: [0, 100],
                },
            },
        };

        /* OPTIONS ST VENTO*/
        const ventos = data.vento.map((item) => item[1]);
        const maxVento = Math.max(...ventos);
        const yMaxVento = Math.ceil(maxVento);
        const mediaVento =
            ventos.reduce((sum, val) => sum + val, 0) / ventos.length;
        optionsSTVento = {
            title: {
                text: "Vento Anual",
                align: "center",
                margin: 60,
                style: {
                    fontSize: "20px",
                    fontWeight: "bold",
                    fontFamily: "Arial",
                    color: "#263238",
                },
            },

            series: [
                {
                    name: "Velocidade do vento",
                    color: "#EC9340",
                    data: data.vento,
                },
            ],

            chart: {
                id: "area-datetime",
                type: "area",
                height: 350,
                zoom: {
                    autoScaleYaxis: true,
                    autoScaleYaxis: false,
                },
                width: "100%",
                events: chartEvents,
            },
            responsive: [
                {
                    breakpoint: 768,
                    options: {
                        chart: {
                            height: 300, // Gráfico um pouco menor no mobile
                        },
                        legend: {
                            position: "bottom",
                            offsetX: 0,
                            offsetY: 0,
                        },
                        title: {
                            style: {
                                fontSize: "15px",
                            },
                        },
                        xaxis: {
                            tickAmount: 4,
                            labels: {
                                show: true,
                                rotate: -45,
                                hideOverlappingLabels: true, // Evita sobreposição
                            },
                        },
                    },
                },
            ],
            annotations: {
                yaxis: [
                    {
                        y: 30,
                        borderColor: "#999",
                        label: {
                            show: true,
                            text: "Support",
                            style: {
                                color: "#fff",
                                background: "#00E396",
                            },
                        },
                    },
                    {
                        y: mediaVento,
                        borderColor: "#FF0000",
                        strokeDashArray: 5,
                        label: {
                            show: true,
                            text: `Média do ano: ${mediaVento.toFixed(3)}`,
                            style: {
                                color: "#fff",
                                background: "#FF0000",
                            },
                            offsetX: 0,
                            offsetY: -5,
                        },
                    },
                ],
            },
            dataLabels: {
                enabled: false,
            },
            markers: {
                size: 0,
                style: "hollow",
            },
            xaxis: {
                title: {
                    text: "Dia",
                },
                type: "datetime",
                min: startTimestamp,
                categories: timestampsHourly,
            },
            yaxis: {
                title: {
                    text: "Velocidade do vento (m/s)",
                },
                decimalsInFloat: 3,
                min: 0,
                max: yMaxVento,
            },
            fill: {
                type: "gradient",
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0.9,
                    stops: [0, 100],
                },
            },
        };
    } catch (error) {
        console.error("Erro ao carregar os dados:", error);
    }
}

await loadData();

/*==================== RENDERIZANDO GRÁFICOS ====================*/

var resetCssClasses = function (activeEl) {
    var els = document.querySelectorAll("button");

    Array.prototype.forEach.call(els, function (el) {
        el.classList.remove("active");
    });

    activeEl.target.classList.add("active");
};

function renderChartWithPeriods(chartId, options, prefix) {
    const container = document.querySelector(chartId);
    if (!container) return null;

    var chart = new ApexCharts(container, options);

    const monthNames = [
        "Fevereiro(2004)",
        "Março(2004)",
        "Abril(2004)",
        "Maio(2004)",
        "Junho(2004)",
        "Julho(2004)",
        "Agosto(2004)",
        "Setembro(2004)",
        "Outubro(2004)",
        "Novembro(2004)",
        "Dezembro(2004)",
        "Janeiro(2005)",
    ];

    let currentMonth = 0;

    function zoomToMonth(monthIndex) {
        if (monthIndex < 0) monthIndex = 0;
        if (monthIndex > 11) monthIndex = 11;
        currentMonth = monthIndex;

        const btnMes = document.querySelector(`#btn_mes_${prefix}`);
        if (btnMes) btnMes.innerText = monthNames[currentMonth];

        const startIdx = currentMonth * 720;
        let endIdx = startIdx + 719;
        if (endIdx > 8639) endIdx = 8639;

        const startTimestamp = new Date("01 Feb 2004").getTime();
        const tStart = startTimestamp + startIdx * 3600000;
        const tEnd = startTimestamp + endIdx * 3600000;

        chart.zoomX(tStart, tEnd);
    }

    chart.render().then(() => {
        zoomToMonth(0);

        const loadingWarning = container.nextElementSibling;
        if (
            loadingWarning &&
            loadingWarning.classList.contains("loading_chart")
        ) {
            loadingWarning.style.display = "none";
        }
    });

    for (let i = 0; i < 12; i++) {
        const el = document.querySelector(`#m${i}_${prefix}`);
        if (el) {
            el.addEventListener("click", function (e) {
                resetCssClasses(e);
                zoomToMonth(i);
            });
        }
    }

    const leftArrow = document.querySelector(`#left_${prefix}`);
    if (leftArrow) {
        leftArrow.addEventListener("click", function (e) {
            if (currentMonth > 0) {
                zoomToMonth(currentMonth - 1);
            }
        });
    }

    const rightArrow = document.querySelector(`#right_${prefix}`);
    if (rightArrow) {
        rightArrow.addEventListener("click", function (e) {
            if (currentMonth < 11) {
                zoomToMonth(currentMonth + 1);
            }
        });
    }

    return chart;
}

var chartDemanda = renderChartWithPeriods(
    "#chartDemanda",
    optionsDemanda,
    "demanda",
);
var chartFotoXDemanda = renderChartWithPeriods(
    "#chartFotoXDemanda",
    optionsFotoXDemanda,
    "fotoXDemanda",
);
var chartEolicaXDemanda = renderChartWithPeriods(
    "#chartEolicaXDemanda",
    optionsEolicaXDemanda,
    "eolicaXDemanda",
);
var chartDesempenho = renderChartWithPeriods(
    "#chartDesempenho",
    optionsDesempenho,
    "desempenho",
);
var chartEnergiaComprada = renderChartWithPeriods(
    "#chartEnergiaComprada",
    optionsEnergiaComprada,
    "energiaComprada",
);
var chartEnergiaCreditada = renderChartWithPeriods(
    "#chartEnergiaCreditada",
    optionsEnergiaCreditada,
    "energiaCreditada",
);
var chartEnergiaCompensada = renderChartWithPeriods(
    "#chartEnergiaCompensada",
    optionsEnergiaCompensada,
    "energiaCompensada",
);
var chartEnergiaDescartada = renderChartWithPeriods(
    "#chartEnergiaDescartada",
    optionsEnergiaDescartada,
    "energiaDescartada",
);
var chartCargaBateria = renderChartWithPeriods(
    "#chartCargaBateria",
    optionsCargaBateria,
    "cargaBateria",
);
var chartBateria = renderChartWithPeriods(
    "#chartBateria",
    optionsBateria,
    "bat",
);
var chartDemandaBateria = renderChartWithPeriods(
    "#chartDemandaBateria",
    optionsDemandaBateria,
    "demandaBateria",
);
var chartSTSolar = renderChartWithPeriods(
    "#chartSTSolar",
    optionsSTSolar,
    "sts",
);
var chartSTVento = renderChartWithPeriods(
    "#chartSTVento",
    optionsSTVento,
    "stv",
);

async function updateChartsWithData(chartData, withPause = false) {
    if (!chartData) return;

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const PAUSE_MS = withPause ? 500 : 0;

    const startTimestamp = new Date("01 Feb 2004").getTime();
    const tStart = startTimestamp;
    const tEnd = startTimestamp + 719 * 3600000;

    const updateAndZoom = async (chart, series) => {
        if (chart) {
            let maxVal = 0;
            let minVal = 0;
            series.forEach((s) => {
                if (s.data && s.data.length > 0) {
                    let sMax = Math.max(...s.data);
                    let sMin = Math.min(...s.data);
                    if (sMax > maxVal) maxVal = sMax;
                    if (sMin < minVal) minVal = sMin;
                }
            });

            let yMax = Math.ceil(maxVal) || 10;
            let yMin = Math.floor(minVal);
            if (yMin > 0) yMin = 0;

            chart.updateOptions({
                yaxis: {
                    min: yMin,
                    max: yMax,
                },
            });

            chart.updateSeries(series, withPause);
            chart.zoomX(tStart, tEnd);
            if (withPause) {
                await delay(PAUSE_MS);
            }
        }
    };

    await updateAndZoom(chartDemanda, [
        { name: "Demanda Energética", data: chartData.demanda },
    ]);

    await updateAndZoom(chartFotoXDemanda, [
        { name: "Produção Fotovoltaica", data: chartData.energiaF },
        { name: "Demanda Suprida", data: chartData.pv_meet },
    ]);

    await updateAndZoom(chartEolicaXDemanda, [
        { name: "Produção Eólica", data: chartData.energiaV },
        { name: "Demanda Suprida", data: chartData.wt_meet },
    ]);

    const sumArrays = (arr1, arr2) => {
        if (!arr1 || !arr2) return [];
        return arr1.map((val, idx) => Number((val + (arr2[idx] || 0)).toFixed(3)));
    };

    await updateAndZoom(chartDesempenho, [
        {
            name: "Energia produzida",
            data: sumArrays(chartData.energiaF, chartData.energiaV),
        },
        {
            name: "Demanda Suprida pelas Fontes Renováveis",
            data: sumArrays(chartData.pv_meet, chartData.wt_meet),
        },
        { name: "Demanda Energética Total", data: chartData.demanda },
        { name: "Energia Comprada da Rede", data: chartData.energiaComprada },
    ]);

    await updateAndZoom(chartEnergiaComprada, [
        { name: "Energia Comprada da Rede", data: chartData.energiaComprada },
    ]);
    await updateAndZoom(chartEnergiaCreditada, [
        { name: "Energia Creditada", data: chartData.energiaCreditada },
    ]);
    await updateAndZoom(chartEnergiaCompensada, [
        { name: "Energia Compensada", data: chartData.energiaCompensada },
    ]);
    await updateAndZoom(chartEnergiaDescartada, [
        {
            name: "Excesso de Energia Descartada",
            data: chartData.energiaDescartada,
        },
    ]);
    await updateAndZoom(chartCargaBateria, [
        {
            name: "Nível de carga na bateria",
            data: chartData.cargaBateria,
        },
    ]);

    await updateAndZoom(chartBateria, [
        { name: "Carga", data: chartData.carga },
        { name: "Descarga", data: chartData.descarga },
    ]);

    await updateAndZoom(chartDemandaBateria, [
        { name: "Demanda Suprida pela Bateria", data: chartData.bateria_meet },
    ]);
}
