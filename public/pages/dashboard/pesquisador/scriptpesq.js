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
import CDEEPSO from "../../../js/CDEEPSO.js";
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

/*==================== SHOW MENU & CLOSE MENU ====================*/
const navMenu = document.getElementById("navbar"),
    navToggle = document.getElementById("header-toggle"),
    navClose = document.getElementById("nav-close");

if (navToggle) {
    navToggle.addEventListener("click", () => {
        navMenu.classList.add("show-menu");
    });
}

if (navClose) {
    navClose.addEventListener("click", () => {
        navMenu.classList.remove("show-menu");
    });
}

const navLink = document.querySelectorAll(".nav-link");

function linkAction() {
    navMenu.classList.remove("show-menu");
}
navLink.forEach((n) => n.addEventListener("click", linkAction));

/*==================== RODANDO SIMULAÇÃO ====================*/

document.addEventListener("DOMContentLoaded", function () {
    const runButton = document.querySelector(".run_btn");
    const runButtonText = document.querySelector(".run_btn_text");
    const configButtons = document.querySelector(".config_buttons");
    const confirmButton = document.getElementById("confirm_button");
    const pauseButton = document.getElementById("pause_button");
    const valorContainer = document.querySelectorAll(".valor-container");

    let fixedValues = { houses: null, turbines: null, generation: null };
    let valuesBeforePause = { houses: null, turbines: null, generation: null };
    const fixedIcons = {
        houses: document.getElementById("fixedHouses"),
        turbines: document.getElementById("fixedTurbines"),
        generation: document.getElementById("fixedPanelGen"),
    };

    let isPaused = false;
    let selectedIteration = 10;
    let selectedPeriod = 8640; // 12 meses (8640 horas)

    const periodMapping = {
        "1 semana": 168,
        "2 semanas": 336,
        "1 mês": 720,
        "3 meses": 2160,
        "6 meses": 4320,
        "9 meses": 6480,
        "12 meses": 8640,
    };

    // Monta os botões de seleção de período e iterações
    function setupDropdown(buttonId, dropdownId) {
        const button = document.getElementById(buttonId);
        const dropdown = document.getElementById(dropdownId);

        function toggleDropdown(event) {
            event.stopPropagation();
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
                button.innerText =
                    button.innerText.split(":")[0] + ": " + newValue + " ▼";
                dropdown.style.display = "none";

                // Atualiza a variável global com o valor selecionado
                if (buttonId === "iterations_button") {
                    selectedIteration = parseInt(newValue);
                } else {
                    selectedPeriod = periodMapping[newValue];
                }
            });
        });
    }

    // Configura os dropdowns apenas uma vez
    setupDropdown("iterations_button", "iterations_dropdown");
    setupDropdown("period_button", "period_dropdown");

    runButton.addEventListener("click", function () {
        configButtons.style.display =
            configButtons.style.display === "flex" ? "none" : "flex";
    });

    confirmButton.addEventListener("click", function () {
        configButtons.style.display = "none";
        pauseButton.style.display = "flex";
        fixedValues = { houses: null, turbines: null, generation: null };
        valuesBeforePause = { houses: null, turbines: null, generation: null };
        Object.values(fixedIcons).forEach(
            (icon) => (icon.style.display = "none")
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
            gifs.forEach((gif) => (gif.style.display = "none"));

            // Esconde os ícones de fixado ao pausar
            Object.values(fixedIcons).forEach(
                (icon) => (icon.style.display = "none")
            );

            // Salva os valores exatos que estão na tela antes de torná-los editáveis
            valuesBeforePause.houses = metricas[3].innerText.trim();
            valuesBeforePause.turbines = metricas[4].innerText.trim();
            valuesBeforePause.generation = metricas[5].innerText
                .trim()
                .replace(/\s*kWh$/, "");

            // Torna todos os 3 campos editáveis
            [3, 4, 5].forEach((i) => {
                const valorAtual = metricas[i].innerText.trim().split(" ")[0];
                metricas[i].innerHTML =
                    `<span class="editavel-numero" contenteditable="true">${valorAtual}</span>` +
                    (i === 5 ? ' <span class="sufixo-unidade">kWh</span>' : "");
            });
        } else {
            // Ao despausar
            pauseButton.innerHTML = "<h3>Pausar</h3>";

            // Para cada campo, verifica se o valor foi alterado pelo usuário
            // Se foi alterado, atualiza o 'fixedValues'. Se não, não faz nada.

            // CASAS (índice 3)
            const casasSpan = metricas[3].querySelector(".editavel-numero");
            if (casasSpan) {
                const novoValorStr = casasSpan.innerText.trim();
                // Apenas fixa se o valor mudou
                if (novoValorStr !== valuesBeforePause.houses) {
                    const novoValorNum = parseInt(
                        novoValorStr.replace(/[^\d]/g, "")
                    );
                    if (!isNaN(novoValorNum)) {
                        fixedValues.houses = novoValorNum;
                    }
                }
                // Atualiza a tela com o valor (seja o novo fixo ou o antigo)
                metricas[3].innerText =
                    fixedValues.houses !== null
                        ? fixedValues.houses
                        : novoValorStr;
            }

            // TURBINAS (índice 4)
            const turbinasSpan = metricas[4].querySelector(".editavel-numero");
            if (turbinasSpan) {
                const novoValorStr = turbinasSpan.innerText.trim();
                if (novoValorStr !== valuesBeforePause.turbines) {
                    const novoValorNum = parseInt(
                        novoValorStr.replace(/[^\d]/g, "")
                    );
                    if (!isNaN(novoValorNum)) {
                        fixedValues.turbines = novoValorNum;
                    }
                }
                metricas[4].innerText =
                    fixedValues.turbines !== null
                        ? fixedValues.turbines
                        : novoValorStr;
            }

            // GERAÇÃO (índice 5)
            const geracaoSpan = metricas[5].querySelector(".editavel-numero");
            if (geracaoSpan) {
                const novoValorStr = geracaoSpan.innerText.trim();
                if (novoValorStr !== valuesBeforePause.generation) {
                    const novoValorNum = parseInt(
                        novoValorStr.replace(/[^\d]/g, "")
                    );
                    if (!isNaN(novoValorNum)) {
                        fixedValues.generation = novoValorNum;
                    }
                }
                const valorFinal =
                    fixedValues.generation !== null
                        ? fixedValues.generation
                        : novoValorStr;
                metricas[5].innerText = valorFinal + " kWh";
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
                    (index === 3 && fixedValues.houses !== null) ||
                    (index === 4 && fixedValues.turbines !== null) ||
                    (index === 5 && fixedValues.generation !== null);
                if (index < 3 || !isFixed) {
                    gif.style.display = "inline";
                }
            });
        }
    });

    // Roda a simulação: Chama o CDEEPSO e preenche os cards das métricas após a execução
    async function runSimulation() {
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

            // Animação do botão
            interval = setInterval(() => {
                runButtonText.innerHTML = texts[textIndex];
                textIndex = (textIndex + 1) % texts.length;
            }, 500);

            // Esconde os valores e mostra GIFs de carregamento
            metricas.forEach((el) => (el.style.display = "none"));
            metricas.forEach((el) => el.classList.remove("temp")); // limpa antes
            gifs.forEach((gif) => (gif.style.display = "inline"));

            let currentIteration = 0;
            let resultado;

            while (currentIteration < selectedIteration) {
                resultado = await CDEEPSO(
                    selectedIteration,
                    selectedPeriod,
                    () => isPaused,
                    fixedValues,
                    currentIteration
                );

                if (resultado?.pausedAtIteration !== undefined) {
                    // simulação pausada no meio de uma iteração
                    currentIteration = resultado.pausedAtIteration;

                    // espera até despausar
                    while (isPaused) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, 100)
                        );
                    }
                } else {
                    // terminou tudo normalmente
                    break;
                }
            }
        } catch (error) {
            console.error("Erro ao rodar a simulação:", error);
            localStorage.clear();
            metricas.forEach((el) => (el.innerText = "Erro"));
        } finally {
            clearInterval(interval);

            valorContainer.forEach((container) => {
                container.style.backgroundColor = "transparent";
                container.style.boxShadow = "none";
            });
            pauseButton.style.display = "none";
            runButtonText.innerHTML = "Rodar simulação";
            runButton.disabled = false;
            runButton.style.opacity = "1";
            runButton.style.cursor = "pointer";

            gifs.forEach((gif) => (gif.style.display = "none"));

            // Esconde os ícones de "fixado" no final da simulação
            Object.values(fixedIcons).forEach(
                (icon) => (icon.style.display = "none")
            );

            let simulationData = JSON.parse(
                localStorage.getItem("simulationData")
            );

            // Preenche cards de métricas
            if (simulationData) {
                let valores = [
                    (simulationData.renewable_factor * 100)
                        .toFixed(2)
                        .replace(".", ",") + "%",
                    (simulationData.loss_load_probability * 100)
                        .toFixed(2)
                        .replace(".", ",") + "%",
                    "R$" +
                        simulationData.price_electricity
                            .toFixed(3)
                            .replace(".", ",") +
                        "/kWh",
                    simulationData.houses,
                    simulationData.num_wind_turbines,
                    simulationData.max_generation + " kWh",
                ];

                metricas.forEach((el, index) => {
                    el.style.display = "inline";
                    el.innerText = valores[index];
                    el.classList.remove("temp"); // removendo opacidade
                });
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
            (savedData.renewable_factor * 100).toFixed(2).replace(".", ",") +
            "%";
        metricas[1].innerText =
            (savedData.loss_load_probability * 100)
                .toFixed(2)
                .replace(".", ",") + "%";
        metricas[2].innerText =
            "$" +
            savedData.price_electricity.toFixed(3).replace(".", ",") +
            "/kWh";
        metricas[3].innerText = savedData.houses;
        metricas[4].innerText = savedData.num_wind_turbines;
        metricas[5].innerText = savedData.max_generation + " kWh";
    }
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
        0
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
            name
        ) {
            var selectedDate = null;
            const buttonElement = document.querySelector(buttonId);
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
                        addAnnotationToChart(
                            selectedDate,
                            comment,
                            chart,
                            options
                        );

                        // salvar o comentário no firestore
                        await saveUserCommentByDate(
                            commentSectionId,
                            comment,
                            selectedDate
                        );

                        document.getElementById(
                            `delete_date_container_${name}`
                        ).style.display = "flex";
                        document.getElementById(
                            `delete_date_${name}`
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
                selectId: "#select_date_fotovoltaica",
                commentSectionId: "#comment_section_fotovoltaica",
                commentInputId: "#comment_input_fotovoltaica",
                chart: chartFotovoltaica,
                options: optionsFotovoltaica,
                name: "fotovoltaica",
            },
            {
                selectId: "#select_date_eolica",
                commentSectionId: "#comment_section_eolica",
                commentInputId: "#comment_input_eolica",
                chart: chartEolica,
                options: optionsEolica,
                name: "eolica",
            },
            {
                selectId: "#select_date_energiaxdemanda",
                commentSectionId: "#comment_section_energiaxdemanda",
                commentInputId: "#comment_input_energiaxdemanda",
                chart: chartEnergiaXDemanda,
                options: optionsEnergiaXDemanda,
                name: "energiaxdemanda",
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
                selectId: "#select_date_energiaxcompensacao",
                commentSectionId: "#comment_section_energiaxcompensacao",
                commentInputId: "#comment_input_energiaxcompensacao",
                chart: chartEnergiaXCompensacao,
                options: optionsEnergiaXCompensacao,
                name: "energiaxcompensacao",
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
                    name
                );
            }
        );
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
});

