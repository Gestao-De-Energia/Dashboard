import { db, auth } from "./firebase.js";
import { doc, getDoc, getDocs, collection, query, where } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

export async function getUser(userId){
    try {
        const query = await getDoc(doc(db, 'users', userId));

        if (query.exists()) {
            const user = query.data();
            return user;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Erro ao buscar o usuário: ", error);
        return null;
    }
}

export async function checkIfEmailExists(email) {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        return !querySnapshot.empty; // Retorna `true` se encontrar o email, `false` caso contrário
    } catch (error) {
        console.error("Erro ao verificar email no Firestore:", error);
        return false;
    }
}

/* Pegando todos os comentários por data */
export async function getAllUserCommentsByDate() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            return {};
        }

        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return {};
        }

        const userData = userDoc.data();

        const commentFields = {
            commentByDateFotovoltaica: "fotovoltaica",
            commentByDateEolica: "eolica",
            commentByDateEnergiaXDemanda: "energiaxdemanda",
            commentByDateDesempenho: "desempenho",
            commentByDateEnergiaXCompensacao: "energiaxcompensacao",
            commentByDateBateria: "bateria",
            commentByDateSTSolar: "stsolar",
            commentByDateSTVento: "stvento"
        };

        let commentsByChart = [];

        for (const [field, chartName] of Object.entries(commentFields)) {
            if (userData[field]) {
                commentsByChart[chartName] = userData[field];
            }
        }

        return commentsByChart;
    } catch (error) {
        console.error("Erro ao buscar comentários por data:", error);
        return {};
    }
}

/* Pegando todos os comentários gerais */
export async function getAllUserGeneralComments() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            return {};
        }

        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            return userDoc.data(); // retorna todos os dados do usuário, incluindo os comentários
        }

        return {};
    } catch (error) {
        console.error("Erro ao buscar comentários do usuário: ", error);
        return {};
    }
}
