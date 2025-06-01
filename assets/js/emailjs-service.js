// EmailJS メール通知サービス
// EmailJSを使用したメール通知機能

class EmailService {
    constructor() {
        this.initialized = false;
        
        // 設定を環境変数または設定ファイルから読み込み
        const config = this.loadConfiguration();
        
        this.serviceId = config.serviceId;
        this.templateIds = config.templateIds;
        this.publicKey = config.publicKey;
        this.adminNotificationOnly = true; // 管理者通知のみ有効化
    }

    // 設定読み込み（設定ファイル優先、フォールバックでプレースホルダー）
    loadConfiguration() {
        console.log('Loading EmailJS configuration...');
        
        // 本番環境判定
        const isProduction = typeof window !== 'undefined' && 
                           !window.location.hostname.includes('localhost') && 
                           !window.location.hostname.includes('127.0.0.1');
        
        // 本番環境でも設定ファイルから読み込みを試みる
        // GitHub Pagesなどの環境では、emailjs-config.jsを別途設定する必要があります

        // ブラウザ環境では設定ファイルから読み込み（開発環境）
        if (typeof window !== 'undefined' && window.EMAILJS_CONFIG) {
            console.log('Found EMAILJS_CONFIG:', window.EMAILJS_CONFIG);
            
            const isDevelopment = window.location.hostname === 'localhost' || 
                                window.location.hostname === '127.0.0.1' ||
                                window.location.hostname.includes('localhost');
            
            console.log('Is development environment:', isDevelopment);
            
            // 開発環境では development 設定を優先、なければメイン設定
            if (isDevelopment && window.EMAILJS_CONFIG.development) {
                console.log('Using development configuration');
                return window.EMAILJS_CONFIG.development;
            }
            
            console.log('Using main configuration');
            return {
                serviceId: window.EMAILJS_CONFIG.serviceId,
                publicKey: window.EMAILJS_CONFIG.publicKey,
                templateIds: window.EMAILJS_CONFIG.templateIds
            };
        }
        
        console.warn('EMAILJS_CONFIG not found, using fallback values');
        
        // フォールバック（プレースホルダー値）
        return {
            serviceId: 'REPLACE_WITH_YOUR_SERVICE_ID',
            publicKey: 'REPLACE_WITH_YOUR_PUBLIC_KEY',
            templateIds: {
                contact: 'REPLACE_WITH_CONTACT_TEMPLATE',
                rsvp: 'REPLACE_WITH_RSVP_TEMPLATE',
                admin_notification: 'REPLACE_WITH_ADMIN_TEMPLATE'
            }
        };
    }

