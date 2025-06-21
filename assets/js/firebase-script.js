// 桜町中学校1976年卒業同窓会サイト - Firebase対応版

// Firebase imports (CDN版)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc, 
    onSnapshot,
    orderBy,
    query,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// Firebase Storage import commented out - not used anymore
/*
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
*/

// Firebase設定（実際の値に置き換えてください）
const firebaseConfig = {
  apiKey: "AIzaSyBbckPPDevtc_B_hxCic3aJAA6pV5Dl3m0",
  authDomain: "sakuramachi-1976-alumni.firebaseapp.com",
  projectId: "sakuramachi-1976-alumni",
  storageBucket: "sakuramachi-1976-alumni.firebasestorage.app",
  messagingSenderId: "19557860822",
  appId: "1:19557860822:web:8080a8926793efd2905077",
  measurementId: "G-DL47S18XCM"
};


// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// const storage = getStorage(app); // Storage not used anymore

// データベースコレクション名
const COLLECTIONS = {
    MESSAGES: 'messages',
    PHOTOS: 'photos'
};

// 掲示板機能 - Firebase版
class FirebaseMessageBoard {
    static async init() {
        await this.loadMessages();
        this.setupRealtimeListener();
    }

    static async loadMessages() {
        try {
            const messagesContainer = document.getElementById('comments-container');
            if (!messagesContainer) return;

            // Firestoreからメッセージを取得（作成日時順）
            const q = query(
                collection(db, COLLECTIONS.MESSAGES),
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            messagesContainer.innerHTML = '';

            querySnapshot.forEach((doc) => {
                const message = { id: doc.id, ...doc.data() };
                const messageElement = this.createMessageElement(message);
                messagesContainer.appendChild(messageElement);
            });
        } catch (error) {
            console.error('メッセージの読み込みに失敗しました:', error);
            alert('メッセージの読み込みに失敗しました。ページを再読み込みしてください。');
        }
    }

    static setupRealtimeListener() {
        const messagesContainer = document.getElementById('comments-container');
        if (!messagesContainer) return;

        // リアルタイム更新のリスナーを設定
        const q = query(
            collection(db, COLLECTIONS.MESSAGES),
            orderBy('createdAt', 'desc')
        );

        onSnapshot(q, (querySnapshot) => {
            messagesContainer.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const message = { id: doc.id, ...doc.data() };
                const messageElement = this.createMessageElement(message);
                messagesContainer.appendChild(messageElement);
            });
        });
    }

    static createMessageElement(message) {
        const div = document.createElement('div');
        div.className = 'comment-item';
        
        // 日付フォーマット
        let dateStr = '不明';
        if (message.createdAt && message.createdAt.toDate) {
            dateStr = message.createdAt.toDate().toLocaleDateString('ja-JP');
        }

        div.innerHTML = `
            <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 15px; border-left: 4px solid #3182ce;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <strong>${this.escapeHtml(message.name)}</strong>
                    <div>
                        <span style="color: #666; font-size: 0.9rem;">${dateStr}</span>
                        <button onclick="FirebaseMessageBoard.deleteMessage('${message.id}')" 
                                style="margin-left: 10px; background: #e53e3e; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 0.8rem;">
                            削除
                        </button>
                    </div>
                </div>
                <p style="margin: 5px 0; white-space: pre-wrap;">${this.escapeHtml(message.message)}</p>
            </div>
        `;
        return div;
    }

    static async postMessage() {
        const nameInput = document.getElementById('comment-name');
        const textInput = document.getElementById('comment-text');
        
        const name = nameInput.value.trim();
        const message = textInput.value.trim();

        if (!name || !message) {
            alert('お名前とメッセージを入力してください。');
            return;
        }

        if (message.length > 500) {
            alert('メッセージは500文字以内で入力してください。');
            return;
        }

        try {
            // Firestoreにメッセージを追加
            await addDoc(collection(db, COLLECTIONS.MESSAGES), {
                name: name,
                message: message,
                createdAt: serverTimestamp()
            });

            // フォームをクリア
            nameInput.value = '';
            textInput.value = '';

            alert('メッセージを投稿しました！');
        } catch (error) {
            console.error('投稿に失敗しました:', error);
            alert('投稿に失敗しました。もう一度お試しください。');
        }
    }

    static async deleteMessage(messageId) {
        if (!confirm('このメッセージを削除しますか？')) {
            return;
        }

        try {
            await deleteDoc(doc(db, COLLECTIONS.MESSAGES, messageId));
        } catch (error) {
            console.error('削除に失敗しました:', error);
            alert('削除に失敗しました。もう一度お試しください。');
        }
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 写真ギャラリー機能 - Firebase版
class FirebasePhotoGallery {
    static currentPage = 1;
    static photosPerPage = 20; // PC表示時は20枚
    static allPhotos = [];
    static filteredPhotos = [];

    static getPhotosPerPage() {
        // スマートフォン表示時は12枚、PC表示時は20枚
        return window.innerWidth <= 768 ? 12 : 20;
    }

    static async init() {
        await this.loadPhotos();
        this.setupRealtimeListener();
        this.setupResizeListener();
    }

    static setupResizeListener() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // ページネーションを再計算（現在のページが範囲外になる場合は調整）
                const photosPerPage = this.getPhotosPerPage();
                const totalPages = Math.ceil(this.filteredPhotos.length / photosPerPage);
                if (this.currentPage > totalPages && totalPages > 0) {
                    this.currentPage = totalPages;
                }
                this.renderPhotos();
            }, 250);
        });
    }

    static async loadPhotos() {
        try {
            const galleryContainer = document.getElementById('photo-gallery-container');
            if (!galleryContainer) return;

            // Firestoreから写真を取得
            const querySnapshot = await getDocs(collection(db, COLLECTIONS.PHOTOS));
            this.allPhotos = [];

            querySnapshot.forEach((doc) => {
                const photo = { id: doc.id, ...doc.data() };
                this.allPhotos.push(photo);
            });

            // 日付順でソート（新しい順）
            this.allPhotos.sort((a, b) => {
                const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
                const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
                return dateB - dateA;
            });

            this.filteredPhotos = [...this.allPhotos];
            this.currentPage = 1;
            this.renderPhotos();
        } catch (error) {
            console.error('写真の読み込みに失敗しました:', error);
            alert('写真の読み込みに失敗しました。ページを再読み込みしてください。');
        }
    }

    static setupRealtimeListener() {
        const galleryContainer = document.getElementById('photo-gallery-container');
        if (!galleryContainer) return;

        onSnapshot(collection(db, COLLECTIONS.PHOTOS), (querySnapshot) => {
            this.allPhotos = [];
            querySnapshot.forEach((doc) => {
                const photo = { id: doc.id, ...doc.data() };
                this.allPhotos.push(photo);
            });

            // 日付順でソート（新しい順）
            this.allPhotos.sort((a, b) => {
                const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
                const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
                return dateB - dateA;
            });

            this.filteredPhotos = [...this.allPhotos];
            this.renderPhotos();
        });
    }

    static renderPhotos() {
        const galleryContainer = document.getElementById('photo-gallery-container');
        if (!galleryContainer) return;

        galleryContainer.innerHTML = '';

        // 現在のページの写真を計算
        const photosPerPage = this.getPhotosPerPage();
        const startIndex = (this.currentPage - 1) * photosPerPage;
        const endIndex = startIndex + photosPerPage;
        const photosToShow = this.filteredPhotos.slice(startIndex, endIndex);

        // 写真要素を作成
        photosToShow.forEach(photo => {
            const photoElement = this.createPhotoElement(photo);
            galleryContainer.appendChild(photoElement);
        });

        // アップロードボタンを追加（最初のページのみ）
        if (this.currentPage === 1) {
            const uploadButton = this.createUploadButton();
            galleryContainer.appendChild(uploadButton);
        }

        // ページネーション更新
        this.updatePagination();
    }

    static updatePagination() {
        const paginationContainer = document.getElementById('gallery-pagination');
        if (!paginationContainer) return;

        const photosPerPage = this.getPhotosPerPage();
        const totalPages = Math.ceil(this.filteredPhotos.length / photosPerPage);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '<div style="display: flex; justify-content: center; align-items: center; gap: 10px; flex-wrap: wrap;">';

        // 前のページボタン
        if (this.currentPage > 1) {
            paginationHTML += `<button onclick="FirebasePhotoGallery.goToPage(${this.currentPage - 1})" 
                                style="padding: 8px 12px; border: 1px solid #3182ce; background: white; color: #3182ce; border-radius: 5px; cursor: pointer;">
                                ← 前
                              </button>`;
        }

        // ページ番号
        const maxVisiblePages = 7;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            paginationHTML += `<button onclick="FirebasePhotoGallery.goToPage(1)" 
                                style="padding: 8px 12px; border: 1px solid #ddd; background: white; color: #333; border-radius: 5px; cursor: pointer;">
                                1
                              </button>`;
            if (startPage > 2) {
                paginationHTML += '<span style="padding: 8px;">...</span>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.currentPage;
            paginationHTML += `<button onclick="FirebasePhotoGallery.goToPage(${i})" 
                                style="padding: 8px 12px; border: 1px solid ${isActive ? '#3182ce' : '#ddd'}; 
                                       background: ${isActive ? '#3182ce' : 'white'}; 
                                       color: ${isActive ? 'white' : '#333'}; 
                                       border-radius: 5px; cursor: pointer; font-weight: ${isActive ? 'bold' : 'normal'};">
                                ${i}
                              </button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += '<span style="padding: 8px;">...</span>';
            }
            paginationHTML += `<button onclick="FirebasePhotoGallery.goToPage(${totalPages})" 
                                style="padding: 8px 12px; border: 1px solid #ddd; background: white; color: #333; border-radius: 5px; cursor: pointer;">
                                ${totalPages}
                              </button>`;
        }

        // 次のページボタン
        if (this.currentPage < totalPages) {
            paginationHTML += `<button onclick="FirebasePhotoGallery.goToPage(${this.currentPage + 1})" 
                                style="padding: 8px 12px; border: 1px solid #3182ce; background: white; color: #3182ce; border-radius: 5px; cursor: pointer;">
                                次 →
                              </button>`;
        }

        paginationHTML += '</div>';

        // ページ情報を表示
        paginationHTML += `<div style="text-align: center; margin-top: 15px; color: #666; font-size: 0.9rem;">
                            ${this.filteredPhotos.length}件中 ${(this.currentPage - 1) * photosPerPage + 1}～${Math.min(this.currentPage * photosPerPage, this.filteredPhotos.length)}件を表示
                          </div>`;

        paginationContainer.innerHTML = paginationHTML;
    }

    static goToPage(page) {
        this.currentPage = page;
        this.renderPhotos();
        
        // 画面上部（ギャラリーセクション）にスクロール
        const gallerySection = document.getElementById('gallery-section');
        if (gallerySection) {
            gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    static filterByEvent(eventId) {
        if (eventId === 'all') {
            this.filteredPhotos = [...this.allPhotos];
        } else {
            this.filteredPhotos = this.allPhotos.filter(photo => photo.eventId === eventId);
        }
        this.currentPage = 1;
        this.renderPhotos();
    }

    static createPhotoElement(photo) {
        const div = document.createElement('div');
        div.className = 'photo-item';
        
        // 日付フォーマット
        let dateStr = '不明';
        if (photo.createdAt && photo.createdAt.toDate) {
            dateStr = photo.createdAt.toDate().toLocaleDateString('ja-JP');
        }

        div.innerHTML = `
            <h4>${this.escapeHtml(photo.title)}</h4>
            <p>${this.escapeHtml(photo.description)}</p>
            <div style="height: 200px; background: #f0f0f0; border-radius: 5px; display: flex; align-items: center; justify-content: center; margin: 10px 0; overflow: hidden;">
                <img src="${photo.imageUrl}" alt="${this.escapeHtml(photo.title)}" 
                     style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" 
                     onclick="FirebasePhotoGallery.openModal('${photo.imageUrl}', '${this.escapeHtml(photo.title)}', '${this.escapeHtml(photo.description)}')">
            </div>
            <p style="font-size: 0.9rem; color: #666;">投稿: ${this.escapeHtml(photo.contributor)} (${dateStr})</p>
            <button onclick="FirebasePhotoGallery.deletePhoto('${photo.id}')" 
                    style="margin-top: 10px; background: #e53e3e; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; width: 100%;">
                削除
            </button>
        `;
        return div;
    }

    static createUploadButton() {
        const div = document.createElement('div');
        div.className = 'photo-item';
        div.innerHTML = `
            <h4>写真をアップロード</h4>
            <p>思い出の写真をシェア</p>
            <div style="height: 200px; background: #3182ce; border-radius: 5px; display: flex; align-items: center; justify-content: center; margin: 10px 0; cursor: pointer;" onclick="FirebasePhotoGallery.showUploadForm()">
                <div style="text-align: center; color: white;">
                    <div style="font-size: 3rem; margin-bottom: 10px;">📷</div>
                    <div>クリックして写真を追加</div>
                </div>
            </div>
            <input type="file" id="photo-file-input" accept="image/*" style="display: none;" onchange="FirebasePhotoGallery.handleFileSelect(event)">
        `;
        return div;
    }

    static showUploadForm() {
        document.getElementById('photo-file-input').click();
    }

    static async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const title = prompt('写真のタイトルを入力してください：');
        if (!title) return;

        const description = prompt('写真の説明を入力してください：');
        if (!description) return;

        const contributor = prompt('投稿者名を入力してください：');
        if (!contributor) return;

        await this.uploadPhoto(file, title, description, contributor);
    }

    static async uploadPhoto(file, title, description, contributor) {
        try {
            // ファイルサイズチェック（5MB制限）
            if (file.size > 5 * 1024 * 1024) {
                alert('ファイルサイズは5MB以下にしてください。');
                return;
            }

            // Firebase Storage upload replaced with Base64 storage
            // const storageRef = ref(storage, `photos/${Date.now()}_${file.name}`);
            // const snapshot = await uploadBytes(storageRef, file);
            // const downloadURL = await getDownloadURL(snapshot.ref);
            
            // Use Base64 storage instead
            const downloadURL = await resizeImageForUpload(file, 500);

            // Firestoreに写真情報を保存
            await addDoc(collection(db, COLLECTIONS.PHOTOS), {
                title: title,
                description: description,
                contributor: contributor,
                imageUrl: downloadURL,
                createdAt: serverTimestamp()
            });

            alert('写真をアップロードしました！');
        } catch (error) {
            console.error('アップロードに失敗しました:', error);
            alert('アップロードに失敗しました。もう一度お試しください。');
        }
    }

    static async deletePhoto(photoId) {
        if (!confirm('この写真を削除しますか？')) {
            return;
        }

        try {
            await deleteDoc(doc(db, COLLECTIONS.PHOTOS, photoId));
        } catch (error) {
            console.error('削除に失敗しました:', error);
            alert('削除に失敗しました。もう一度お試しください。');
        }
    }

    static openModal(imageUrl, title, description) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;

        modal.innerHTML = `
            <div style="background: white; border-radius: 10px; padding: 20px; max-width: 80%; max-height: 80%; overflow: auto;">
                <div style="text-align: right; margin-bottom: 10px;">
                    <button onclick="this.closest('.modal').remove()" style="background: #e53e3e; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">✕ 閉じる</button>
                </div>
                <h3 style="margin-bottom: 10px;">${title}</h3>
                <p style="margin-bottom: 15px; color: #666;">${description}</p>
                <img src="${imageUrl}" alt="${title}" style="width: 100%; max-width: 600px; height: auto; border-radius: 5px;">
            </div>
        `;

        modal.className = 'modal';
        document.body.appendChild(modal);

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// パスワード認証とページ初期化
const correctPassword = "sakura1976";

function checkPassword() {
    const input = document.getElementById('password-input').value;
    const errorMessage = document.getElementById('error-message');
    
    if (input === correctPassword) {
        document.getElementById('password-screen').style.display = 'none';
        document.getElementById('members-content').style.display = 'block';
        sessionStorage.setItem('authenticated', 'true');
        
        // Firebase機能を初期化
        FirebaseMessageBoard.init();
        FirebasePhotoGallery.init();
    } else {
        errorMessage.style.display = 'block';
        document.getElementById('password-input').value = '';
    }
}

function logout() {
    sessionStorage.removeItem('authenticated');
    document.getElementById('password-screen').style.display = 'block';
    document.getElementById('members-content').style.display = 'none';
    document.getElementById('password-input').value = '';
}

function showSection(sectionName) {
    const sections = ['news', 'gallery', 'board', 'directory'];
    sections.forEach(section => {
        document.getElementById(section + '-section').style.display = 'none';
    });
    
    document.getElementById(sectionName + '-section').style.display = 'block';
    
    // セクション切り替え時に機能を初期化
    if (sectionName === 'board') {
        FirebaseMessageBoard.init();
    } else if (sectionName === 'gallery') {
        FirebasePhotoGallery.init();
    }
}

function handleRSVP(event) {
    event.preventDefault();
    const name = document.getElementById('rsvp-name').value;
    const attendance = document.getElementById('rsvp-attendance').value;
    
    if (name && attendance) {
        alert(`${name}さんの出欠回答（${attendance === 'participate' ? '参加予定' : attendance === 'not-participate' ? '不参加' : '未定'}）を受け付けました！`);
        event.target.reset();
    }
}

// ページ読み込み時の処理
window.onload = function() {
    if (sessionStorage.getItem('authenticated') === 'true') {
        document.getElementById('password-screen').style.display = 'none';
        document.getElementById('members-content').style.display = 'block';
        FirebaseMessageBoard.init();
        FirebasePhotoGallery.init();
    }
    
    const passwordInput = document.getElementById('password-input');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkPassword();
            }
        });
    }
};