/*==================== COMENTÁRIO GERAL ====================*/
document.addEventListener("DOMContentLoaded", function () {
    function setupGeneralComment(section) {
        const gcWindow = document.getElementById(`gc_window_${section}`);
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
                    "Tem certeza que deseja deletar o texto?"
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
        { section: "fotovoltaica" },
        { section: "eolica" },
        { section: "energiaxdemanda" },
        { section: "desempenho" },
        { section: "energiaxcompensacao" },
        { section: "bateria" },
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
                "fotovoltaica",
                "eolica",
                "energiaxdemanda",
                "desempenho",
                "energiaxcompensacao",
                "bateria",
                "stsolar",
                "stvento",
            ];
            const firebaseNames = [
                "commentByDateFotovoltaica",
                "commentByDateEolica",
                "commentByDateEnergiaXDemanda",
                "commentByDateDesempenho",
                "commentByDateEnergiaXCompensacao",
                "commentByDateBateria",
                "commentByDateSTSolar",
                "commentByDateSTVento",
            ];

            sections.forEach((section, index) => {
                setupDeleteCommentForSection(
                    section,
                    userCommentsByDate,
                    firebaseNames[index]
                );
            });
        }
    });
});

function loadDateCommentsIntoCharts(userComments) {
    const sections = [
        {
            section: "fotovoltaica",
            chart: chartFotovoltaica,
            options: optionsFotovoltaica,
        },
        { section: "eolica", chart: chartEolica, options: optionsEolica },
        {
            section: "energiaxdemanda",
            chart: chartEnergiaXDemanda,
            options: optionsEnergiaXDemanda,
        },
        {
            section: "desempenho",
            chart: chartDesempenho,
            options: optionsDesempenho,
        },
        {
            section: "energiaxcompensacao",
            chart: chartEnergiaXCompensacao,
            options: optionsEnergiaXCompensacao,
        },
        { section: "bateria", chart: chartBateria, options: optionsBateria },
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
                chart.clearAnnotations();
                divElement.style.display = "none";
            }
        }

        comments.forEach(({ comment, date }) => {
            addAnnotationToChart(date, comment, chart, options);
        });
    });
}

