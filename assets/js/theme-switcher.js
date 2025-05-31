// テーマ切り替え機能
class ThemeSwitcher {
    constructor() {
        this.themes = {
            'classic': 'assets/css/theme-classic.css',
            'modern': 'assets/css/theme-modern.css', 
            'dark': 'assets/css/theme-dark.css',
            'nostalgic': 'assets/css/theme-nostalgic.css'
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
        console.log(`🎨 テーマ変更: ${themeName}`);
        
        // 既存のテーマCSSを削除
        const existingTheme = document.getElementById('theme-css');
        if (existingTheme) {
            existingTheme.remove();
            console.log('既存テーマCSS削除');
        }

        // 新しいテーマCSSを追加
        if (this.themes[themeName]) {
            const link = document.createElement('link');
            link.id = 'theme-css';
            link.rel = 'stylesheet';
            link.href = this.themes[themeName];
            link.onload = () => console.log(`✅ テーマCSS読み込み完了: ${themeName}`);
            link.onerror = () => console.error(`❌ テーマCSS読み込み失敗: ${themeName}`);
            document.head.appendChild(link);
            console.log(`CSS追加: ${link.href}`);
        }

        this.currentTheme = themeName;
        this.storeTheme(themeName);
        this.updateUI();
    }

    switchTheme(themeName) {
        if (this.themes[themeName] || themeName === 'classic') {
            this.loadTheme(themeName);
            // 通知は不要のため削除
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
            <div style="position: fixed; top: 15px; right: 15px; z-index: 1000; background: rgba(255,255,255,0.7); border-radius: 6px; padding: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.1); opacity: 0.6; transition: opacity 0.3s ease;">
                <div style="display: flex; gap: 4px;">
                    <button id="theme-classic" class="theme-btn" data-theme="classic" style="padding: 4px 6px; border: 1px solid transparent; border-radius: 4px; background: transparent; cursor: pointer; transition: all 0.3s; font-size: 0.7rem; opacity: 0.7;" title="クラシック">
                        🏛️
                    </button>
                    <button id="theme-modern" class="theme-btn" data-theme="modern" style="padding: 4px 6px; border: 1px solid transparent; border-radius: 4px; background: transparent; cursor: pointer; transition: all 0.3s; font-size: 0.7rem; opacity: 0.7;" title="モダン">
                        ✨
                    </button>
                    <button id="theme-dark" class="theme-btn" data-theme="dark" style="padding: 4px 6px; border: 1px solid transparent; border-radius: 4px; background: transparent; cursor: pointer; transition: all 0.3s; font-size: 0.7rem; opacity: 0.7;" title="ダーク">
                        🌙
                    </button>
                    <button id="theme-nostalgic" class="theme-btn" data-theme="nostalgic" style="padding: 4px 6px; border: 1px solid transparent; border-radius: 4px; background: transparent; cursor: pointer; transition: all 0.3s; font-size: 0.7rem; opacity: 0.7;" title="ノスタルジック">
                        📸
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(switcher);

        // ホバー効果を追加
        const switcherContainer = switcher.querySelector('div');
        switcherContainer.addEventListener('mouseenter', () => {
            switcherContainer.style.opacity = '1';
        });
        switcherContainer.addEventListener('mouseleave', () => {
            switcherContainer.style.opacity = '0.6';
        });

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
                btn.style.background = 'rgba(59, 130, 246, 0.1)';
                btn.style.opacity = '1';
                btn.style.transform = 'scale(1.1)';
            } else {
                btn.style.borderColor = 'transparent';
                btn.style.background = 'transparent';
                btn.style.opacity = '0.7';
                btn.style.transform = 'scale(1)';
            }
        });
    }

    // 通知機能は削除済み

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