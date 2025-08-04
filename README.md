# Theme Discovery Tool

個人開発者向けテーマ発見ツール - マネタイズ可能性の高い開発テーマを効率的に発見するためのWebアプリケーション

## 技術スタック

- **フロントエンド**: Next.js 14 + TypeScript + TailwindCSS
- **バックエンド**: Next.js API Routes + Supabase Edge Functions
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **決済**: Stripe (予定)
- **メール**: Resend (予定)
- **デプロイ**: Vercel

## 開発環境のセットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` を `.env.local` にコピーして、必要な環境変数を設定してください。

```bash
cp .env.example .env.local
```

### 3. Supabase プロジェクトの設定

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. プロジェクトのURL とAnon Keyを `.env.local` に設定
3. データベーススキーマを設定（後のタスクで実装予定）

### 4. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは [http://localhost:3000](http://localhost:3000) で起動します。

## 利用可能なスクリプト

- `npm run dev` - 開発サーバーを起動
- `npm run build` - プロダクションビルドを作成
- `npm run start` - プロダクションサーバーを起動
- `npm run lint` - ESLintでコードをチェック
- `npm run lint:fix` - ESLintでコードを自動修正
- `npm run format` - Prettierでコードをフォーマット
- `npm run format:check` - Prettierでフォーマットをチェック
- `npm run type-check` - TypeScriptの型チェック

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── globals.css        # グローバルスタイル
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # ホームページ
├── components/            # Reactコンポーネント
│   ├── common/           # 共通コンポーネント
│   ├── dashboard/        # ダッシュボード関連
│   ├── theme/            # テーマ関連
│   ├── auth/             # 認証関連
│   └── subscription/     # サブスクリプション関連
├── lib/                  # ユーティリティとライブラリ
│   ├── supabase.ts       # Supabase設定
│   └── utils.ts          # ユーティリティ関数
└── types/                # TypeScript型定義
    └── index.ts          # 共通型定義
```

## 開発ガイドライン

### コード品質

- TypeScriptの厳格な型チェックを使用
- ESLint + Prettierでコード品質を維持
- Huskyでコミット前の自動チェック

### コミット前チェック

以下が自動実行されます：

- ESLintによるコードチェック
- Prettierによるフォーマット
- TypeScriptの型チェック

## 次のステップ

1. Supabaseデータベーススキーマの作成
2. 認証システムの実装
3. 基本UIコンポーネントの実装
4. データ収集システムの構築

詳細な実装計画は `.kiro/specs/theme-discovery-tool/tasks.md` を参照してください。
