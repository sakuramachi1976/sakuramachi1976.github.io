// テーマ切り替え機能
class ThemeSwitcher {
    constructor() {
        this.themes = {
            'classic': '/assets/css/theme-classic.css',
            'modern': '/assets/css/theme-modern.css', 
            'dark': '/assets/css/theme-dark.css',
            'nostalgic': '/assets/css/theme-nostalgic.css'
        };
        
        this.currentTheme = this.getStoredTheme() || 'classic';
        this.init();
    }

    init() {
        this.loadTheme(this.currentTheme);
        this.createThemeSwitcher();
    }

    getStoredTheme() {
        return localStorage.getItem('selected-theme');
    }

    storeTheme(theme) {
        localStorage.setItem('selected-theme', theme);
    }

    loadTheme(themeName) {
        // 既存のテーマCSSを削除
        const existingTheme = document.getElementById('theme-css');
        if (existingTheme) {
            existingTheme.remove();
        }

        // 新しいテーマCSSを追加
        if (themeName !== 'classic' && this.themes[themeName]) {
            const link = document.createElement('link');
            link.id = 'theme-css';
            link.rel = 'stylesheet';
            link.href = this.themes[themeName];
            document.head.appendChild(link);
        }

        this.currentTheme = themeName;
        this.storeTheme(themeName);
        this.updateUI();
    }

    switchTheme(themeName) {
        if (this.themes[themeName] || themeName === 'classic') {
            this.loadTheme(themeName);
            // テーマ変更の視覚的フィードバック
            this.showThemeChangeNotification(themeName);
        }
    }

    createThemeSwitcher() {
        // テーマ切り替えボタンがすでに存在する場合は削除
        const existingSwitcher = document.getElementById('theme-switcher');
        if (existingSwitcher) {
            existingSwitcher.remove();
        }

        // テーマ切り替えボタンを作成
        const switcher = document.createElement('div');
        switcher.id = 'theme-switcher';
        switcher.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; z-index: 1000; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); border-radius: 12px; padding: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2);">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <span style="font-size: 0.9rem; font-weight: 600; color: #374151;">🎨 テーマ</span>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button id="theme-classic" class="theme-btn" data-theme="classic" style="padding: 8px 12px; border: 2px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; transition: all 0.3s; font-size: 0.8rem;" title="クラシック">
                        🏛️
                    </button>
                    <button id="theme-modern" class="theme-btn" data-theme="modern" style="padding: 8px 12px; border: 2px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; transition: all 0.3s; font-size: 0.8rem;" title="モダン">
                        ✨
                    </button>
                    <button id="theme-dark" class="theme-btn" data-theme="dark" style="padding: 8px 12px; border: 2px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; transition: all 0.3s; font-size: 0.8rem;" title="ダーク">
                        🌙
                    </button>
                    <button id="theme-nostalgic" class="theme-btn" data-theme="nostalgic" style="padding: 8px 12px; border: 2px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; transition: all 0.3s; font-size: 0.8rem;" title="ノスタルジック">
                        📸
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(switcher);

        // イベントリスナーを追加
        switcher.addEventListener('click', (e) => {
            if (e.target.classList.contains('theme-btn')) {
                const theme = e.target.dataset.theme;
                this.switchTheme(theme);
            }
        });

        // 初期状態の更新
        this.updateUI();
    }

    updateUI() {
        // アクティブなテーマボタンをハイライト
        const buttons = document.querySelectorAll('.theme-btn');
        buttons.forEach(btn => {
            if (btn.dataset.theme === this.currentTheme) {
                btn.style.borderColor = '#3b82f6';
                btn.style.background = '#dbeafe';
                btn.style.transform = 'scale(1.1)';
            } else {
                btn.style.borderColor = '#e5e7eb';
                btn.style.background = 'white';
                btn.style.transform = 'scale(1)';
            }
        });
    }

    showThemeChangeNotification(themeName) {
        // 通知を作成
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 1001;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 500;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        const themeNames = {
            'classic': 'クラシック',
            'modern': 'モダン',
            'dark': 'ダーク',
            'nostalgic': 'ノスタルジック'
        };

        notification.textContent = `${themeNames[themeName]}テーマに変更しました`;
        document.body.appendChild(notification);

        // アニメーション
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // 3秒後に削除
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // レスポンシブ対応でモバイルでは非表示
    hideOnMobile() {
        const switcher = document.getElementById('theme-switcher');
        if (window.innerWidth <= 768) {
            switcher.style.display = 'none';
        } else {
            switcher.style.display = 'block';
        }
    }
}

// ページ読み込み時にテーマスイッチャーを初期化
document.addEventListener('DOMContentLoaded', () => {
    window.themeSwitcher = new ThemeSwitcher();
    
    // リサイズ時の対応
    window.addEventListener('resize', () => {
        window.themeSwitcher.hideOnMobile();
    });
    
    // 初期表示時のモバイル対応
    window.themeSwitcher.hideOnMobile();
});

// グローバル関数として公開
window.switchTheme = (themeName) => {
    if (window.themeSwitcher) {
        window.themeSwitcher.switchTheme(themeName);
    }
};