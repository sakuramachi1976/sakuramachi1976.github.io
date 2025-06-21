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
    limit,
    startAfter,
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

    // 画像のサムネイル生成
    static async generateThumbnail(imageUrl, maxWidth = 300, quality = 0.7) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // アスペクト比を維持してリサイズ
                const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // サムネイルをBase64で返す
                const thumbnailUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(thumbnailUrl);
            };
            img.onerror = function() {
                // エラーの場合は元の画像を返す
                resolve(imageUrl);
            };
            img.src = imageUrl;
        });
    }
}

// 写真ギャラリー機能 - Firebase版
class FirebasePhotoGallery {
    static currentPage = 1;
    static photosPerPage = 20; // PC表示時は20枚
    static allPhotos = [];
    static filteredPhotos = [];
    static isInitialized = false;
    static initialLoadLimit = 40; // 初回読み込み制限数
    static hasMorePhotos = true; // まだ読み込める写真があるか
    static lastVisible = null; // ページネーション用の最後のドキュメント

    static getPhotosPerPage() {
        // スマートフォン表示時は12枚、PC表示時は20枚
        return window.innerWidth <= 768 ? 12 : 20;
    }

    static async init() {
        if (this.isInitialized) {
            return; // 既に初期化済みの場合は何もしない
        }
        
        this.isInitialized = true;
        await this.loadPhotos();
        // リアルタイムリスナーは無効化（パフォーマンス向上のため）
        // this.setupRealtimeListener();
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

            // 初回は制限数のみ読み込み
            const q = query(
                collection(db, COLLECTIONS.PHOTOS),
                orderBy('createdAt', 'desc'),
                limit(this.initialLoadLimit)
            );

            const querySnapshot = await getDocs(q);
            this.allPhotos = [];

            querySnapshot.forEach((doc) => {
                const photo = { id: doc.id, ...doc.data() };
                this.allPhotos.push(photo);
            });

            // 最後のドキュメントを保存（追加読み込み用）
            if (querySnapshot.docs.length > 0) {
                this.lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
            }

            // 読み込み制限数未満の場合は、これ以上写真がない
            this.hasMorePhotos = querySnapshot.docs.length === this.initialLoadLimit;

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

        // 「もっと見る」ボタンを追加（まだ読み込める写真がある場合）
        if (this.hasMorePhotos && this.currentPage === totalPages) {
            paginationHTML += `<div style="text-align: center; margin-top: 20px;">
                                <button onclick="FirebasePhotoGallery.handleLoadMore()" 
                                        id="load-more-btn"
                                        style="padding: 12px 24px; background: #3182ce; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1rem;">
                                    📷 もっと見る
                                </button>
                              </div>`;
        }

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

    static async loadMorePhotos() {
        if (!this.hasMorePhotos || !this.lastVisible) {
            return false;
        }

        try {
            const q = query(
                collection(db, COLLECTIONS.PHOTOS),
                orderBy('createdAt', 'desc'),
                startAfter(this.lastVisible),
                limit(this.initialLoadLimit)
            );

            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.docs.length === 0) {
                this.hasMorePhotos = false;
                return false;
            }

            querySnapshot.forEach((doc) => {
                const photo = { id: doc.id, ...doc.data() };
                this.allPhotos.push(photo);
            });

            // 最後のドキュメントを更新
            this.lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
            
            // 読み込み制限数未満の場合は、これ以上写真がない
            this.hasMorePhotos = querySnapshot.docs.length === this.initialLoadLimit;

            this.filteredPhotos = [...this.allPhotos];
            this.renderPhotos();
            
            return true;
        } catch (error) {
            console.error('追加写真の読み込みに失敗しました:', error);
            return false;
        }
    }

    static async handleLoadMore() {
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.innerHTML = '📷 読み込み中...';
            loadMoreBtn.disabled = true;
        }

        const success = await this.loadMorePhotos();
        
