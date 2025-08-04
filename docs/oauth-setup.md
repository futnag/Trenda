# OAuth プロバイダー設定ガイド

このドキュメントでは、Theme Discovery Tool で Google と GitHub OAuth 認証を設定する方法を説明します。

## Supabase での OAuth 設定

### 1. Supabase ダッシュボードにアクセス

1. [Supabase ダッシュボード](https://app.supabase.com) にログイン
2. プロジェクトを選択
3. 左サイドバーから「Authentication」→「Providers」を選択

### 2. Google OAuth 設定

#### Google Cloud Console での設定

1. [Google Cloud Console](https://console.cloud.google.com) にアクセス
2. プロジェクトを選択または新規作成
3. 「APIs & Services」→「Credentials」に移動
4. 「+ CREATE CREDENTIALS」→「OAuth 2.0 Client IDs」を選択
5. Application type: 「Web application」を選択
6. Name: 適切な名前を入力（例：Theme Discovery Tool）
7. Authorized redirect URIs に以下を追加：
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
8. 「CREATE」をクリック
9. Client ID と Client Secret をコピー

#### Supabase での Google 設定

1. Supabase ダッシュボードの「Authentication」→「Providers」
2. 「Google」を選択
3. 「Enable Google provider」をオンにする
4. Google Cloud Console からコピーした情報を入力：
   - Client ID
   - Client Secret
5. 「Save」をクリック

### 3. GitHub OAuth 設定

#### GitHub での設定

1. [GitHub](https://github.com) にログイン
2. 右上のプロフィール画像→「Settings」
3. 左サイドバーから「Developer settings」
4. 「OAuth Apps」→「New OAuth App」をクリック
5. 以下の情報を入力：
   - Application name: Theme Discovery Tool
   - Homepage URL: `https://your-domain.com`
   - Authorization callback URL: `https://your-project-id.supabase.co/auth/v1/callback`
6. 「Register application」をクリック
7. Client ID と Client Secret をコピー

#### Supabase での GitHub 設定

1. Supabase ダッシュボードの「Authentication」→「Providers」
2. 「GitHub」を選択
3. 「Enable GitHub provider」をオンにする
4. GitHub からコピーした情報を入力：
   - Client ID
   - Client Secret
5. 「Save」をクリック

## 環境変数の設定

OAuth プロバイダーの設定後、環境変数は自動的に Supabase によって管理されます。
追加の環境変数設定は不要です。

## テスト方法

### 1. ローカル環境でのテスト

```bash
npm run dev
```

1. `http://localhost:3000/auth/login` にアクセス
2. 「Googleでログイン」または「GitHubでログイン」ボタンをクリック
3. OAuth プロバイダーでの認証を完了
4. ダッシュボードにリダイレクトされることを確認

### 2. 認証フローの確認

正常な認証フローは以下の通りです：

1. ユーザーが OAuth ボタンをクリック
2. OAuth プロバイダーの認証画面にリダイレクト
3. ユーザーが認証を完了
4. `/auth/callback` にリダイレクト
5. 認証情報を処理
6. `/dashboard` にリダイレクト

## トラブルシューティング

### よくある問題と解決方法

#### 1. "Invalid redirect URI" エラー

**原因**: OAuth アプリの設定で redirect URI が正しく設定されていない

**解決方法**:
- Google Cloud Console または GitHub の OAuth アプリ設定を確認
- Redirect URI が `https://your-project-id.supabase.co/auth/v1/callback` になっているか確認

#### 2. "Client ID not found" エラー

**原因**: Supabase での OAuth プロバイダー設定が正しくない

**解決方法**:
- Supabase ダッシュボードで OAuth プロバイダーの設定を確認
- Client ID と Client Secret が正しく入力されているか確認

#### 3. 認証後にエラーページが表示される

**原因**: コールバック処理でエラーが発生している

**解決方法**:
- ブラウザの開発者ツールでコンソールエラーを確認
- Supabase ダッシュボードの「Logs」でエラーログを確認

#### 4. ユーザープロフィールが作成されない

**原因**: データベースの RLS ポリシーまたはテーブル構造の問題

**解決方法**:
- データベースマイグレーションが正しく実行されているか確認
- RLS ポリシーが正しく設定されているか確認

## セキュリティ考慮事項

### 1. HTTPS の使用

本番環境では必ず HTTPS を使用してください。OAuth プロバイダーは HTTP での認証を許可しません。

### 2. Redirect URI の制限

OAuth アプリの設定では、必要最小限の redirect URI のみを設定してください。

### 3. Client Secret の管理

Client Secret は環境変数として安全に管理し、クライアントサイドのコードには含めないでください。

## 本番環境での設定

### 1. ドメインの更新

本番環境にデプロイする際は、以下を更新してください：

1. OAuth アプリの Homepage URL と Authorization callback URL
2. Supabase プロジェクトの Site URL 設定

### 2. 環境変数の確認

本番環境で以下の環境変数が正しく設定されていることを確認：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 参考リンク

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Apps Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)