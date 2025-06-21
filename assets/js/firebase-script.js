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
    serverTimestamp,
    where
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
    static initialLoadLimit = 20; // 初回読み込み制限数
    static hasMorePhotos = true; // まだ読み込める写真があるか
    static lastVisible = null; // ページネーション用の最後のドキュメント
    static totalCount = 0;
    static loadedCount = 0;
    static observer = null;
    static loadingMore = false;
    static currentFilter = 'all';
    static firstEventId = null;

    static getPhotosPerPage() {
        // スマートフォン表示時は12枚、PC表示時は20枚
        return window.innerWidth <= 768 ? 12 : 20;
    }

    static async init() {
        if (this.isInitialized) {
            return; // 既に初期化済みの場合は何もしない
        }
        
        this.isInitialized = true;
        await this.loadEventFilters();
        await this.setDefaultFilter();
        await this.loadPhotos();
        await this.fetchTotalCount();
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

            // ベースクエリを組み立て
            let baseQuery = collection(db, COLLECTIONS.PHOTOS);
            if (this.currentFilter !== 'all') {
                baseQuery = query(baseQuery, where('eventId', '==', this.currentFilter));
            }

            const q = query(
                baseQuery,
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

            // フィルタを再適用
            if (this.currentFilter === 'all') {
                this.filteredPhotos = [...this.allPhotos];
            } else {
                this.filteredPhotos = this.allPhotos.filter(p => p.eventId === this.currentFilter);
            }
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

            // フィルタを再適用
            if (this.currentFilter === 'all') {
                this.filteredPhotos = [...this.allPhotos];
            } else {
                this.filteredPhotos = this.allPhotos.filter(p => p.eventId === this.currentFilter);
            }
            this.renderPhotos();
        });
    }

    static renderPhotos() {
        const galleryContainer = document.getElementById('photo-gallery-container');
        if (!galleryContainer) return;

        // 初回ならグリッド CSS を設定
        galleryContainer.style.display = 'grid';
        galleryContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(240px, 1fr))';
        galleryContainer.style.gap = '20px';

        // すべての写真を表示（filteredPhotos は現在ロード済み分）
        galleryContainer.innerHTML = '';
        this.filteredPhotos.forEach(photo => {
            const el = this.createPhotoElement(photo);
            galleryContainer.appendChild(el);
        });

        // 件数表示更新
        this.loadedCount = this.filteredPhotos.length;
        const loadedSpan = document.getElementById('loaded-count');
        const totalSpan = document.getElementById('total-count');
        if (loadedSpan) loadedSpan.textContent = this.loadedCount;
        if (totalSpan) totalSpan.textContent = this.totalCount;

        // Sentinel を設置
        let sentinel = document.getElementById('gallery-sentinel');
        if (sentinel) sentinel.remove();
        sentinel = document.createElement('div');
        sentinel.id = 'gallery-sentinel';
        sentinel.style.height = '1px';
        galleryContainer.appendChild(sentinel);

        // IntersectionObserver 設定
        if (this.observer) this.observer.disconnect();
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.handleInfiniteScroll();
                }
            });
        }, {rootMargin: '300px'});
        this.observer.observe(sentinel);
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
            let baseQuery = collection(db, COLLECTIONS.PHOTOS);
            if (this.currentFilter !== 'all') {
                baseQuery = query(baseQuery, where('eventId', '==', this.currentFilter));
            }
            const q = query(
                baseQuery,
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

            // フィルタを再適用
            if (this.currentFilter === 'all') {
                this.filteredPhotos = [...this.allPhotos];
            } else {
                this.filteredPhotos = this.allPhotos.filter(p => p.eventId === this.currentFilter);
            }
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

    static async filterByEvent(eventId) {
        // フィルタ変更時は Firestore から該当イベントの写真を再取得
        this.currentFilter = eventId;
        this.lastVisible = null;      // ページネーションをリセット
        this.hasMorePhotos = true;    // 追加読み込みを有効化

        await this.updateTotalCount(eventId); // 件数を先に更新

        // 初回バッチを取得してレンダリング
        await this.loadPhotos();
    }

    static createPhotoElement(photo) {
        const div = document.createElement('div');
        div.className = 'photo-item';
        
        // 日付フォーマット
        let dateStr = '不明';
        if (photo.createdAt && photo.createdAt.toDate) {
            dateStr = photo.createdAt.toDate().toLocaleDateString('ja-JP');
        }

        const thumbnailId = `thumbnail-${photo.id}`;
        div.innerHTML = `
            <div style="width: 100%; aspect-ratio: 4/3; background:#f0f0f0; border-radius:5px; overflow:hidden;">
              <img src="${photo.imageUrl}" loading="lazy" alt="${this.escapeHtml(photo.title)}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" onclick="FirebasePhotoGallery.openModal('${photo.imageUrl}', '${this.escapeHtml(photo.title)}', '${this.escapeHtml(photo.description)}')">
            </div>
            <h4 style="margin:8px 0 4px 0; font-size:0.95rem;">${this.escapeHtml(photo.title)}</h4>
            <p style="margin:0 0 4px 0; font-size:0.85rem; color:#666;">${this.escapeHtml(photo.description)}</p>
            <p style="margin:0; font-size:0.75rem; color:#999;">${this.escapeHtml(photo.contributor)}・${dateStr}</p>
        `;

        return div;
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

    // サムネイルの非同期読み込み
    static async loadThumbnailAsync(imageUrl, thumbnailId, photoId) {
        try {
            const thumbnailImg = document.getElementById(thumbnailId);
            const loadingDiv = document.getElementById(`loading-${photoId}`);
            if (!thumbnailImg) return;

            const thumbnailUrl = await FirebasePhotoGallery.generateThumbnail(imageUrl, 300, 0.8);

            thumbnailImg.src = thumbnailUrl;
            thumbnailImg.onload = function() {
                this.style.opacity = '1';
                if (loadingDiv) loadingDiv.style.display = 'none';
            };
            thumbnailImg.onerror = function() {
                this.src = imageUrl;
                this.style.opacity = '1';
                if (loadingDiv) loadingDiv.style.display = 'none';
            };
        } catch (e) {
            console.error('loadThumbnailAsync error', e);
        }
    }

    static async loadEventFilters() {
        try {
            const filtersContainer = document.getElementById('gallery-event-filters');
            if (!filtersContainer) return;

            // 既存のフィルタをクリア
            filtersContainer.innerHTML = '';

            const snapshot = await getDocs(collection(db, 'events'));
            let isFirstOption = true;
            
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const label = document.createElement('label');
                label.style.marginRight = '15px';
                label.innerHTML = `
                    <input type="radio" name="gallery-filter" value="${docSnap.id}" ${isFirstOption ? 'checked' : ''} onchange="FirebasePhotoGallery.filterByEvent(this.value)">
                    ${FirebasePhotoGallery.escapeHtml(data.name)}
                `;
                filtersContainer.appendChild(label);
                
                // 最初のイベントIDを保存
                if (isFirstOption) {
                    this.firstEventId = docSnap.id;
                    isFirstOption = false;
                }
            });
        } catch (e) {
            console.error('loadEventFilters error', e);
        }
    }

    static async setDefaultFilter() {
        // 最初のイベントIDをデフォルトフィルターとして設定
        if (this.firstEventId) {
            this.currentFilter = this.firstEventId;
        }
    }

    static async fetchTotalCount() {
        await this.updateTotalCount('all');
    }

    static async updateTotalCount(eventId) {
        try {
            let q = collection(db, COLLECTIONS.PHOTOS);
            if (eventId !== 'all') {
                q = query(q, where('eventId', '==', eventId));
            }
            const snap = await getDocs(q);
            this.totalCount = snap.docs.length;
        } catch (e) {
            console.error('updateTotalCount error', e);
        }
    }

    static async handleInfiniteScroll() {
        if (this.loadingMore) return;
        this.loadingMore = true;
        await this.loadMorePhotos();
        this.loadingMore = false;
    }
}

// 古いHTML構造用の関数は削除（members.htmlの新しい構造と競合するため）
// checkPassword, logout, showSection, handleRSVP, window.onload 関数を削除

// グローバルスコープにクラスを公開（モジュール対応）
window.FirebaseMessageBoard = FirebaseMessageBoard;
window.FirebasePhotoGallery = FirebasePhotoGallery;
