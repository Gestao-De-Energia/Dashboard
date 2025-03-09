import { db, auth } from "./firebase.js";
import { doc, updateDoc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js';

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

export async function saveUserCommentByDate(graphName, comment, date) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            return; // não será salvo
        }

        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);

        let userData = {};
        if (userDoc.exists()) {
            userData = userDoc.data();
        }

        const fieldName = `dataCommentsByDate${graphName}`;

        let existingComments = userData[fieldName] || [];

        existingComments.push([comment, date]);

        // Atualiza o Firestore com o novo comentário
        await updateDoc(userRef, {
            [fieldName]: existingComments
        });

        console.log(`Comentário salvo para ${graphName}: "${comment}" (${date})`);

    } catch (error) {
        console.error("Erro ao salvar comentário: ", error);
    }
}

export async function saveGeneralUserComment(graphName, comment) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            return;
        }

        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);

        let userData = {};
        if (userDoc.exists()) {
            userData = userDoc.data();
        }

        const fieldName = `generalComment${graphName}`;

        // atualiza o Firestore com o novo comentário
        await updateDoc(userRef, {
            [fieldName]: comment
        });

        console.log(`Comentário geral salvo para ${graphName}: "${comment}"`);

    } catch (error) {
        console.error("Erro ao salvar comentário geral: ", error);
    }
}

export async function deleteGeneralUserComment(graphName) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            return;
        }

        const userRef = doc(db, "users", currentUser.uid);
        const fieldName = `generalComment${graphName}`;

        // atualiza o Firestore removendo o comentário (deixa o campo vazio)
        await updateDoc(userRef, {
            [fieldName]: ""
        });

        console.log(`Comentário geral deletado para ${graphName}`);

    } catch (error) {
        console.error("Erro ao deletar comentário geral: ", error);
    }
}

