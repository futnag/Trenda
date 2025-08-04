# 設計書

## 概要

個人開発者向けテーマ発見ツールは、マネタイズ可能性の高い開発テーマを効率的に発見するためのWebアプリケーションです。TypeScript による型安全性、TailwindCSS による効率的なスタイリング、リアルタイムデータ収集、AI駆動の市場分析、段階的課金システムを組み合わせた包括的なプラットフォームを提供します。

## アーキテクチャ

### システム全体構成

```mermaid
graph TB
    subgraph "Frontend (Vercel)"
        A[Next.js App (TypeScript)]
        B[React Components (TypeScript)]
        C[TailwindCSS Styling]
    end

    subgraph "Backend Services"
        D[Next.js API Routes]
        E[Supabase Edge Functions]
        F[Data Collection Workers]
    end

    subgraph "Database & Auth"
        G[Supabase PostgreSQL]
        H[Supabase Auth]
        I[Supabase Realtime]
    end

    subgraph "External APIs"
        J[Google Trends API]
        K[Reddit API]
        L[Twitter API]
        M[Product Hunt API]
        N[GitHub API]
    end

    subgraph "Third-party Services"
        O[Stripe Payment]
        P[Resend Email]
    end

    A --> D
    A --> G
    A --> H
    D --> G
    E --> G
    F --> J
    F --> K
    F --> L
    F --> M
    F --> N
    D --> O
    D --> P
    G --> I
    I --> A
```

### データフロー

1. **データ収集**: Edge Functions が定期的に外部APIからトレンドデータを収集
2. **データ処理**: 収集したデータをマネタイズスコア算出アルゴリズムで分析
3. **リアルタイム更新**: Supabase Realtimeでフロントエンドに即座に反映
4. **ユーザーインタラクション**: フィルタリング、詳細表示、アラート設定
5. **課金処理**: Stripe Webhookで課金状態を管理

## コンポーネントと インターフェース

### フロントエンドコンポーネント構成

```
src/
├── components/
│   ├── dashboard/
│   │   ├── TrendDashboard.tsx
│   │   ├── CategoryFilter.tsx
│   │   ├── MonetizationScore.tsx
│   │   └── TrendChart.tsx
│   ├── theme/
│   │   ├── ThemeCard.tsx
│   │   ├── ThemeDetail.tsx
│   │   ├── CompetitorAnalysis.tsx
│   │   └── RevenueProjection.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── ProfileSettings.tsx
│   ├── subscription/
│   │   ├── PricingPlans.tsx
│   │   ├── PaymentForm.tsx
│   │   └── BillingHistory.tsx
│   └── common/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── LoadingSpinner.tsx
├── pages/
│   ├── api/
│   │   ├── themes/
│   │   ├── payments/
│   │   └── webhooks/
│   ├── dashboard.tsx
│   ├── themes/[id].tsx
│   ├── pricing.tsx
│   └── profile.tsx
└── lib/
    ├── supabase.ts
    ├── stripe.ts
    └── utils.ts
```

### API エンドポイント設計

#### テーマ関連API

- `GET /api/themes` - テーマ一覧取得（フィルタリング対応）
- `GET /api/themes/[id]` - 特定テーマの詳細情報
- `GET /api/themes/trending` - トレンドテーマ取得
- `POST /api/themes/alerts` - アラート設定

#### ユーザー・課金関連API

- `POST /api/auth/signup` - ユーザー登録
- `POST /api/payments/create-subscription` - サブスクリプション作成
- `POST /api/payments/cancel-subscription` - サブスクリプション解約
- `POST /api/webhooks/stripe` - Stripe Webhook処理

#### データ収集API（Edge Functions）

- `POST /api/collect/trends` - トレンドデータ収集
- `POST /api/analyze/monetization` - マネタイズスコア算出
- `POST /api/notify/users` - ユーザー通知送信

## データモデル

### データベーススキーマ