        if (!success && loadMoreBtn) {
            loadMoreBtn.innerHTML = '📷 もっと見る';
            loadMoreBtn.disabled = false;
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

        // サムネイル用のプレースホルダー
        const thumbnailId = `thumbnail-${photo.id}`;
        
        div.innerHTML = `
            <h4>${this.escapeHtml(photo.title)}</h4>
            <p>${this.escapeHtml(photo.description)}</p>
            <div style="height: 200px; background: #f0f0f0; border-radius: 5px; display: flex; align-items: center; justify-content: center; margin: 10px 0; overflow: hidden; position: relative;">
                <div id="loading-${photo.id}" style="position: absolute; z-index: 1; color: #666; font-size: 0.9rem;">
                    <div style="font-size: 2rem; margin-bottom: 5px;">📷</div>
                    <div>読み込み中...</div>
                </div>
                <img id="${thumbnailId}" 
                     alt="${this.escapeHtml(photo.title)}" 
                     style="width: 100%; height: 100%; object-fit: cover; cursor: pointer; opacity: 0; transition: opacity 0.3s ease;" 
                     onclick="FirebasePhotoGallery.openModal('${photo.imageUrl}', '${this.escapeHtml(photo.title)}', '${this.escapeHtml(photo.description)}')">
            </div>
            <p style="font-size: 0.9rem; color: #666;">投稿: ${this.escapeHtml(photo.contributor)} (${dateStr})</p>
            <button onclick="FirebasePhotoGallery.deletePhoto('${photo.id}')" 
                    style="margin-top: 10px; background: #e53e3e; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; width: 100%;">
                削除
            </button>
        `;

        // サムネイル生成と遅延読み込み
        this.loadThumbnailAsync(photo.imageUrl, thumbnailId, photo.id);
        
        return div;
    }

    // サムネイルの非同期読み込み
    static async loadThumbnailAsync(imageUrl, thumbnailId, photoId) {
        try {
            // DOM要素の存在確認
            const thumbnailImg = document.getElementById(thumbnailId);
            const loadingDiv = document.getElementById(`loading-${photoId}`);
            
            if (!thumbnailImg) {
                console.warn(`Thumbnail element not found: ${thumbnailId}`);
                return;
            }

            // サムネイル生成
            const thumbnailUrl = await FirebasePhotoGallery.generateThumbnail(imageUrl, 300, 0.8);
            
            // 生成されたサムネイルを表示
            thumbnailImg.src = thumbnailUrl;
            thumbnailImg.onload = function() {
                this.style.opacity = '1';
                if (loadingDiv) {
                    loadingDiv.style.display = 'none';
                }
            };
            
            // サムネイル読み込みエラーの場合のフォールバック
            thumbnailImg.onerror = function() {
                console.warn('サムネイル表示に失敗、元画像を使用:', imageUrl);
                this.src = imageUrl;
                this.style.opacity = '1';
                if (loadingDiv) {
                    loadingDiv.style.display = 'none';
                }
            };
            
        } catch (error) {
            console.error('サムネイル生成に失敗しました:', error);
            // エラーの場合は元の画像を直接表示
            const thumbnailImg = document.getElementById(thumbnailId);
            const loadingDiv = document.getElementById(`loading-${photoId}`);
            
            if (thumbnailImg) {
                thumbnailImg.src = imageUrl;
                thumbnailImg.style.opacity = '1';
                if (loadingDiv) {
                    loadingDiv.style.display = 'none';
                }
            }
        }
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

    // サムネイル生成機能
    static async generateThumbnail(imageUrl, maxWidth = 300, quality = 0.8) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // アスペクト比を維持してリサイズ
                const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Base64形式で返す
                const thumbnailDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(thumbnailDataUrl);
            };
            img.onerror = function() {
                // エラーの場合は元の画像URLを返す
                resolve(imageUrl);
            };
            img.src = imageUrl;
        });
    }
}

// 古いHTML構造用の関数は削除（members.htmlの新しい構造と競合するため）
// checkPassword, logout, showSection, handleRSVP, window.onload 関数を削除

// グローバルスコープにクラスを公開（モジュール対応）
window.FirebaseMessageBoard = FirebaseMessageBoard;
window.FirebasePhotoGallery = FirebasePhotoGallery;
