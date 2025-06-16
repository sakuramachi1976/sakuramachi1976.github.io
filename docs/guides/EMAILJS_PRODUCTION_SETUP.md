# EmailJS本番環境設定ガイド

このガイドでは、GitHub Pages（本番環境）でEmailJS機能を設定する方法を説明します。

## 🚨 重要なセキュリティ注意事項

EmailJSのAPIキー（serviceIdとpublicKey）は公開情報として扱われますが、GitHubリポジトリに直接含めないことが推奨されます。

## 📋 設定方法

### 方法1: GitHub Secretsを使用（推奨）

1. **GitHub Secretsの設定**
   - リポジトリの Settings → Secrets and variables → Actions に移動
   - 以下のSecretを追加：
     - `EMAILJS_SERVICE_ID`: あなたのEmailJSサービスID
     - `EMAILJS_PUBLIC_KEY`: あなたのEmailJS公開キー
     - `EMAILJS_TEMPLATE_CONTACT`: お問い合わせテンプレートID
     - `EMAILJS_TEMPLATE_RSVP`: 出欠確認テンプレートID
     - `EMAILJS_TEMPLATE_ADMIN`: 管理者通知テンプレートID

2. **GitHub Actionsワークフローの設定**
   デプロイ時に設定ファイルを生成するワークフローを作成します。

### 方法2: 外部設定ファイルを手動アップロード

1. **ローカルで設定ファイルを作成**
   ```bash
   cp assets/js/emailjs-config.template.js assets/js/emailjs-config.js
   ```

2. **設定値を入力**
   作成した `emailjs-config.js` に実際の値を設定

3. **GitHub Pagesに手動でアップロード**
   - GitHub Pagesのホスティング環境に直接アクセス
   - `assets/js/emailjs-config.js` をアップロード

### 方法3: 環境変数を使用したビルドシステム

Netlify、Vercel、Cloudflare Pagesなどを使用する場合：

1. **環境変数の設定**
   各プラットフォームの管理画面で環境変数を設定

2. **ビルドスクリプトの作成**
   ```bash
   #!/bin/bash
   cat > assets/js/emailjs-config.js << EOF
   window.EMAILJS_CONFIG = {
       serviceId: '${EMAILJS_SERVICE_ID}',
       publicKey: '${EMAILJS_PUBLIC_KEY}',
       templateIds: {
           contact: '${EMAILJS_TEMPLATE_CONTACT}',
           rsvp: '${EMAILJS_TEMPLATE_RSVP}',
           admin_notification: '${EMAILJS_TEMPLATE_ADMIN}'
       }
   };
   EOF
   ```

## 🔍 動作確認

1. **設定ファイルの存在確認**
   ブラウザのコンソールで以下を実行：
   ```javascript
   console.log(window.EMAILJS_CONFIG);
   ```

2. **EmailJSの初期化確認**
   ```javascript
   console.log(window.emailService.checkConfiguration());
   ```

## ⚠️ トラブルシューティング

### 設定ファイルが読み込まれない場合

1. **ネットワークタブで確認**
   - 開発者ツールのNetworkタブで `emailjs-config.js` の読み込み状況を確認
   - 404エラーの場合は、フォールバック設定が使用されます

2. **フォールバック動作**
   - 設定ファイルが見つからない場合、プレースホルダー値が使用されます
   - この場合、EmailJS機能は動作しません

### セキュリティのベストプラクティス

1. **APIキーの制限**
   - EmailJSダッシュボードでドメイン制限を設定
   - 許可するドメイン: `sakuramachi1976.github.io`

2. **レート制限の設定**
   - 過度な使用を防ぐため、EmailJSのレート制限を適切に設定

3. **定期的な監視**
   - EmailJSダッシュボードで使用状況を定期的に確認
   - 異常な使用パターンがないか監視

## 📞 サポート

設定に関してご不明な点がございましたら、管理者までお問い合わせください。