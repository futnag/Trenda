# 認証システム設定ガイド

Theme Discovery Tool の認証システムの設定と使用方法について説明します。

## 概要

このアプリケーションは Supabase Auth を使用して以下の認証機能を提供します：

- メール/パスワード認証
- Google OAuth 認証
- GitHub OAuth 認証
- パスワードリセット機能
- ユーザープロフィール管理
- ルート保護機能

## 必要な設定

### 1. Supabase プロジェクトの設定

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. データベースマイグレーションを実行：
   - `supabase/migrations/001_create_core_tables.sql`
   - `supabase/migrations/002_setup_rls_policies.sql`

### 2. 環境変数の設定

`.env.local` ファイルに以下を設定：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. OAuth プロバイダーの設定

詳細は `docs/oauth-setup.md` を参照してください。

## 認証フロー

### 1. ユーザー登録

```typescript
import { useAuth } from '@/hooks/useAuth'

const { signUp } = useAuth()

// メール/パスワードでの登録
await signUp('user@example.com', 'password123')

// OAuth での登録
await signInWithGoogle()
await signInWithGitHub()
```

### 2. ログイン

```typescript
import { useAuth } from '@/hooks/useAuth'

const { signIn, signInWithGoogle, signInWithGitHub } = useAuth()

// メール/パスワードでのログイン
await signIn('user@example.com', 'password123')

// OAuth でのログイン
await signInWithGoogle()
await signInWithGitHub()
```

### 3. ログアウト

```typescript
import { useAuth } from '@/hooks/useAuth'

const { signOut } = useAuth()

await signOut()
```

## コンポーネントの使用方法

### 1. LoginForm コンポーネント

```typescript
import { LoginForm } from '@/components/auth/LoginForm'

<LoginForm 
  onToggleMode={() => setMode('signup')}
  onSuccess={() => router.push('/dashboard')}
/>
```

### 2. SignupForm コンポーネント

```typescript
import { SignupForm } from '@/components/auth/SignupForm'

<SignupForm 
  onToggleMode={() => setMode('login')}
  onSuccess={() => router.push('/dashboard')}
/>
```

### 3. ProtectedRoute コンポーネント

```typescript
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

<ProtectedRoute>
  <DashboardContent />
</ProtectedRoute>

// サブスクリプション制限付き
<ProtectedRoute subscriptionTier="pro">
  <ProFeatures />
</ProtectedRoute>
```

### 4. ProfileSettings コンポーネント

```typescript
import { ProfileSettings } from '@/components/auth/ProfileSettings'

<ProfileSettings />
```

## 認証状態の管理

### useAuth フック

```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, session, loading, signOut } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please login</div>

  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={signOut}>Logout</button>
    </div>
  )
}
```

### 認証状態の確認

```typescript
const { user, session, loading } = useAuth()

// ログイン状態
const isLoggedIn = !!user

// ローディング状態
const isLoading = loading

// セッション情報
const userSession = session
```

## ルート保護

### ページレベルでの保護

```typescript
// pages/dashboard.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
```

### コンポーネントレベルでの保護

```typescript
import { AuthGuard } from '@/components/auth/ProtectedRoute'

<AuthGuard subscriptionTier="basic">
  <PremiumFeature />
</AuthGuard>
```

## エラーハンドリング

### 認証エラーの処理

```typescript
import { useAuth } from '@/hooks/useAuth'

const { signIn } = useAuth()

try {
  await signIn(email, password)
} catch (error) {
  if (error.message.includes('Invalid login credentials')) {
    setError('メールアドレスまたはパスワードが正しくありません')
  } else if (error.message.includes('Email not confirmed')) {
    setError('メールアドレスの確認が完了していません')
  } else {
    setError('ログインに失敗しました')
  }
}
```

### よくあるエラーと対処法

1. **"Invalid login credentials"**
   - メールアドレスまたはパスワードが間違っている
   - ユーザーが存在しない

2. **"Email not confirmed"**
   - メール確認が完了していない
   - 確認メールを再送信する必要がある

3. **"Signup disabled"**
   - Supabase の設定で新規登録が無効になっている

## セキュリティ機能

### Row Level Security (RLS)

データベースレベルでユーザーデータを保護：

```sql
-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can only access their own data" ON users
  FOR ALL USING (auth.uid() = id);
```

### セッション管理

- JWT トークンによる安全なセッション管理
- 自動的なトークンリフレッシュ
- セッション有効期限の管理

## テスト

### 認証機能のテスト

```bash
# 認証システムのテスト実行
npm test src/lib/__tests__/auth.test.ts
```

### 手動テスト手順

1. ユーザー登録テスト
   - メール/パスワード登録
   - Google OAuth 登録
   - GitHub OAuth 登録

2. ログインテスト
   - 正常なログイン
   - 無効な認証情報でのログイン
   - OAuth ログイン

3. パスワードリセットテスト
   - パスワードリセット要求
   - リセットメールの受信
   - 新しいパスワードの設定

## トラブルシューティング

### よくある問題

1. **OAuth 認証が失敗する**
   - OAuth プロバイダーの設定を確認
   - Redirect URI が正しく設定されているか確認

2. **メール確認が届かない**
   - Supabase の SMTP 設定を確認
   - スパムフォルダを確認

3. **RLS エラーが発生する**
   - データベースポリシーを確認
   - ユーザーの権限を確認

### デバッグ方法

1. ブラウザの開発者ツールでネットワークタブを確認
2. Supabase ダッシュボードのログを確認
3. コンソールエラーを確認

## 本番環境での考慮事項

### セキュリティ

- HTTPS の使用を必須とする
- 強力なパスワードポリシーの実装
- レート制限の設定

### パフォーマンス

- 認証状態のキャッシング
- 不要な認証チェックの削減
- セッション管理の最適化

### 監視

- 認証失敗の監視
- 異常なログイン試行の検出
- セッション管理の監視