    // EmailJSの初期化
    async init() {
        try {
            console.log('Initializing EmailJS...');
            console.log('Public Key:', this.publicKey);
            
            if (typeof emailjs === 'undefined') {
                console.error('EmailJS library not loaded');
                return false;
            }

            if (!this.publicKey || this.publicKey === 'REPLACE_WITH_YOUR_PUBLIC_KEY') {
                console.error('EmailJS Public Key not configured properly');
                return false;
            }

            emailjs.init(this.publicKey);
            this.initialized = true;
            console.log('EmailJS initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize EmailJS:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    // お問い合わせフォーム送信（管理者通知のみモードでは無効）
    async sendContactForm(formData) {
        if (this.adminNotificationOnly) {
            console.log('Contact form email disabled in admin-only mode');
            return { success: false, message: 'Admin notification only mode' };
        }

        if (!this.initialized && !(await this.init())) {
            throw new Error('EmailJS not initialized');
        }

        const templateParams = {
            from_name: formData.name,
            from_email: formData.email,
            subject: formData.subject,
            message: formData.message,
            to_name: '桜町中学校1976年卒業同窓会',
            reply_to: formData.email,
            timestamp: new Date().toLocaleString('ja-JP')
        };

        try {
            const response = await emailjs.send(
                this.serviceId,
                this.templateIds.contact,
                templateParams
            );
            
            console.log('Contact form email sent successfully:', response);
            return {
                success: true,
                messageId: response.text
            };
        } catch (error) {
            console.error('Failed to send contact form email:', error);
            throw error;
        }
    }

    // 出欠確認フォーム送信
    async sendRSVPForm(formData, userInfo) {
        if (!this.initialized && !(await this.init())) {
            throw new Error('EmailJS not initialized');
        }

        const attendanceText = {
            'participate': '参加予定',
            'not-participate': '不参加',
            'undecided': '未定'
        };

        const templateParams = {
            user_name: userInfo.name || userInfo.email,
            user_email: userInfo.email,
            user_class: userInfo.class || '未設定',
            event_name: formData.eventName,
            attendance_status: attendanceText[formData.attendance] || formData.attendance,
            comment: formData.comment || 'なし',
            to_name: '桜町中学校1976年卒業同窓会',
            timestamp: new Date().toLocaleString('ja-JP')
        };

        try {
            const response = await emailjs.send(
                this.serviceId,
                this.templateIds.rsvp,
                templateParams
            );
            
            console.log('RSVP form email sent successfully:', response);
            return {
                success: true,
                messageId: response.text
            };
        } catch (error) {
            console.error('Failed to send RSVP form email:', error);
            throw error;
        }
    }

    // 管理者通知メール送信
    async sendAdminNotification(type, data) {
        console.log('sendAdminNotification called with:', { type, data });
        console.log('Current service state:', {
            initialized: this.initialized,
            serviceId: this.serviceId,
            publicKey: this.publicKey,
            templateId: this.templateIds.admin_notification
        });

        if (!this.initialized && !(await this.init())) {
            throw new Error('EmailJS not initialized');
        }

        let subject = '';
        let message = '';

        switch (type) {
            case 'new_contact':
                subject = '新しいお問い合わせが届きました';
                message = `
新しいお問い合わせが届きました。

お名前: ${data.name}
メールアドレス: ${data.email}
件名: ${data.subject}
内容: ${data.message}

管理者ダッシュボードで詳細を確認してください。
                `.trim();
                break;

            case 'new_rsvp':
                const attendanceText = {
                    'participate': '参加予定',
                    'not-participate': '不参加', 
                    'undecided': '未定'
                };
                subject = '新しい出欠回答が届きました';
                message = `
新しい出欠回答が届きました。

参加者: ${data.userName}
イベント: ${data.eventName}
回答: ${attendanceText[data.attendance] || data.attendance}
コメント: ${data.comment || 'なし'}
                `.trim();
                break;

            default:
                throw new Error('Unknown notification type');
        }

        const templateParams = {
            notification_type: type,
            subject: subject,
            message: message,
            timestamp: new Date().toLocaleString('ja-JP'),
            to_name: '管理者'
        };

        console.log('Sending admin notification with params:', templateParams);
        console.log('Using serviceId:', this.serviceId);
        console.log('Using templateId:', this.templateIds.admin_notification);

        try {
            const response = await emailjs.send(
                this.serviceId,
                this.templateIds.admin_notification,
                templateParams
            );
            
            console.log('Admin notification sent successfully:', response);
            return {
                success: true,
                messageId: response.text
            };
        } catch (error) {
            console.error('Failed to send admin notification:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    // 設定の更新
    updateConfig(config) {
        if (config.serviceId) this.serviceId = config.serviceId;
        if (config.publicKey) this.publicKey = config.publicKey;
        if (config.templateIds) {
            this.templateIds = { ...this.templateIds, ...config.templateIds };
        }
    }

    // EmailJS設定確認
    checkConfiguration() {
        return {
            serviceId: this.serviceId,
            templateIds: this.templateIds,
            publicKey: this.publicKey ? 'Set' : 'Not set',
            initialized: this.initialized
        };
    }
}

// グローバルインスタンス作成
window.emailService = new EmailService();
