// 画像リサイズユーティリティ
class ImageResizer {
    constructor() {
        this.maxFileSizeKB = 500; // 最大ファイルサイズ（KB）
        this.maxDimensionPx = 1200; // 最大画像サイズ（ピクセル）
        this.compressionQuality = 0.8; // 初期圧縮品質
    }

    /**
     * ファイルを指定サイズ以下にリサイズ・圧縮
     * @param {File} file - 元画像ファイル
     * @param {number} maxSizeKB - 最大ファイルサイズ（KB）
     * @returns {Promise<string>} Base64データURL
     */
    async resizeImageToSize(file, maxSizeKB = this.maxFileSizeKB) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        const resizedBase64 = this.processImageResize(img, maxSizeKB);
                        resolve(resizedBase64);
                    } catch (error) {
                        reject(error);
                    }
                };
                img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
                img.src = event.target.result;
            };
            reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * 画像のリサイズ処理
     * @param {HTMLImageElement} img - 元画像
     * @param {number} maxSizeKB - 最大ファイルサイズ（KB）
     * @returns {string} Base64データURL
     */
    processImageResize(img, maxSizeKB) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 画像サイズの計算
        const { width, height } = this.calculateOptimalSize(img.width, img.height);
        canvas.width = width;
        canvas.height = height;

        // 画像の描画品質を向上
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 画像を描画
        ctx.drawImage(img, 0, 0, width, height);

        // 品質を調整しながら目標サイズ以下になるまで圧縮
        let quality = this.compressionQuality;
        let dataURL;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            dataURL = canvas.toDataURL('image/jpeg', quality);
            const sizeKB = this.getBase64SizeKB(dataURL);
            
            if (sizeKB <= maxSizeKB || attempts >= maxAttempts) {
                break;
            }

            // 品質を段階的に下げる
            quality *= 0.85;
            attempts++;
        } while (quality > 0.1);

        return dataURL;
    }

    /**
     * 最適な画像サイズを計算
     * @param {number} originalWidth - 元の幅
     * @param {number} originalHeight - 元の高さ
     * @returns {Object} {width, height}
     */
    calculateOptimalSize(originalWidth, originalHeight) {
        const maxDimension = this.maxDimensionPx;
        
        // 既に小さい画像はそのまま
        if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
            return { width: originalWidth, height: originalHeight };
        }

        // アスペクト比を保持してリサイズ
        const aspectRatio = originalWidth / originalHeight;
        
        if (originalWidth > originalHeight) {
            return {
                width: maxDimension,
                height: Math.round(maxDimension / aspectRatio)
            };
        } else {
            return {
                width: Math.round(maxDimension * aspectRatio),
                height: maxDimension
            };
        }
    }

    /**
     * Base64データのサイズを計算（KB）
     * @param {string} base64String - Base64データURL
     * @returns {number} サイズ（KB）
     */
    getBase64SizeKB(base64String) {
        // "data:image/jpeg;base64," 部分を除去
        const base64Data = base64String.split(',')[1];
        
        // Base64のサイズをバイト単位で計算
        const sizeBytes = (base64Data.length * 3) / 4;
        
        // パディング文字('=')を考慮
        const padding = base64Data.match(/=/g);
        const paddingSize = padding ? padding.length : 0;
        
        return Math.round((sizeBytes - paddingSize) / 1024);
    }

    /**
     * ファイルサイズを人間が読める形式で表示
     * @param {number} sizeKB - サイズ（KB）
     * @returns {string} 読みやすいサイズ表示
     */
    formatFileSize(sizeKB) {
        if (sizeKB < 1024) {
            return `${Math.round(sizeKB)}KB`;
        } else {
            return `${(sizeKB / 1024).toFixed(1)}MB`;
        }
    }

    /**
     * 画像リサイズの進捗表示
     * @param {string} message - 表示メッセージ
     */
    showProgress(message) {
        console.log(`🖼️ 画像処理: ${message}`);
        
        // UI表示がある場合は更新
        const progressElement = document.getElementById('resize-progress');
        if (progressElement) {
            progressElement.textContent = message;
            progressElement.style.display = 'block';
        }
    }

    /**
     * エラー表示
     * @param {string} error - エラーメッセージ
     */
    showError(error) {
        console.error(`❌ 画像処理エラー: ${error}`);
        
        // UI表示がある場合は更新
        const errorElement = document.getElementById('resize-error');
        if (errorElement) {
            errorElement.textContent = `画像処理エラー: ${error}`;
            errorElement.style.display = 'block';
        }
    }

    /**
     * 進捗・エラー表示をクリア
     */
    clearMessages() {
        const progressElement = document.getElementById('resize-progress');
        const errorElement = document.getElementById('resize-error');
        
        if (progressElement) progressElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'none';
    }
}

// グローバルインスタンスを作成
window.imageResizer = new ImageResizer();

// 使用例とヘルパー関数
window.resizeImageForUpload = async function(file, maxSizeKB = 500) {
    try {
        window.imageResizer.showProgress('画像を処理中...');
        
        const originalSizeKB = Math.round(file.size / 1024);
        console.log(`📁 元ファイルサイズ: ${window.imageResizer.formatFileSize(originalSizeKB)}`);
        
        const resizedBase64 = await window.imageResizer.resizeImageToSize(file, maxSizeKB);
        const finalSizeKB = window.imageResizer.getBase64SizeKB(resizedBase64);
        
        console.log(`✅ リサイズ完了: ${window.imageResizer.formatFileSize(finalSizeKB)}`);
        window.imageResizer.showProgress(`リサイズ完了: ${window.imageResizer.formatFileSize(finalSizeKB)}`);
        
        // 少し待ってから進捗表示をクリア
        setTimeout(() => {
            window.imageResizer.clearMessages();
        }, 2000);
        
        return resizedBase64;
    } catch (error) {
        window.imageResizer.showError(error.message);
        throw error;
    }
};