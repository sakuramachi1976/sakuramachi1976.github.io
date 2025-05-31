// 桜町中学校1976年卒業同窓会サイト JavaScript

// ローカルストレージを使用したデータ保存
class DataManager {
    static getComments() {
        const comments = localStorage.getItem('sakura1976_comments');
        return comments ? JSON.parse(comments) : [
            {
                id: 1,
                name: '田中太郎',
                message: '皆さん、お久しぶりです！元気にしています。還暦同窓会、楽しみにしています！',
                date: '2025/01/15',
                timestamp: new Date('2025-01-15').getTime()
            },
            {
                id: 2,
                name: '佐藤花子',
                message: 'ホームページができて嬉しいです！懐かしい写真を見つけたので、今度アップロードしますね。',
                date: '2025/01/10',
                timestamp: new Date('2025-01-10').getTime()
            },
            {
                id: 3,
                name: '山田次郎',
                message: '先日、母校の近くを通ったら、校舎が新しくなっていて驚きました。時の流れを感じますね。',
                date: '2025/01/08',
                timestamp: new Date('2025-01-08').getTime()
            }
        ];
    }

    static saveComments(comments) {
        localStorage.setItem('sakura1976_comments', JSON.stringify(comments));
    }

    static getPhotos() {
        const photos = localStorage.getItem('sakura1976_photos');
        return photos ? JSON.parse(photos) : [
            {
                id: 1,
                title: '卒業式の思い出',
                description: '1976年3月 桜町中学校',
                contributor: '○○さん',
                imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                date: '2025/01/01'
            },
            {
                id: 2,
                title: '40歳同窓会',
                description: '2016年春 ○○ホテル',
                contributor: '○○さん',
                imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                date: '2025/01/02'
            },
            {
                id: 3,
                title: '母校訪問',
                description: '2020年文化祭',
                contributor: '○○さん',
                imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                date: '2025/01/03'
            },
            {
                id: 4,
                title: '桜の季節',
                description: '学校近くの桜並木',
                contributor: '○○さん',
                imageUrl: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                date: '2025/01/04'
            }
        ];
    }

    static savePhotos(photos) {
        localStorage.setItem('sakura1976_photos', JSON.stringify(photos));
    }
}

// 掲示板機能
class MessageBoard {
    static init() {
        this.loadComments();
    }

    static loadComments() {
        const commentsContainer = document.getElementById('comments-container');
        if (!commentsContainer) return;

        const comments = DataManager.getComments();
        commentsContainer.innerHTML = '';

        // コメントを日付順（新しい順）にソート
        comments.sort((a, b) => b.timestamp - a.timestamp);

        comments.forEach(comment => {
            const commentElement = this.createCommentElement(comment);
            commentsContainer.appendChild(commentElement);
        });
    }

    static createCommentElement(comment) {
        const div = document.createElement('div');
        div.className = 'comment-item';
        div.innerHTML = `
            <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 15px; border-left: 4px solid #3182ce;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <strong>${this.escapeHtml(comment.name)}</strong>
                    <div>
                        <span style="color: #666; font-size: 0.9rem;">${comment.date}</span>
                        <button onclick="MessageBoard.deleteComment(${comment.id})" style="margin-left: 10px; background: #e53e3e; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 0.8rem;">削除</button>
                    </div>
                </div>
                <p style="margin: 5px 0; white-space: pre-wrap;">${this.escapeHtml(comment.message)}</p>
            </div>
        `;
        return div;
    }