```sql
-- ユーザーテーブル
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    subscription_tier VARCHAR(20) DEFAULT 'free',
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- テーマテーブル
CREATE TABLE themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    monetization_score INTEGER,
    market_size BIGINT,
    competition_level VARCHAR(20),
    technical_difficulty VARCHAR(20),
    estimated_revenue_min INTEGER,
    estimated_revenue_max INTEGER,
    data_sources JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- トレンドデータテーブル
CREATE TABLE trend_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID REFERENCES themes(id),
    source VARCHAR(50),
    search_volume INTEGER,
    growth_rate DECIMAL(5,2),
    geographic_data JSONB,
    demographic_data JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- 競合分析テーブル
CREATE TABLE competitor_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID REFERENCES themes(id),
    competitor_name VARCHAR(255),
    competitor_url VARCHAR(500),
    pricing_model VARCHAR(100),
    estimated_revenue INTEGER,
    user_count INTEGER,
    features JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ユーザーアラートテーブル
CREATE TABLE user_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    theme_id UUID REFERENCES themes(id),
    alert_type VARCHAR(50),
    threshold_value INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- サブスクリプションテーブル
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    stripe_subscription_id VARCHAR(255) UNIQUE,
    plan_name VARCHAR(50),
    status VARCHAR(20),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### マネタイズスコア算出アルゴリズム

```typescript
interface MonetizationFactors {
  marketSize: number // 市場規模 (0-100)
  paymentWillingness: number // 支払い意欲 (0-100)
  competitionLevel: number // 競合レベル (0-100, 低いほど良い)
  revenueModels: number // 収益化手法の多様性 (0-100)
  customerAcquisitionCost: number // 顧客獲得コスト (0-100, 低いほど良い)
  customerLifetimeValue: number // 顧客生涯価値 (0-100)
}

function calculateMonetizationScore(factors: MonetizationFactors): number {
  const weights = {
    marketSize: 0.25,
    paymentWillingness: 0.2,
    competitionLevel: 0.15,
    revenueModels: 0.15,
    customerAcquisitionCost: 0.15,
    customerLifetimeValue: 0.1,
  }

  const score =
    factors.marketSize * weights.marketSize +
    factors.paymentWillingness * weights.paymentWillingness +
    (100 - factors.competitionLevel) * weights.competitionLevel +
    factors.revenueModels * weights.revenueModels +
    (100 - factors.customerAcquisitionCost) * weights.customerAcquisitionCost +
    factors.customerLifetimeValue * weights.customerLifetimeValue

  return Math.round(score)
}
```

## エラーハンドリング

### エラー分類と対応

1. **API レート制限エラー**
   - 指数バックオフによる再試行
   - 複数APIキーのローテーション
   - ユーザーへの適切な通知

2. **データベース接続エラー**
   - Supabaseの自動フェイルオーバー活用
   - 接続プールの最適化
   - キャッシュからのフォールバック

3. **課金処理エラー**
   - Stripe Webhookの冪等性保証
   - 失敗時の自動リトライ
   - ユーザーへの明確なエラーメッセージ

4. **データ収集エラー**
   - 部分的な失敗でもサービス継続
   - エラーログの詳細記録
   - 管理者への自動アラート

### エラーレスポンス形式

```typescript
interface APIError {
  error: {
    code: string
    message: string
    details?: any
    timestamp: string
  }
}
```

## テスト戦略

### テストピラミッド

1. **ユニットテスト (70%)**
   - マネタイズスコア算出ロジック
   - データ変換関数
   - バリデーション関数

2. **統合テスト (20%)**
   - API エンドポイント
   - データベース操作
   - 外部API連携

3. **E2Eテスト (10%)**
   - ユーザー登録〜課金フロー
   - テーマ検索〜詳細表示
   - アラート設定〜通知

### テストツール

- **フロントエンド**: Jest + React Testing Library
- **API**: Jest + Supertest
- **E2E**: Playwright
- **データベース**: Supabase Test Database

## セキュリティ設計

### 認証・認可

1. **Supabase Auth による認証**
   - メール/パスワード認証
   - OAuth プロバイダー（Google, GitHub）
   - JWT トークンによるセッション管理

2. **Row Level Security (RLS)**
   - ユーザーデータの完全分離
   - サブスクリプション状態による機能制限
   - API アクセス権限の細かな制御

3. **API セキュリティ**
   - レート制限（IP ベース + ユーザーベース）
   - CORS 設定の適切な管理
   - 入力値検証とサニタイゼーション

### データ保護

1. **個人情報保護**
   - GDPR 準拠のデータ処理
   - ユーザーデータの暗号化
   - データ削除権の実装

2. **API キー管理**
   - 環境変数による秘匿情報管理
   - キーローテーションの自動化
   - 最小権限の原則

## パフォーマンス最適化

### フロントエンド最適化

1. **Next.js 最適化**
   - Server Components による初期表示高速化
   - 画像最適化（next/image）
   - 動的インポートによるコード分割

2. **キャッシング戦略**
   - SWR による効率的なデータフェッチ
   - Service Worker によるオフライン対応
   - CDN キャッシュの活用

3. **UI/UX 最適化**
   - 仮想スクロールによる大量データ表示
   - スケルトンローディング
   - プログレッシブ Web App (PWA) 対応

### バックエンド最適化

1. **データベース最適化**
   - インデックス設計
   - クエリ最適化
   - 接続プーリング

2. **API 最適化**
   - レスポンス圧縮
   - バッチ処理による効率化
   - 非同期処理の活用

## 監視・運用

### ログ・監視

1. **アプリケーション監視**
   - Vercel Analytics
   - Supabase ダッシュボード
   - カスタムメトリクス収集

2. **エラー追跡**
   - Sentry による例外監視
   - ユーザー行動の追跡
   - パフォーマンス監視

3. **ビジネスメトリクス**
   - ユーザー獲得・解約率
   - 機能利用状況
   - 収益指標の追跡

### 運用自動化

1. **デプロイメント**
   - GitHub Actions による CI/CD
   - 自動テスト実行
   - ステージング環境での検証

2. **データ管理**
   - 定期バックアップ
   - データ品質チェック
   - 古いデータのアーカイブ

### CI/CDパイプライン

```yaml
# .github/workflows/test-and-deploy.yml
name: Test and Deploy
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

