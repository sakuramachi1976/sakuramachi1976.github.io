// EmailJS設定テンプレートファイル
// このファイルをコピーして emailjs-config.js を作成し、実際の値を設定してください

window.EMAILJS_CONFIG = {
    // 本番環境での設定
    serviceId: 'YOUR_EMAILJS_SERVICE_ID',
    publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
    templateIds: {
        contact: 'YOUR_CONTACT_TEMPLATE_ID',
        rsvp: 'YOUR_RSVP_TEMPLATE_ID',
        admin_notification: 'YOUR_ADMIN_NOTIFICATION_TEMPLATE_ID'
    },
    
    // 開発環境での設定
    development: {
        serviceId: 'YOUR_DEV_SERVICE_ID',
        publicKey: 'YOUR_DEV_PUBLIC_KEY',
        templateIds: {
            contact: 'YOUR_DEV_CONTACT_TEMPLATE_ID',
            rsvp: 'YOUR_DEV_RSVP_TEMPLATE_ID',
            admin_notification: 'YOUR_DEV_ADMIN_NOTIFICATION_TEMPLATE_ID'
        }
    }
};