    static postComment() {
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

        const comments = DataManager.getComments();
        const newComment = {
            id: Date.now(),
            name: name,
            message: message,
            date: new Date().toLocaleDateString('ja-JP').replace(/\//g, '/'),
            timestamp: Date.now()
        };

        comments.push(newComment);
        DataManager.saveComments(comments);

        // フォームをクリア
        nameInput.value = '';
        textInput.value = '';

        // コメントを再読み込み
        this.loadComments();

        alert('メッセージを投稿しました！');
    }

    static deleteComment(commentId) {
        if (!confirm('このメッセージを削除しますか？')) {
            return;
        }

        const comments = DataManager.getComments();
        const filteredComments = comments.filter(comment => comment.id !== commentId);
        DataManager.saveComments(filteredComments);

        this.loadComments();
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 写真ギャラリー機能
class PhotoGallery {
    static init() {
        this.loadPhotos();
    }

    static loadPhotos() {
        const galleryContainer = document.getElementById('photo-gallery-container');
        if (!galleryContainer) return;

        const photos = DataManager.getPhotos();
        galleryContainer.innerHTML = '';

        photos.forEach(photo => {
            const photoElement = this.createPhotoElement(photo);
            galleryContainer.appendChild(photoElement);
        });

        // アップロードボタンを追加
        const uploadButton = this.createUploadButton();
        galleryContainer.appendChild(uploadButton);
    }

    static createPhotoElement(photo) {
        const div = document.createElement('div');
        div.className = 'photo-item';
        div.innerHTML = `
            <h4>${this.escapeHtml(photo.title)}</h4>
            <p>${this.escapeHtml(photo.description)}</p>
            <div style="height: 200px; background: #f0f0f0; border-radius: 5px; display: flex; align-items: center; justify-content: center; margin: 10px 0; overflow: hidden;">
                <img src="${photo.imageUrl}" alt="${this.escapeHtml(photo.title)}" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" onclick="PhotoGallery.openModal('${photo.imageUrl}', '${this.escapeHtml(photo.title)}', '${this.escapeHtml(photo.description)}')">
            </div>
            <p style="font-size: 0.9rem; color: #666;">提供: ${this.escapeHtml(photo.contributor)}</p>
            <button onclick="PhotoGallery.deletePhoto(${photo.id})" style="margin-top: 10px; background: #e53e3e; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; width: 100%;">削除</button>
        `;
        return div;
    }

    static createUploadButton() {
        const div = document.createElement('div');
        div.className = 'photo-item';
        div.innerHTML = `
            <h4>写真をアップロード</h4>
            <p>思い出の写真をシェア</p>
            <div style="height: 200px; background: #3182ce; border-radius: 5px; display: flex; align-items: center; justify-content: center; margin: 10px 0; cursor: pointer;" onclick="PhotoGallery.showUploadForm()">
                <div style="text-align: center; color: white;">
                    <div style="font-size: 3rem; margin-bottom: 10px;">📷</div>
                    <div>クリックして写真を追加</div>
                </div>
            </div>
        `;
        return div;
    }

    static showUploadForm() {
        const title = prompt('写真のタイトルを入力してください：');
        if (!title) return;

        const description = prompt('写真の説明を入力してください：');
        if (!description) return;

        const contributor = prompt('投稿者名を入力してください：');
        if (!contributor) return;

        const imageUrl = prompt('画像URLを入力してください（Unsplashなどの画像URL）：');
        if (!imageUrl) return;

        this.addPhoto(title, description, contributor, imageUrl);
    }

    static addPhoto(title, description, contributor, imageUrl) {
        const photos = DataManager.getPhotos();
        const newPhoto = {
            id: Date.now(),
            title: title,
            description: description,
            contributor: contributor,
            imageUrl: imageUrl,
            date: new Date().toLocaleDateString('ja-JP').replace(/\//g, '/')
        };

        photos.push(newPhoto);
        DataManager.savePhotos(photos);

        this.loadPhotos();
        alert('写真を追加しました！');
    }

    static deletePhoto(photoId) {
        if (!confirm('この写真を削除しますか？')) {
            return;
        }

        const photos = DataManager.getPhotos();
        const filteredPhotos = photos.filter(photo => photo.id !== photoId);
        DataManager.savePhotos(filteredPhotos);

        this.loadPhotos();
    }

    static openModal(imageUrl, title, description) {
        // モーダルを作成
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

        // クリックで閉じる
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
        
        // 機能を初期化
        MessageBoard.init();
        PhotoGallery.init();
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
        MessageBoard.init();
    } else if (sectionName === 'gallery') {
        PhotoGallery.init();
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
        MessageBoard.init();
        PhotoGallery.init();
    }
    
    // Enterキーでパスワード認証
    const passwordInput = document.getElementById('password-input');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkPassword();
            }
        });
    }
};