# EmailJS設定ガイド

このガイドでは、桜町中学校1976年卒業同窓会サイトでEmailJS機能を設定する方法を説明します。

## 📧 EmailJSとは

EmailJSは、JavaScript からサーバーサイドコードを書くことなく直接メールを送信できるサービスです。
お問い合わせフォームや出欠確認フォームから自動的にメール通知を送信する機能を提供します。

## 🚀 セットアップ手順

### 1. EmailJSアカウント作成

1. [EmailJS公式サイト](https://www.emailjs.com/) にアクセス
2. 「Sign Up」をクリックしてアカウントを作成
3. メールアドレスとパスワードを入力してアカウント作成
4. 認証メールが送信されるので、リンクをクリックして認証

### 2. メールサービス連携

EmailJSダッシュボードで以下の設定を行います：

#### Gmailサービス連携の場合：
1. ダッシュボードで「Email Services」を選択
2. 「Add New Service」をクリック
3. 「Gmail」を選択
4. Googleアカウントでログインして認証
5. サービスIDをメモ（例：`service_sakuramachi1976`）

#### 他のメールプロバイダーの場合：
- Outlook、Yahoo Mail、SendGrid等も同様に設定可能

### 3. メールテンプレート作成

以下の3つのテンプレートを作成します：

#### A. お問い合わせフォーム用テンプレート
```
Template ID: template_contact_form

件名: 【桜町中学校1976年卒業同窓会】お問い合わせありがとうございます

本文:
{{from_name}} 様

この度は桜町中学校1976年卒業同窓会へお問い合わせいただき、ありがとうございます。

以下の内容でお問い合わせを受け付けいたしました：

お名前: {{from_name}}
メールアドレス: {{from_email}}
件名: {{subject}}
お問い合わせ内容:
{{message}}

受付日時: {{timestamp}}

内容を確認の上、3営業日以内にご連絡いたします。
何かご不明な点がございましたら、このメールにご返信ください。

桜町中学校1976年卒業同窓会
```

#### B. 出欠確認フォーム用テンプレート
```
Template ID: template_rsvp_form

件名: 【桜町中学校1976年卒業同窓会】出欠回答ありがとうございます

本文:
{{user_name}} 様（{{user_class}}）

イベントの出欠回答をありがとうございます。

以下の内容で回答を受け付けいたしました：

イベント: {{event_name}}
出欠回答: {{attendance_status}}
コメント: {{comment}}
回答日時: {{timestamp}}

変更が必要な場合は、会員専用ページから再度回答いただくか、
このメールにご返信ください。

桜町中学校1976年卒業同窓会
```

#### C. 管理者通知用テンプレート
```
Template ID: template_admin_notify

件名: 【同窓会サイト】{{subject}}

本文:
{{message}}

受信日時: {{timestamp}}

管理者ダッシュボード: [サイトURL]/admin.html
```

### 4. JavaScript設定更新

`assets/js/emailjs-service.js` ファイルで以下の設定を更新してください：

```javascript
// EmailJSサービス設定
constructor() {
    this.serviceId = 'service_XXXXXXXX';        // ← あなたのService ID
    this.publicKey = 'user_XXXXXXXXXXXXXXXXXX'; // ← あなたのPublic Key
    this.templateIds = {
        contact: 'template_contact_form',       // ← あなたのContact Template ID
        rsvp: 'template_rsvp_form',            // ← あなたのRSVP Template ID
        admin_notification: 'template_admin_notify' // ← あなたのAdmin Template ID
    };
}
```

### 5. Public Key取得

1. EmailJSダッシュボードで「Account」→「General」
2. 「Public Key」をコピー
3. 上記のコードに貼り付け

## 🔧 テスト方法

### 1. お問い合わせフォームテスト
1. サイトの「お問い合わせ」ページにアクセス
2. テスト用の情報を入力して送信
3. 入力したメールアドレスに確認メールが届くことを確認
4. 管理者宛に通知メールが届くことを確認

### 2. 出欠確認フォームテスト
1. 会員専用ページにログイン
2. 「出欠確認」セクションでテスト回答を送信
3. 確認メールと管理者通知メールが正常に送信されることを確認

## 📊 送信制限について

EmailJSの無料プランでは月200件までの送信制限があります：
- お問い合わせ: 月10-20件程度見込み
- 出欠確認: イベント時に50-100件程度見込み
- 管理者通知: 上記と同数

制限を超える場合は有料プランへのアップグレードを検討してください。

## 🛠️ トラブルシューティング

### メールが送信されない場合
1. コンソールでエラーメッセージを確認
2. Service IDとTemplate IDが正しいか確認
3. Public Keyが正しく設定されているか確認
4. Gmailの2段階認証が有効になっているか確認

### 迷惑メールに振り分けられる場合
1. 送信者アドレスを連絡先に追加
2. メールプロバイダーの設定を確認
3. 件名や本文に迷惑メール判定される文言がないか確認

## 📞 サポート

EmailJS設定でご不明な点がございましたら、管理者までお問い合わせください。
また、[EmailJS公式ドキュメント](https://www.emailjs.com/docs/) も参考にしてください。