import { db, auth } from "./firebase.js";
import { doc, updateDoc, setDoc } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js';

export async function addUser(user) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error("Usuário não autenticado.");
        }

        const userRef = doc(db, "users", currentUser.uid);
        await setDoc(userRef, user);

        console.log("Usuário adicionado ao Firestore!");
    } catch (error) {
        console.error("Erro ao adicionar usuário: ", error);
    }
}


export async function updateUser(userId, updatedUser){
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, updatedUser);
    } catch (error) {
        console.error("Erro ao atualizar usuário: ", error);
    }
}