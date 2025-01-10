const container = document.querySelector(".container");
const pwShowHide = document.querySelectorAll(".showHidePw");
const pwFields = document.querySelectorAll(".password");
const signUp = document.querySelector(".signup-link");
const login = document.querySelector(".login-link");

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
login.addEventListener("click", () => {
    container.classList.remove("active");
});
document.getElementById("submitBtn").addEventListener("click", function() {
    // Verificar quais checkboxes estão marcadas
    const checkboxPesquisador = document.getElementById("logCheckPesquisador");
    const checkboxConsumidor = document.getElementById("logCheckConsumidor");

    // Lógica de redirecionamento
    if (checkboxPesquisador.checked && checkboxConsumidor.checked) {
        window.location.href = "cadastroConsPesq.html"; // Redireciona para a página que lida com ambos
    } else if (checkboxPesquisador.checked) {
        window.location.href = "cadastroacPesq.html"; // Redireciona para a página de pesquisador
    } else if (checkboxConsumidor.checked) {
        window.location.href = "cadastroacCons.html"; // Redireciona para a página de consumidor
    } else {
        alert("Selecione pelo menos uma opção!"); // Caso nenhum checkbox esteja marcado
    }
});