### 技術スタック詳細

#### フロントエンド

- **Next.js 14**: App Router、Server Components、TypeScript完全対応
- **TypeScript**: 型安全性によるバグ削減、開発効率向上
- **TailwindCSS**: ユーティリティファーストによる高速スタイリング
- **React Hook Form**: フォーム管理とバリデーション
- **Zustand**: 軽量な状態管理
- **React Query**: サーバー状態管理とキャッシング

#### バックエンド

- **Next.js API Routes**: TypeScript による型安全なAPI開発
- **Supabase Edge Functions**: Deno + TypeScript による高速処理
- **Zod**: ランタイム型検証とスキーマ定義

#### 開発・ビルドツール

- **TypeScript**: 厳格な型チェック設定
- **ESLint + Prettier**: コード品質とフォーマット統一
- **Husky + lint-staged**: コミット前の自動チェック
- **PostCSS**: TailwindCSSの最適化

#### 型定義例

````typescript
// types/theme.ts
export interface Theme {
  id: string;
  title: string;
  description: string;
  category: ThemeCategory;
  monetizationScore: number;
  marketSize: number;
  competitionLevel: CompetitionLevel;
  technicalDifficulty: TechnicalDifficulty;
  estimatedRevenue: {
    min: number;
    max: number;
  };
  dataSources: DataSource[];
  createdAt: string;
  updatedAt: string;
}

export type ThemeCategory =
  | 'productivity'
  | 'entertainment'
  | 'education'
  | 'health'
  | 'finance'
  | 'social';

export type CompetitionLevel = 'low' | 'medium' | 'high';
export type TechnicalDifficulty = 'beginner' | 'intermediate' | 'advanced';

