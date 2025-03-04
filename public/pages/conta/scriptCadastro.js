import { auth } from "../../../db/firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { addUser } from "../../../db/setters.js";

const pwShowHide = document.querySelectorAll(".showHidePw");
const pwFields = document.querySelectorAll(".password");

/* Olho riscado/não-riscado no campo Senha */
pwShowHide.forEach((eyeIcon) => {
    eyeIcon.addEventListener("click", () => {
        pwFields.forEach((pwField) => {
            if (pwField.type === "password") {
                pwField.type = "text";
                pwShowHide.forEach((icon) => {
                    icon.classList.replace("fa-eye-slash", "fa-eye");
                });
            } else {
                pwField.type = "password";
                pwShowHide.forEach((icon) => {
                    icon.classList.replace("fa-eye", "fa-eye-slash");
                });
            }
        });
    });
});

/* Adicionando novo usuário ao banco de dados */
const partialSubmitBtn = document.getElementById("partialSubmitBtn");
const consSubmitBtn = document.getElementById("consSubmitBtn");
const pesqSubmitBtn = document.getElementById("pesqSubmitBtn");
const consPesqSubmitBtn = document.getElementById("consPesqSubmitBtn");

async function getFormData() {
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const pesquisador = document.getElementById('logCheckPesquisador').checked;
    const consumidor = document.getElementById('logCheckConsumidor').checked;

    return {
        nome,
        email,
        senha,
        pesquisador,
        consumidor,
    };
}

function validateFormData(user) {
    const fields = [
        { id: 'nome', warningId: 'name-warning' },
        { id: 'email', warningId: 'email-warning' },
        { id: 'senha', warningId: 'password-warning' },
    ];

    let isValid = true;

    fields.forEach(({ id, warningId }) => {
        const warningElement = document.getElementById(warningId);
        if (!user[id]) {
            warningElement.style.display = "flex";
            isValid = false;
        } else {
            warningElement.style.display = "none";
        }
    });

    // Validação dos checkboxes (pelo menos um deve estar selecionado)
    const profileWarning = document.getElementById('profile-warning');
    if (!user.pesquisador && !user.consumidor) {
        profileWarning.style.display = "flex";
        isValid = false;
    } else {
        profileWarning.style.display = "none";
    }

    return isValid;
}

async function handlePartialSignup(){
    const partialUser = await getFormData();
    let { nome, email, senha, pesquisador, consumidor } = partialUser;

    if (!validateFormData(partialUser)) {
        return;
    }

    sessionStorage.setItem("partialUser", JSON.stringify(partialUser));
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        console.log("Usuário autenticado no Firebase:", user);

        // Salvar os dados no sessionStorage para completar depois
        const partialUser = {
            uid: user.uid,  // ID do Firebase Authentication
            nome,
            email,
            pesquisador,
            consumidor
        };

        sessionStorage.setItem("partialUser", JSON.stringify(partialUser));

        if (pesquisador && consumidor) {
            window.location.href = "./cadastroConsPesq.html";
        } else if (pesquisador) {
            window.location.href = "./cadastroacPesq.html";
        } else if (consumidor) {
            window.location.href = "./cadastroacCons.html";
        }
    } catch (error) {
        console.error("Erro ao criar usuário:", error);

        const emailWarning = document.getElementById("email-warning");
        const passwordWarning = document.getElementById("password-warning");

        if (error.code === "auth/invalid-email") {
            emailWarning.style.display = "flex";
        } else if (error.code === "auth/email-already-in-use") {
            emailWarning.style.display = "flex";
            emailWarning.textContent = "Este email já está em uso.";
        } else if (error.code == "auth/weak-password"){
            passwordWarning.style.display = "flex";
            passwordWarning.textContent = "A senha deve ter pelo menos 6 caracteres.";
        }
    }
}

async function handleFullSignup(btn) {
    const partialUser = JSON.parse(sessionStorage.getItem("partialUser"));
    
    if (!partialUser) {
        alert("Erro: Nenhum dado encontrado.");
        return;
    }

    let intervalId;

    function startLoadingAnimation() {
        let dots = 0;
        intervalId = setInterval(() => {
            dots = (dots + 1) % 4; // Alterna entre 0, 1, 2, 3
            btn.value = "Cadastrando" + ".".repeat(dots);
        }, 500); // Atualiza a cada 500ms
    }

    function stopLoadingAnimation() {
        clearInterval(intervalId);
        btn.value = "Enviar"; // Volta para o texto original
    }

    let formacaoAcademica = null;
    let areaPesquisa = null;
    let lattes = null;
    let linkedin = null
    let regiao = null
    let tipoConsumidor = null; 
    let fonteEnergia = null;

    if (partialUser.pesquisador) {
        formacaoAcademica = document.getElementById("formacao_academica").value; 
        areaPesquisa = document.getElementById("area_pesquisa").value; 
        lattes = document.getElementById("lattes").value; 
        linkedin = document.getElementById("linkedin").value; 
    }

    if (partialUser.consumidor) {
        regiao = document.getElementById("regiao").value; 
        tipoConsumidor = document.getElementById("tipo_consumidor").value; 
        fonteEnergia = document.getElementById("fonte_energia").value; 
    }

    const completeUser = { ...partialUser, formacaoAcademica, areaPesquisa, lattes, linkedin, regiao, tipoConsumidor, fonteEnergia};
    
    try {
        startLoadingAnimation();
        await addUser(completeUser);
    } catch (error) {
        console.error("Erro ao cadastrar usuário: ", error);
    } finally {
        stopLoadingAnimation();
    }
}

if (partialSubmitBtn) {
    partialSubmitBtn.addEventListener("click", handlePartialSignup);
}

if (consSubmitBtn) {
    consSubmitBtn.addEventListener("click", async () => {
        await handleFullSignup(consSubmitBtn);
        window.location.href = "../dashboard/consumidor/cons.html";
    });
}

if (pesqSubmitBtn){
    pesqSubmitBtn.addEventListener("click", async () => {
        await handleFullSignup(pesqSubmitBtn);
        window.location.href = "../dashboard/pesquisador/pesq.html";
    });
}

if (consPesqSubmitBtn) {
    consPesqSubmitBtn.addEventListener("click", async () => {
        await handleFullSignup(consPesqSubmitBtn);
        window.location.href = "../home/home.html";
    });
}