import { auth } from "../../db/firebase.js";
import { getUser, checkIfEmailExists } from "../../db/getters.js";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

const pwShowHide = document.querySelectorAll(".showHidePw");
const pwFields = document.querySelectorAll(".password-input");

/* Troca entre olho riscado/não-riscado no campo Senha */
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

document.addEventListener("DOMContentLoaded", () => {
    // Login
    const loginButton = document.querySelector(".login-button");
    const loginWarning = document.getElementById("login-warning");
    const rememberMeCheckbox = document.getElementById("logCheck");

    // Verifica se já existe um usuário autenticado ou um email salvo
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
        document.querySelector(".email-input").value = savedEmail;
        rememberMeCheckbox.checked = true;
    }

    async function handleLogin() {
        const email = document.querySelector(".email-input").value;
        const password = document.querySelector(".password-input").value;

        if (!email || !password) {
            loginWarning.style.display = "flex";
            loginWarning.textContent = "Por favor, preencha todos os campos.";
            return;
        }

        let intervalId;

        // Cria um texto animado com "." ".." "..."
        function startLoadingAnimation(text) {
            let dots = 0;
            intervalId = setInterval(() => {
                dots = (dots + 1) % 4; // Alterna entre 0, 1, 2, 3
                loginButton.value = text + ".".repeat(dots);
            }, 500);
        }

        // Volta o texto do botão para "Login"
        function stopLoadingAnimation() {
            clearInterval(intervalId);
            loginButton.textContent = "Login";
        }

        // Faz login com email e senha passados no input
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log("Usuário autenticado:", user);

            startLoadingAnimation("Entrando");

            const userData = await getUser(user.uid);

            if (!userData) {
                stopLoadingAnimation();
                loginWarning.style.display = "flex";
                loginWarning.textContent = "Erro: Dados do usuário não encontrados.";
                return;
            }

            loginWarning.style.display = "none"; // Esconde aviso

            // Se "Lembre de mim" estiver ativado, salva o email no Local Storage
            if (rememberMeCheckbox.checked) {
                localStorage.setItem("savedEmail", email);
            } else {
                localStorage.removeItem("savedEmail");
            }
            
            // Muda de tela de acordo com o perfil do user
            if (userData.pesquisador && userData.consumidor) {
                window.location.href = "/pages/home/home.html";
            } else if (userData.pesquisador) {
                window.location.href = "/pages/dashboard/pesquisador/pesq.html";
            } else if (userData.consumidor) {
                window.location.href = "/pages/dashboard/consumidor/cons.html";
            } else {
                loginWarning.style.display = "flex";
                loginWarning.textContent = "Erro: Perfil do usuário não definido.";
            }
        } catch (error) {
            console.error("Erro ao autenticar:", error);
            loginWarning.style.display = "flex";
            stopLoadingAnimation();
            loginWarning.textContent = "Erro no email ou senha.";
        }
    };

    // Chamando a função de realizar login ao clicar no botão login
    loginButton.addEventListener("click", async (event) => {
        event.preventDefault();
        handleLogin();
    });

    // O mesmo de cima, mas pressionando "enter" no campo da senha. Acho que pode ser substituído usando um <form> no html
    document.querySelector(".password-input").addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleLogin();
        }
    });


    // Redefinição de senha
    const forgotPasswordLink = document.querySelector(".forgot-password");

    forgotPasswordLink.addEventListener("click", async (event) => {
        event.preventDefault();
        const email = document.querySelector(".email-input").value;

        if (!email) {
            loginWarning.style.display = "flex";
            loginWarning.textContent = "Insira o email para redefinir a senha.";
            return;
        }

        try {
            const emailExists = await checkIfEmailExists(email);

            if (!emailExists) {
                loginWarning.style.display = "flex";
                loginWarning.textContent = "Email não encontrado na base de dados. Verifique e tente novamente.";
                return;
            }

            await sendPasswordResetEmail(auth, email);
            loginWarning.style.display = "flex";
            loginWarning.textContent = "Um email de redefinição de senha foi enviado para " + email;
        } catch (error) {
            console.error("Erro ao enviar email de redefinição:", error);
            loginWarning.style.display = "flex";
            loginWarning.textContent = "Erro ao enviar email. Verifique se o email está correto.";
        }
    });
});