function loadGeneralCommentsIntoDashboard(userComments) {
    const sections = [
        {
            section: "fotovoltaica",
            chart: chartFotovoltaica,
            options: optionsFotovoltaica,
        },
        { section: "eolica", chart: chartEolica, options: optionsEolica },
        {
            section: "energiaxdemanda",
            chart: chartEnergiaXDemanda,
            options: optionsEnergiaXDemanda,
        },
        {
            section: "desempenho",
            chart: chartDesempenho,
            options: optionsDesempenho,
        },
        {
            section: "energiaxcompensacao",
            chart: chartEnergiaXCompensacao,
            options: optionsEnergiaXCompensacao,
        },
        { section: "bateria", chart: chartBateria, options: optionsBateria },
        { section: "stsolar", chart: chartSTSolar, options: optionsSTSolar },
        { section: "stvento", chart: chartSTVento, options: optionsSTVento },
    ];

    sections.forEach(({ section }) => {
        const textarea = document.getElementById(`gc_input_${section}`); // area do comentario geral

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
                    `delete_date_container_${section}`
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

let optionsFotovoltaica;
let optionsEolica;
let optionsEnergiaXDemanda;
let optionsDesempenho;
let optionsEnergiaXCompensacao;
let optionsBateria;
let optionsSTSolar;
let optionsSTVento;

// Carrega os dados do json e preenche nos gráficos
// Cada "options" contém as configurações dos gráficos (tipo, cores, dados, nomes, etc.)
// Poderia estar em um outro arquivo talvez.
async function loadData() {
    try {
        const response = await fetch("../../../dados/dados.json");
        const data = await response.json();

        /* OPTIONS FOTOVOLTAICA */
        optionsFotovoltaica = {
            series: [
                {
                    name: "Energia Fotovoltaica",
                    color: "#2638DA",
                    data: data.energiaF,
                },
            ],
            chart: {
                height: 350,
                type: "line",
                width: "100%",
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
            dataLabels: {
                enabled: false,
            },
            stroke: {
                curve: "straight",
            },
            title: {
                text: "Produção de Energia Fotovoltaica",
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
                row: {
                    colors: ["#f3f3f3", "transparent"],
                    opacity: 0.5,
                },
            },
            xaxis: {
                title: {
                    text: "Dia",
                },
                type: "datetime",
                min: new Date("01 Feb 2004").getTime(),
                categories: data.data,
            },
            yaxis: {
                title: {
                    text: "Energia (kWh)",
                },
                decimalsInFloat: 3,
            },
        };

        /* OPTIONS EOLICA */
        optionsEolica = {
            series: [
                {
                    name: "Energia Eólica",
                    color: "#19AA16",
                    data: data.energiaV,
                },
            ],
            chart: {
                height: 350,
                type: "line",
                zoom: {
                    autoScaleXasis: true,
                },
                width: "100%",
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
            dataLabels: {
                enabled: false,
            },
            stroke: {
                curve: "straight",
            },
            title: {
                text: "Produção de Energia Eólica",
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
                row: {
                    colors: ["#f3f3f3", "transparent"],
                    opacity: 0.5,
                },
            },
            xaxis: {
                title: {
                    text: "Dia",
                },
                type: "datetime",
                min: new Date("01 Feb 2004").getTime(),
                categories: data.data,
            },
            yaxis: {
                title: {
                    text: "Energia (kWh)",
                },
                decimalsInFloat: 3,
            },
        };

        /* OPTIONS ENERGIA X DEMANDA */
        optionsEnergiaXDemanda = {
            series: [
                {
                    name: "Energia produzida",
                    type: "line",
                    color: "#A155B9",
                    data: data.energiaP,
                },
                {
                    name: "Demanda Enegética",
                    type: "line",
                    color: "#E0CE2A",
                    data: data.demanda,
                },
            ],
            chart: {
                height: 350,
                type: "line",
                stacked: false,
                width: "100%",
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
            dataLabels: {
                enabled: false,
            },
            stroke: {
                width: 2,
            },
            title: {
                text: "Produção de energia x Demanda energética",
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
                title: {
                    text: "Dia",
                },
                type: "datetime",
                min: new Date("01 Feb 2004").getTime(),
                categories: data.data,
            },
            yaxis: {
                title: {
                    text: "Energia (kWh)",
                },
                decimalsInFloat: 3,
                labels: {
                    style: {
                        colors: ["#E0CE2A", "#A155B9"], // Cores das séries
                    },
                },
            },
            legend: {
                horizontalAlign: "left",
                offsetX: 40,
            },
            title: {
                text: "Produção de Energia x Demanda Energética",
                align: "center",
                margin: 60,
                style: {
                    fontSize: "20px",
                    fontWeight: "bold",
                    fontFamily: "Arial",
                    color: "#263238",
                },
            },
        };

        /* OPTIONS DESEMPENHO*/
        optionsDesempenho = {
            series: [
                {
                    name: "Energia Fotovoltaica",
                    type: "column",
                    data: data.energiaF,
                },
                {
                    name: "Net metering",
                    type: "area",
                    data: data.netMetering,
                },
                {
                    name: "Carga",
                    type: "line",
                    data: data.carga,
                },
                {
                    name: "Grid público",
                    type: "area",
                    color: "#A7B7F3",
                    data: data.grid,
                },
                {
                    name: "Energia Eólica",
                    type: "area",
                    color: "#EC9340",
                    data: data.energiaV,
                },
                {
                    name: "Energia da bateria",
                    type: "line",
                    color: "#FF0101",
                    data: data.bateria,
                },
            ],
            chart: {
                height: 350,
                type: "line",
                stacked: false,
                width: "100%",
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
            stroke: {
                width: [0, 2, 3, 2, 3, 3],
                dashArray: [0, 0, 0, 0, 0, 5],
                curve: "smooth",
            },
            plotOptions: {
                bar: {
                    columnWidth: "50%",
                },
            },
            fill: {
                opacity: [0.85, 0.25, 1],
                gradient: {
                    inverseColors: false,
                    shade: "light",
                    type: "vertical",
                    opacityFrom: 0.85,
                    opacityTo: 0.55,
                    stops: [0, 100, 100, 100],
                },
            },
            markers: {
                size: 0,
            },
            xaxis: {
                title: {
                    text: "Dia",
                },
                type: "datetime",
                categories: data.data,
            },
            yaxis: {
                title: {
                    text: "Energia (kWh)",
                },
                decimalsInFloat: 3,
            },
            legend: {
                horizontalAlign: "left",
                offsetX: 40,
            },
            title: {
                text: "Desempenho",
                align: "center",
                margin: 60,
                style: {
                    fontSize: "20px",
                    fontWeight: "bold",
                    fontFamily: "Arial",
                    color: "#263238",
                },
            },
            tooltip: {
                shared: true,
                intersect: false,
                y: {
                    formatter: function (y) {
                        if (typeof y !== "undefined") {
                            return y.toFixed(0) + " Kw";
                        }
                        return y;
                    },
                },
            },
        };

        /* OPTIONS ENERGIA X COMPENSAÇÃO */
        optionsEnergiaXCompensacao = {
            series: [
                {
                    name: "Energia produzida",
                    type: "line",
                    color: "#A155B9",
                    data: data.energiaP,
                },
                {
                    name: "Net metering",
                    type: "line",
                    color: "#36ADE8",
                    data: data.netMetering,
                },
            ],
            chart: {
                height: 350,
                type: "line",
                stacked: false,
                width: "100%",
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
            dataLabels: {
                enabled: false,
            },
            stroke: {
                width: 2,
                dashArray: [5, 0],
            },
            xaxis: {
                title: {
                    text: "Dia",
                },
                type: "datetime",
                min: new Date("01 Feb 2004").getTime(),
                categories: data.data,
            },
            yaxis: [
                {
                    title: {
                        text: "Energia (kWh)",
                    },
                    decimalsInFloat: 3,
                },
            ],
            legend: {
                horizontalAlign: "left",
                offsetX: 40,
            },
            title: {
                text: "Produção de Energia x Compensação",
                align: "center",
                margin: 60,
                style: {
                    fontSize: "20px",
                    fontWeight: "bold",
                    fontFamily: "Arial",
                    color: "#263238",
                },
            },
        };

        /* OPTIONS BATERIA */
        optionsBateria = {
            series: [
                {
                    name: "Carga",
                    data: data.carga,
                },
                {
                    name: "Descarga",
                    data: data.descarga,
                },
            ],
            chart: {
                type: "bar",
                height: 440,
                stacked: true,
                width: "100%",
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
            },
            yaxis: {
                stepSize: 10,
                decimalsInFloat: 3,
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
                text: "Quantidade de cargas e descargas",
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
                title: {
                    text: "tempo",
                },
                type: "datetime",
                min: new Date("01 Feb 2004").getTime(),
                categories: data.data,
                title: {
                    text: "Dia",
                },
                labels: {
                    format: "MMM 'yy",
                },
            },
            yaxis: [
                {
                    title: {
                        text: "Energia (kWh)",
                    },
                    decimalsInFloat: 3,
                },
            ],
        };

        /* OPTIONS ST SOLAR */
        const irradiacoes = data.irradiacao.map((item) => item[1]);
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
                },
                width: "100%",
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
                            text: "Média",
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
                min: new Date("01 Feb 2004").getTime(),
                categories: data.data,
            },
            yaxis: {
                title: {
                    text: "Irradiação solar (Wh/m^2)",
                },
                decimalsInFloat: 3,
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
                },
                width: "100%",
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
                            text: "Média",
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
                min: new Date("01 Feb 2004").getTime(),
                categories: data.data,
            },
            yaxis: {
                title: {
                    text: "Velocidade do vento (m/s)",
                },
                decimalsInFloat: 3,
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

const THIRD_BREAKPOINT = 500;
const SECOND_BREAKPOINT = 768;
const FIRST_BREAKPOINT = 1024;

function aplicarZoomMobile(chart) {
    if (window.innerWidth <= FIRST_BREAKPOINT) {
        const dataInicio = new Date("01 Feb 2004").getTime();
        const dataFim = new Date("30 Jul 2004").getTime();
        chart.zoomX(dataInicio, dataFim);
    }
    if (window.innerWidth <= SECOND_BREAKPOINT) {
        const dataInicio = new Date("01 Feb 2004").getTime();
        const dataFim = new Date("30 Apr 2004").getTime();
        chart.zoomX(dataInicio, dataFim);
    }
    if (window.innerWidth <= FIRST_BREAKPOINT) {
        const dataInicio = new Date("01 Feb 2004").getTime();
        const dataFim = new Date("31 Mar 2004").getTime();
        chart.zoomX(dataInicio, dataFim);
    }
}

/*==================== RENDERIZANDO GRÁFICOS ====================*/

/* .render() cria o gráfico com as options dadas */

/*
 * cada "periods..." indica um possível período de tempo do gráfico, selecionável por meio dos botões
 * o id faz referência ao html
 */

/* ========== GRÁFICO ENERGIA FOTOVOLTAICA ========== */
var chartFotovoltaica = new ApexCharts(
    document.querySelector("#chartFotovoltaica"),
    optionsFotovoltaica
);
chartFotovoltaica.render().then(() => aplicarZoomMobile(chartFotovoltaica));

var resetCssClasses = function (activeEl) {
    var els = document.querySelectorAll("button");

    Array.prototype.forEach.call(els, function (el) {
        el.classList.remove("active");
    });

    activeEl.target.classList.add("active");
};

const periodsFotovoltaica = [
    { id: "#fev_f", start: "01 Feb 2004", end: "29 Feb 2004" },
    { id: "#fev_2005_f", start: "01 Feb 2005", end: "03 Feb 2005" },
    { id: "#jan_f", start: "01 Jan 2005", end: "30 Jan 2005" },
    { id: "#mar_f", start: "01 Mar 2004", end: "31 Mar 2004" },
    { id: "#abr_f", start: "01 Apr 2004", end: "30 Apr 2004" },
    { id: "#mai_f", start: "01 May 2004", end: "30 May 2004" },
    { id: "#jun_f", start: "01 Jun 2004", end: "30 Jun 2004" },
    { id: "#jul_f", start: "01 Jul 2004", end: "30 Jul 2004" },
    { id: "#ago_f", start: "01 Aug 2004", end: "30 Aug 2004" },
    { id: "#set_f", start: "01 Sept 2004", end: "30 Sept 2004" },
    { id: "#out_f", start: "01 Oct 2004", end: "30 Oct 2004" },
    { id: "#nov_f", start: "01 Nov 2004", end: "30 Nov 2004" },
    { id: "#dez_f", start: "01 Dec 2004", end: "30 Dec 2004" },
    { id: "#sem1_f", start: "01 Feb 2004", end: "30 Jul 2004" },
    { id: "#sem2_f", start: "01 Aug 2004", end: "03 Feb 2005" },
    { id: "#one_year_f", start: "01 Feb 2004", end: "03 Feb 2005" },
];

// mudar o gráfico de acordo com o botão clicado
periodsFotovoltaica.forEach((period) => {
    document.querySelector(period.id).addEventListener("click", function (e) {
        resetCssClasses(e);
        chartFotovoltaica.zoomX(
            new Date(period.start).getTime(),
            new Date(period.end).getTime()
        );
    });
});

/* ========== GRÁFICO ENERGIA EÓLICA ========== */
var chartEolica = new ApexCharts(
    document.querySelector("#chartEolica"),
    optionsEolica
);
chartEolica.render().then(() => aplicarZoomMobile(chartEolica));

const periodsEolica = [
    { id: "#fev_e", start: "01 Feb 2004", end: "29 Feb 2004" },
    { id: "#fev_2005_e", start: "01 Feb 2005", end: "03 Feb 2005" },
    { id: "#jan_e", start: "01 Jan 2005", end: "30 Jan 2005" },
    { id: "#mar_e", start: "01 Mar 2004", end: "31 Mar 2004" },
    { id: "#abr_e", start: "01 Apr 2004", end: "30 Apr 2004" },
    { id: "#mai_e", start: "01 May 2004", end: "30 May 2004" },
    { id: "#jun_e", start: "01 Jun 2004", end: "30 Jun 2004" },
    { id: "#jul_e", start: "01 Jul 2004", end: "30 Jul 2004" },
    { id: "#ago_e", start: "01 Aug 2004", end: "30 Aug 2004" },
    { id: "#set_e", start: "01 Sept 2004", end: "30 Sept 2004" },
    { id: "#out_e", start: "01 Oct 2004", end: "30 Oct 2004" },
    { id: "#nov_e", start: "01 Nov 2004", end: "30 Nov 2004" },
    { id: "#dez_e", start: "01 Dec 2004", end: "30 Dec 2004" },
    { id: "#sem1_e", start: "01 Feb 2004", end: "30 Jul 2004" },
    { id: "#sem2_e", start: "01 Aug 2004", end: "03 Feb 2005" },
    { id: "#one_year_e", start: "01 Feb 2004", end: "03 Feb 2005" },
];

// mudar o gráfico de acordo com o botão clicado
periodsEolica.forEach((period) => {
    document.querySelector(period.id).addEventListener("click", function (e) {
        resetCssClasses(e);
        chartEolica.zoomX(
            new Date(period.start).getTime(),
            new Date(period.end).getTime()
        );
    });
});

/* ========== GRÁFICO ENERGIA X DEMANDA ======== */
var chartEnergiaXDemanda = new ApexCharts(
    document.querySelector("#chartEnergiaXDemanda"),
    optionsEnergiaXDemanda
);
chartEnergiaXDemanda
    .render()
    .then(() => aplicarZoomMobile(chartEnergiaXDemanda));

const periodsEnergiaXDemanda = [
    { id: "#fev_exd", start: "01 Feb 2004", end: "29 Feb 2004" },
    { id: "#fev_2005_exd", start: "01 Feb 2005", end: "03 Feb 2005" },
    { id: "#jan_exd", start: "01 Jan 2005", end: "30 Jan 2005" },
    { id: "#mar_exd", start: "01 Mar 2004", end: "31 Mar 2004" },
    { id: "#abr_exd", start: "01 Apr 2004", end: "30 Apr 2004" },
    { id: "#mai_exd", start: "01 May 2004", end: "30 May 2004" },
    { id: "#jun_exd", start: "01 Jun 2004", end: "30 Jun 2004" },
    { id: "#jul_exd", start: "01 Jul 2004", end: "30 Jul 2004" },
    { id: "#ago_exd", start: "01 Aug 2004", end: "30 Aug 2004" },
    { id: "#set_exd", start: "01 Sept 2004", end: "30 Sept 2004" },
    { id: "#out_exd", start: "01 Oct 2004", end: "30 Oct 2004" },
    { id: "#nov_exd", start: "01 Nov 2004", end: "30 Nov 2004" },
    { id: "#dez_exd", start: "01 Dec 2004", end: "30 Dec 2004" },
    { id: "#sem1_exd", start: "01 Feb 2004", end: "30 Jul 2004" },
    { id: "#sem2_exd", start: "01 Aug 2004", end: "03 Feb 2005" },
    { id: "#one_year_exd", start: "01 Feb 2004", end: "03 Feb 2005" },
];

// mudar o gráfico de acordo com o botão clicado
periodsEnergiaXDemanda.forEach((period) => {
    document.querySelector(period.id).addEventListener("click", function (e) {
        resetCssClasses(e);
        chartEnergiaXDemanda.zoomX(
            new Date(period.start).getTime(),
            new Date(period.end).getTime()
        );
    });
});

/* ========== GRÁFICO DESEMPENHO ========== */
var chartDesempenho = new ApexCharts(
    document.querySelector("#chartDesempenho"),
    optionsDesempenho
);
chartDesempenho.render().then(() => aplicarZoomMobile(chartDesempenho));

const periodsDesempenho = [
    { id: "#fev_des", start: "01 Feb 2004", end: "29 Feb 2004" },
    { id: "#fev_2005_des", start: "01 Feb 2005", end: "03 Feb 2005" },
    { id: "#jan_des", start: "01 Jan 2005", end: "30 Jan 2005" },
    { id: "#mar_des", start: "01 Mar 2004", end: "31 Mar 2004" },
    { id: "#abr_des", start: "01 Apr 2004", end: "30 Apr 2004" },
    { id: "#mai_des", start: "01 May 2004", end: "30 May 2004" },
    { id: "#jun_des", start: "01 Jun 2004", end: "30 Jun 2004" },
    { id: "#jul_des", start: "01 Jul 2004", end: "30 Jul 2004" },
    { id: "#ago_des", start: "01 Aug 2004", end: "30 Aug 2004" },
    { id: "#set_des", start: "01 Sept 2004", end: "30 Sept 2004" },
    { id: "#out_des", start: "01 Oct 2004", end: "30 Oct 2004" },
    { id: "#nov_des", start: "01 Nov 2004", end: "30 Nov 2004" },
    { id: "#dez_des", start: "01 Dec 2004", end: "30 Dec 2004" },
    { id: "#sem1_des", start: "01 Feb 2004", end: "30 Jul 2004" },
    { id: "#sem2_des", start: "01 Aug 2004", end: "03 Feb 2005" },
    { id: "#one_year_des", start: "01 Feb 2004", end: "03 Feb 2005" },
];

// mudar o gráfico de acordo com o botão clicado
periodsDesempenho.forEach((period) => {
    document.querySelector(period.id).addEventListener("click", function (e) {
        resetCssClasses(e);
        chartDesempenho.zoomX(
            new Date(period.start).getTime(),
            new Date(period.end).getTime()
        );
    });
});

/* ========== GRÁFICO ENERGIA X COMPENSAÇÃO ========== */
var chartEnergiaXCompensacao = new ApexCharts(
    document.querySelector("#chartEnergiaXCompensacao"),
    optionsEnergiaXCompensacao
);
chartEnergiaXCompensacao
    .render()
    .then(() => aplicarZoomMobile(chartEnergiaXCompensacao));

const periodsEnergiaXCompensacao = [
    { id: "#fev_exc", start: "01 Feb 2004", end: "29 Feb 2004" },
    { id: "#fev_2005_exc", start: "01 Feb 2005", end: "03 Feb 2005" },
    { id: "#jan_exc", start: "01 Jan 2005", end: "30 Jan 2005" },
    { id: "#mar_exc", start: "01 Mar 2004", end: "31 Mar 2004" },
    { id: "#abr_exc", start: "01 Apr 2004", end: "30 Apr 2004" },
    { id: "#mai_exc", start: "01 May 2004", end: "30 May 2004" },
    { id: "#jun_exc", start: "01 Jun 2004", end: "30 Jun 2004" },
    { id: "#jul_exc", start: "01 Jul 2004", end: "30 Jul 2004" },
    { id: "#ago_exc", start: "01 Aug 2004", end: "30 Aug 2004" },
    { id: "#set_exc", start: "01 Sept 2004", end: "30 Sept 2004" },
    { id: "#out_exc", start: "01 Oct 2004", end: "30 Oct 2004" },
    { id: "#nov_exc", start: "01 Nov 2004", end: "30 Nov 2004" },
    { id: "#dez_exc", start: "01 Dec 2004", end: "30 Dec 2004" },
    { id: "#sem1_exc", start: "01 Feb 2004", end: "30 Jul 2004" },
    { id: "#sem2_exc", start: "01 Aug 2004", end: "03 Feb 2005" },
    { id: "#one_year_exc", start: "01 Feb 2004", end: "03 Feb 2005" },
];

// mudar o gráfico de acordo com o botão clicado
periodsEnergiaXCompensacao.forEach((period) => {
    document.querySelector(period.id).addEventListener("click", function (e) {
        resetCssClasses(e);
        chartEnergiaXCompensacao.zoomX(
            new Date(period.start).getTime(),
            new Date(period.end).getTime()
        );
    });
});

/* ========== GRÁFICO BATERIA ==========*/
var chartBateria = new ApexCharts(
    document.querySelector("#chartBateria"),
    optionsBateria
);
chartBateria.render().then(() => aplicarZoomMobile(chartBateria));

const periodsBateria = [
    { id: "#fev_bat", start: "01 Feb 2004", end: "29 Feb 2004" },
    { id: "#fev_2005_bat", start: "01 Feb 2005", end: "03 Feb 2005" },
    { id: "#jan_bat", start: "01 Jan 2005", end: "30 Jan 2005" },
    { id: "#mar_bat", start: "01 Mar 2004", end: "31 Mar 2004" },
    { id: "#abr_bat", start: "01 Apr 2004", end: "30 Apr 2004" },
    { id: "#mai_bat", start: "01 May 2004", end: "30 May 2004" },
    { id: "#jun_bat", start: "01 Jun 2004", end: "30 Jun 2004" },
    { id: "#jul_bat", start: "01 Jul 2004", end: "30 Jul 2004" },
    { id: "#ago_bat", start: "01 Aug 2004", end: "30 Aug 2004" },
    { id: "#set_bat", start: "01 Sept 2004", end: "30 Sept 2004" },
    { id: "#out_bat", start: "01 Oct 2004", end: "30 Oct 2004" },
    { id: "#nov_bat", start: "01 Nov 2004", end: "30 Nov 2004" },
    { id: "#dez_bat", start: "01 Dec 2004", end: "30 Dec 2004" },
    { id: "#sem1_bat", start: "01 Feb 2004", end: "30 Jul 2004" },
    { id: "#sem2_bat", start: "01 Aug 2004", end: "03 Feb 2005" },
    { id: "#one_year_bat", start: "01 Feb 2004", end: "03 Feb 2005" },
];

// mudar o gráfico de acordo com o botão clicado
periodsBateria.forEach((period) => {
    document.querySelector(period.id).addEventListener("click", function (e) {
        resetCssClasses(e);
        chartBateria.zoomX(
            new Date(period.start).getTime(),
            new Date(period.end).getTime()
        );
    });
});

/* ========== GRÁFICO ST SOLAR ========== */
var chartSTSolar = new ApexCharts(
    document.querySelector("#chartSTSolar"),
    optionsSTSolar
);
chartSTSolar.render().then(() => aplicarZoomMobile(chartSTSolar));

const periodsSTSolar = [
    { id: "#fev_sts", start: "01 Feb 2004", end: "29 Feb 2004" },
    { id: "#fev_2005_sts", start: "01 Feb 2005", end: "03 Feb 2005" },
    { id: "#jan_sts", start: "01 Jan 2005", end: "30 Jan 2005" },
    { id: "#mar_sts", start: "01 Mar 2004", end: "31 Mar 2004" },
    { id: "#abr_sts", start: "01 Apr 2004", end: "30 Apr 2004" },
    { id: "#mai_sts", start: "01 May 2004", end: "30 May 2004" },
    { id: "#jun_sts", start: "01 Jun 2004", end: "30 Jun 2004" },
    { id: "#jul_sts", start: "01 Jul 2004", end: "30 Jul 2004" },
    { id: "#ago_sts", start: "01 Aug 2004", end: "30 Aug 2004" },
    { id: "#set_sts", start: "01 Sept 2004", end: "30 Sept 2004" },
    { id: "#out_sts", start: "01 Oct 2004", end: "30 Oct 2004" },
    { id: "#nov_sts", start: "01 Nov 2004", end: "30 Nov 2004" },
    { id: "#dez_sts", start: "01 Dec 2004", end: "30 Dec 2004" },
    { id: "#sem1_sts", start: "01 Feb 2004", end: "30 Jul 2004" },
    { id: "#sem2_sts", start: "01 Aug 2004", end: "03 Feb 2005" },
    { id: "#one_year_sts", start: "01 Feb 2004", end: "03 Feb 2005" },
];

// mudar o gráfico de acordo com o botão clicado
periodsSTSolar.forEach((period) => {
    document.querySelector(period.id).addEventListener("click", function (e) {
        resetCssClasses(e);
        chartSTSolar.zoomX(
            new Date(period.start).getTime(),
            new Date(period.end).getTime()
        );
    });
});

/* ========== GRÁFICO ST VENTO ========== */
var chartSTVento = new ApexCharts(
    document.querySelector("#chartSTVento"),
    optionsSTVento
);
chartSTVento.render().then(() => aplicarZoomMobile(chartSTVento));

const periodsSTVento = [
    { id: "#fev_stv", start: "01 Feb 2004", end: "29 Feb 2004" },
    { id: "#fev_2005_stv", start: "01 Feb 2005", end: "03 Feb 2005" },
    { id: "#jan_stv", start: "01 Jan 2005", end: "30 Jan 2005" },
    { id: "#mar_stv", start: "01 Mar 2004", end: "31 Mar 2004" },
    { id: "#abr_stv", start: "01 Apr 2004", end: "30 Apr 2004" },
    { id: "#mai_stv", start: "01 May 2004", end: "30 May 2004" },
    { id: "#jun_stv", start: "01 Jun 2004", end: "30 Jun 2004" },
    { id: "#jul_stv", start: "01 Jul 2004", end: "30 Jul 2004" },
    { id: "#ago_stv", start: "01 Aug 2004", end: "30 Aug 2004" },
    { id: "#set_stv", start: "01 Sept 2004", end: "30 Sept 2004" },
    { id: "#out_stv", start: "01 Oct 2004", end: "30 Oct 2004" },
    { id: "#nov_stv", start: "01 Nov 2004", end: "30 Nov 2004" },
    { id: "#dez_stv", start: "01 Dec 2004", end: "30 Dec 2004" },
    { id: "#sem1_stv", start: "01 Feb 2004", end: "30 Jul 2004" },
    { id: "#sem2_stv", start: "01 Aug 2004", end: "03 Feb 2005" },
    { id: "#one_year_stv", start: "01 Feb 2004", end: "03 Feb 2005" },
];

// mudar o gráfico de acordo com o botão clicado
periodsSTVento.forEach((period) => {
    document.querySelector(period.id).addEventListener("click", function (e) {
        resetCssClasses(e);
        chartSTVento.zoomX(
            new Date(period.start).getTime(),
            new Date(period.end).getTime()
        );
    });
});

// tirando o aviso de "Carregando gráfico"
let loadingChartWarning = document.querySelectorAll(".loading_chart");
loadingChartWarning.forEach((element) => (element.style.display = "none"));
