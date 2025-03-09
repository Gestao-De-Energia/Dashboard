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