// types/user.ts
export interface User {
  id: string;
  email: string;
  subscriptionTier: SubscriptionTier;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionTier = 'free' | 'basic' | 'pro';
```## 地域・人
口統計学的分析機能

### 地域分析システム

```typescript
// types/demographics.ts
export interface DemographicData {
  country: string;
  region?: string;
  ageGroup: AgeGroup;
  gender: Gender;
  ethnicity?: string;
  incomeLevel: IncomeLevel;
}

export type AgeGroup = '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type IncomeLevel = 'low' | 'middle' | 'high' | 'premium';

// 地域別トレンド分析
export interface RegionalTrend {
  region: string;
  themes: Theme[];
  marketPotential: number;
  competitionLevel: CompetitionLevel;
  localizedOpportunities: LocalizedOpportunity[];
}

export interface LocalizedOpportunity {
  theme: string;
  localNeed: string;
  marketGap: number;
  culturalFactors: string[];
  regulatoryConsiderations: string[];
}
````

### 人口統計学的フィルタリング

1. **多次元フィルタリング**
   - 国・地域別フィルター
   - 年齢層別フィルター
   - 性別・民族別フィルター
   - 所得層別フィルター

2. **クロス分析機能**
   - 複数カテゴリーの組み合わせ分析
   - セグメント間の比較表示
   - トレンドの相関関係分析

## 収益化予測システム

### 詳細な収益モデル分析

```typescript
// types/monetization.ts
export interface RevenueProjection {
  timeframe: 'month' | 'quarter' | 'year'
  scenarios: {
    conservative: number
    realistic: number
    optimistic: number
  }
  assumptions: RevenueAssumption[]
}

export interface RevenueAssumption {
  factor: string
  value: number
  confidence: number // 0-100
  source: string
}

export interface MonetizationStrategy {
  primary: RevenueModel
  secondary: RevenueModel[]
  timeline: MonetizationTimeline
  riskFactors: RiskFactor[]
}

export type RevenueModel =
  | 'subscription'
  | 'freemium'
  | 'advertising'
  | 'transaction_fee'
  | 'affiliate'
  | 'premium_features'
  | 'marketplace'
```

### 競合分析の詳細化

1. **競合マッピング**
   - 直接競合・間接競合の分類
   - 機能比較マトリックス
   - 価格戦略分析
   - 市場シェア推定

2. **ブルーオーシャン発見**
   - 未開拓セグメントの特定
   - 差別化ポイントの提案
   - 参入戦略の推奨

## 技術実現可能性評価

### 開発難易度算出システム

```typescript
// types/technical.ts
export interface TechnicalAssessment {
  difficulty: TechnicalDifficulty
  requiredSkills: Skill[]
  estimatedDevelopmentTime: {
    mvp: number // weeks
    fullFeature: number // weeks
  }
  technicalRisks: TechnicalRisk[]
  recommendedStack: TechStack
}

export interface Skill {
  name: string
  level: 'beginner' | 'intermediate' | 'advanced'
  importance: 'nice_to_have' | 'important' | 'critical'
}

export interface TechnicalRisk {
  risk: string
  probability: number // 0-100
  impact: 'low' | 'medium' | 'high'
  mitigation: string
}
```

## リアルタイム通知システム

### 通知エンジン設計

1. **アラート設定**
   - カスタム閾値設定
   - 複数条件の組み合わせ
   - 通知頻度の調整

2. **通知配信**
   - Resend による即座のメール通知
   - Supabase Realtime による画面内通知
   - プッシュ通知（PWA）

3. **通知内容のパーソナライゼーション**
   - ユーザーの関心領域に基づく最適化
   - 過去の行動履歴を考慮
   - A/Bテストによる効果測定

## API設計の詳細化

### 外部API統合戦略

```typescript
// lib/api-integrations.ts
export class TrendDataCollector {
  async collectGoogleTrends(
    keywords: string[],
    region: string
  ): Promise<TrendData[]> {
    // Google Trends API integration
  }

  async collectRedditData(subreddits: string[]): Promise<RedditTrendData[]> {
    // Reddit API integration
  }

  async collectTwitterTrends(hashtags: string[]): Promise<TwitterTrendData[]> {
    // Twitter API integration
  }

  async collectProductHuntData(): Promise<ProductHuntTrendData[]> {
    // Product Hunt API integration
  }

  async collectGitHubTrends(): Promise<GitHubTrendData[]> {
    // GitHub API integration
  }
}
```

### レート制限管理

1. **API制限の管理**
   - 各APIの制限値監視
   - 自動的な処理調整
   - 複数キーのローテーション

2. **データ収集の最適化**
   - 優先度に基づく収集順序
   - キャッシュ活用による効率化
   - 差分更新による負荷軽減
