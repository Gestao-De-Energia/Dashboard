import { db, auth } from "./firebase.js";
import { doc, updateDoc, setDoc, getDoc, arrayRemove, arrayUnion, deleteField } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js';

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

export async function saveUserCommentByDate(commentSectionId, comment, date) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            return; // não será salvo
        }

        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return;
        }

        let userData = userDoc.data();
        let fieldKey = "";

        switch(commentSectionId) {
            case "#comment_section_fotovoltaica":
                fieldKey = "commentByDateFotovoltaica";
                break;
            case "#comment_section_eolica":
                fieldKey = "commentByDateEolica";
                break;
            case "#comment_section_energiaxdemanda":
                fieldKey = "commentByDateEnergiaXDemanda";
                break;
            case "#comment_section_desempenho":
                fieldKey = "commentByDateDesempenho";
                break;
            case "#comment_section_energiaxcompensacao":
                fieldKey = "commentByDateEnergiaXCompensacao";
                break;
            case "#comment_section_bateria":
                fieldKey = "commentByDateBateria";
                break;
            case "#comment_section_stsolar":
                fieldKey = "commentByDateSTSolar";
                break;
            case "#comment_section_stvento":
                fieldKey = "commentByDateSTVento";
                break;
            default:
                fieldKey = "commentByDateUndefinedChart";
        }

        let existingComments = userData[fieldKey] || [];
        
        // encontrar se já existe um comentário nessa data
        const existingComment = existingComments.find(commentObj => commentObj.date === date);

        let updateData = {};

        if (existingComment) {
            // remove o comentário antigo da mesma data
            await updateDoc(userRef, {
                [fieldKey]: arrayRemove(existingComment)
            });
        }

        // adiciona o novo comentário
        updateData[fieldKey] = arrayUnion({ comment, date });

        await updateDoc(userRef, updateData);

    } catch (error) {
        console.error("Erro ao salvar comentário: ", error);
    }
}

export async function deleteUserCommentByDate(sectionKey, date) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            return;
        }

        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return;
        }

        let userData = userDoc.data();
        let comments = userData[sectionKey] || [];

        const commentToRemove = comments.find(comment => comment.date === date);

        if (commentToRemove) {
            await updateDoc(userRef, {
                [sectionKey]: arrayRemove(commentToRemove)
            });
        }
    } catch (error) {
        console.error("Erro ao deletar comentário:", error);
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
            [fieldName]: deleteField()
        });

        console.log(`Comentário geral deletado para ${graphName}`);

    } catch (error) {
        console.error("Erro ao deletar comentário geral: ", error);
    }
}

