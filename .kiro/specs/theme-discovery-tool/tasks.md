# 実装計画

- [x] 1. プロジェクト基盤とコア設定の構築
  - Next.js 14 + TypeScript + TailwindCSS プロジェクトの初期化
  - Supabase プロジェクト作成とデータベース接続設定
  - 基本的なフォルダ構造とコンポーネント階層の構築
  - ESLint, Prettier, Husky の設定
  - _要件: 9.1, 11.1_

- [x] 2. データベーススキーマと Supabase 設定の実装
  - [x] 2.1 コアテーブルの作成と RLS 設定
    - users, themes, trend_data, competitor_analysis テーブルの作成
    - Row Level Security (RLS) ポリシーの設定
    - データベースインデックスの最適化
    - _要件: 9.1, 12.1_

  - [x] 2.2 認証システムの実装
    - Supabase Auth の設定とメール/パスワード認証
    - OAuth プロバイダー（Google, GitHub）の設定
    - 認証状態管理とルート保護の実装
    - _要件: 9.1, 12.1_

- [x] 3. TypeScript 型定義と API クライアントの実装
  - [x] 3.1 コアデータ型の定義
    - Theme, User, TrendData, DemographicData 等の型定義
    - API レスポンス型とリクエスト型の定義
    - Zod スキーマによるランタイム検証の実装
    - _要件: 1.1, 2.1_

  - [x] 3.2 Supabase クライアントと API ヘルパーの実装
    - Supabase クライアント設定とタイプ生成
    - データベース操作用のヘルパー関数作成
    - エラーハンドリングとレスポンス正規化
    - _要件: 9.1, 10.2_

- [x] 4. 基本 UI コンポーネントとレイアウトの実装
  - [x] 4.1 共通 UI コンポーネントの作成
    - Header, Sidebar, LoadingSpinner, Button 等の基本コンポーネント
    - TailwindCSS による統一されたデザインシステム
    - レスポンシブデザインの実装
    - _要件: 11.1, 11.2_

  - [x] 4.2 認証関連 UI の実装
    - LoginForm, SignupForm, ProfileSettings コンポーネント
    - 認証状態に基づくナビゲーション制御
    - パスワードリセット機能の実装
    - _要件: 12.1, 13.1_

- [ ] 5. ダッシュボードとテーマ表示機能の実装
  - [x] 5.1 メインダッシュボードの構築
    - TrendDashboard コンポーネントの実装
    - カテゴリー別フィルタリング機能（国、年齢、性別、人種）
    - リアルタイムデータ更新の実装
    - _要件: 1.1, 1.2, 3.2_

  - [x] 5.2 テーマカードとリスト表示の実装
    - ThemeCard コンポーネントによるテーマ一覧表示
    - マネタイズスコア表示とソート機能
    - 仮想スクロールによる大量データ表示最適化
    - _要件: 2.1, 11.3_

- [ ] 6. マネタイズスコア算出システムの実装
  - [ ] 6.1 スコア算出アルゴリズムの実装
    - 市場規模、支払い意欲度、競合レベル等の要素を考慮したスコア計算
    - 重み付けロジックとスコア正規化の実装
    - スコア履歴の追跡とトレンド分析
    - _要件: 2.1, 7.1, 8.1_

  - [ ] 6.2 収益予測機能の実装
    - RevenueProjection コンポーネントの作成
    - 保守的・現実的・楽観的シナリオの計算
    - 収益化タイムラインの表示
    - _要件: 2.3, 8.1, 8.2_

- [ ] 7. 外部 API データ収集システムの実装
  - [ ] 7.1 データ収集 Edge Functions の作成
    - Google Trends, Reddit, Twitter, Product Hunt, GitHub API の統合
    - レート制限管理と自動調整機能
    - エラーハンドリングと再試行ロジック
    - _要件: 9.3, 10.1, 10.3_

  - [ ] 7.2 データ処理とリアルタイム更新の実装
    - 収集データの正規化と保存処理
    - Supabase Realtime による即座のフロントエンド反映
    - バッチ処理による効率的なデータ更新
    - _要件: 3.1, 10.2, 10.4_

- [ ] 8. 詳細分析と競合分析機能の実装
  - [ ] 8.1 テーマ詳細ページの構築
    - ThemeDetail コンポーネントによる包括的な情報表示
    - 市場データ、技術要件、開発期間の表示
    - トレンド推移グラフの実装
    - _要件: 1.3, 3.2, 5.3_

  - [ ] 8.2 競合分析機能の実装
    - CompetitorAnalysis コンポーネントの作成
    - 競合サービス数と市場飽和度の表示
    - ブルーオーシャン機会の強調表示
    - _要件: 4.1, 4.2, 4.3_

- [ ] 9. 地域・人口統計学的分析機能の実装
  - [ ] 9.1 地域分析システムの構築
    - 地域別トレンド表示とフィルタリング機能
    - 複数地域の比較分析機能
    - ローカライゼーション機会の特定と表示
    - _要件: 6.1, 6.2, 6.3_

  - [ ] 9.2 人口統計学的フィルタリングの実装
    - 多次元フィルター（年齢、性別、民族、所得）の実装
    - クロス分析とセグメント比較機能
    - フィルター状態の保存と復元
    - _要件: 1.1, 1.2_

- [ ] 10. 課金システムと Stripe 統合の実装
  - [ ] 10.1 Stripe 決済システムの構築
    - Stripe アカウント設定と API キー管理
    - サブスクリプション作成・管理 API の実装
    - Webhook による課金状態同期
    - _要件: 12.2, 13.2_

  - [ ] 10.2 料金プランとアクセス制御の実装
    - 3 段階料金プラン（無料・ベーシック・プロ）の実装
    - プラン別機能制限とアクセス制御
    - アップグレード促進 UI の実装
    - _要件: 12.1, 13.1, 13.3_

- [ ] 11. 通知システムと Resend 統合の実装
  - [ ] 11.1 メール通知システムの構築
    - Resend API 統合とメールテンプレート作成
    - 新着トレンド通知と週次レポートの自動送信
    - 課金関連通知の実装
    - _要件: 3.3, 12.3, 14.1_

  - [ ] 11.2 アラート機能の実装
    - カスタムアラート設定 UI の作成
    - 閾値監視とトリガー条件の実装
    - リアルタイム通知とメール通知の統合
    - _要件: 3.3, 13.1, 14.2_

- [ ] 12. API 機能とデータエクスポートの実装
  - [ ] 12.1 REST API エンドポイントの構築
    - テーマ検索・詳細取得 API の実装
    - 認証とレート制限の実装
    - API ドキュメントの作成
    - _要件: 13.2_

  - [ ] 12.2 データエクスポート機能の実装
    - CSV/JSON 形式でのデータエクスポート
    - プロプラン限定機能としてのアクセス制御
    - 大量データの効率的な処理
    - _要件: 13.1_

- [ ] 13. パフォーマンス最適化と PWA 対応
  - [ ] 13.1 フロントエンド最適化の実装
    - Next.js Server Components による初期表示高速化
    - 画像最適化とコード分割の実装
    - SWR によるデータキャッシング
    - _要件: 11.1, 11.2_

  - [ ] 13.2 PWA 機能の実装
    - Service Worker とオフライン対応
    - プッシュ通知機能
    - アプリライクなユーザー体験
    - _要件: 11.4_

- [ ] 14. テストとエラーハンドリングの実装
  - [ ] 14.1 ユニットテストの作成
    - マネタイズスコア算出ロジックのテスト
    - データ変換・バリデーション関数のテスト
    - React コンポーネントのテスト
    - _要件: 全般_

  - [ ] 14.2 統合テストと E2E テストの実装
    - API エンドポイントの統合テスト
    - ユーザー登録〜課金フローの E2E テスト
    - Playwright による自動テスト
    - _要件: 全般_

- [ ] 15. 監視・ログ・運用機能の実装
  - [ ] 15.1 監視システムの構築
    - Sentry による例外監視とエラー追跡
    - Vercel Analytics による使用状況分析
    - カスタムメトリクス収集の実装
    - _要件: 全般_

  - [ ] 15.2 運用自動化の実装
    - GitHub Actions による CI/CD パイプライン
    - 自動テスト実行とデプロイメント
    - データベースバックアップとメンテナンス
    - _要件: 9.2, 10.4_

- [ ] 16. 最終統合とデプロイメント
  - 全機能の統合テストと動作確認
  - 本番環境へのデプロイとドメイン設定
  - パフォーマンステストと最適化
  - ユーザー受け入れテストの実施
  - _要件: 全般_## 潜在的リ
    スクと対策

### 高リスク項目と詳細対策

#### 1. 外部 API 依存の課題 (タスク 7)

**問題点:**

- Google Trends API は公式 API が存在せず、非公式ライブラリに依存
- Twitter API の高額な料金体系（月額 100 ドル〜）
- Reddit API のレート制限が厳しい（1 分間に 100 リクエスト）

**対策:**

- Google Trends: `google-trends-api` npm パッケージの代わりに、Puppeteer によるスクレイピングを実装
- Twitter API: 無料の Basic プランで開始し、必要に応じてアップグレード
- Reddit API: 複数の API キーローテーションとキャッシング戦略を実装
- フォールバック戦略: 1 つの API が失敗しても他のデータソースで補完

```typescript
// 堅牢なデータ収集戦略の実装例
class RobustDataCollector {
  async collectTrendData(theme: string): Promise<TrendData> {
    const results = await Promise.allSettled([
      this.collectFromGoogleTrends(theme),
      this.collectFromReddit(theme),
      this.collectFromGitHub(theme),
    ])

    // 少なくとも1つのソースからデータが取得できれば成功とする
    const successfulResults = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value)

    if (successfulResults.length === 0) {
      throw new Error('All data sources failed')
    }

    return this.mergeDataSources(successfulResults)
  }
}
```

#### 2. マネタイズスコア算出の複雑性 (タスク 6)

**問題点:**

- 市場規模の正確な測定が困難
- 支払い意欲度の定量化が主観的
- 競合分析の自動化が技術的に困難

**対策:**

- 段階的実装: 最初は簡単な指標から開始し、徐々に精度を向上
- 複数指標の組み合わせ: 単一指標に依存せず、複数の代理指標を使用
- ユーザーフィードバック: 実際の開発者からのフィードバックでスコアを調整

```typescript
// 段階的スコア算出の実装
class MonetizationScoreCalculator {
  // Phase 1: 基本的な指標のみ
  calculateBasicScore(theme: Theme): number {
    const searchVolume = this.normalizeSearchVolume(theme.searchVolume)
    const competitorCount = this.normalizeCompetitorCount(
      theme.competitors.length
    )
    return searchVolume * 0.7 + (100 - competitorCount) * 0.3
  }

  // Phase 2: より詳細な分析を追加
  calculateAdvancedScore(theme: Theme): number {
    // より複雑なロジックを段階的に追加
  }
}
```

#### 3. Stripe 課金システムの複雑性 (タスク 10)

**問題点:**

- Webhook の冪等性処理が複雑
- サブスクリプション状態の同期が困難
- 税金計算と国際対応が複雑

**対策:**

- 最小限の課金機能から開始: 単純な月額課金のみ
- Stripe の公式テンプレートを活用
- 段階的な機能追加: 税金対応は後のフェーズで実装

```typescript
// シンプルな課金システムから開始
export async function createSubscription(userId: string, priceId: string) {
  try {
    const customer = await stripe.customers.create({
      metadata: { userId },
    })

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    })

    // データベース更新は最小限に
    await supabase.from('subscriptions').insert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
    })

    return subscription
  } catch (error) {
    // 詳細なエラーログとフォールバック処理
    console.error('Subscription creation failed:', error)
    throw error
  }
}
```

#### 4. パフォーマンス問題 (タスク 13)

**問題点:**

- 大量のトレンドデータによる表示遅延
- リアルタイム更新による負荷増大
- モバイル端末での動作が重い

**対策:**

- 仮想スクロールの確実な実装
- データのページネーション
- 段階的ローディング戦略

```typescript
// パフォーマンス重視の実装
export function TrendDashboard() {
  const [visibleItems, setVisibleItems] = useState(50); // 初期表示数を制限
  const [isLoading, setIsLoading] = useState(false);

  const { data: themes, error } = useSWR(
    `/api/themes?limit=${visibleItems}`,
    fetcher,
    {
      revalidateOnFocus: false, // 不要な再取得を防ぐ
      dedupingInterval: 60000, // 1分間のキャッシュ
    }
  );

  const loadMore = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setVisibleItems((prev) => prev + 50);
    setIsLoading(false);
  }, [isLoading]);

  return (
    <VirtualizedList
      items={themes || []}
      itemHeight={120}
      onEndReached={loadMore}
      renderItem={({ item }) => <ThemeCard theme={item} />}
    />
  );
}
```

### 実装順序の最適化

#### 優先度の再調整

1. **最優先 (MVP)**: タスク 1-5 + 簡易版タスク 6
2. **高優先**: タスク 7-8 (基本的なデータ収集と表示)
3. **中優先**: タスク 10-11 (課金システム)
4. **低優先**: タスク 9, 12-16 (高度な機能と最適化)

#### 段階的リリース戦略

```
Phase 1 (MVP - 4週間):
- 基本的なテーマ表示
- 簡単なフィルタリング
- ユーザー認証

Phase 2 (ベータ版 - 6週間):
- データ収集システム
- 基本的なマネタイズスコア
- 無料プラン提供

Phase 3 (正式版 - 8週間):
- 課金システム
- 高度な分析機能
- 通知システム
```

### 技術的負債の回避策

#### コード品質の維持

```typescript
// 型安全性を最優先
interface StrictTheme {
  readonly id: string
  readonly title: string
  readonly monetizationScore: number
  readonly lastUpdated: Date
}

// エラーハンドリングの統一
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// 設定の外部化
export const config = {
  api: {
    googleTrends: {
      maxRetries: 3,
      timeout: 10000,
      rateLimitPerMinute: 100,
    },
    reddit: {
      maxRetries: 5,
      timeout: 15000,
      rateLimitPerMinute: 60,
    },
  },
} as const
```

### 運用面での対策

#### 監視とアラート

- Sentry でのエラー監視（無料プランで開始）
- Vercel Analytics での使用状況追跡
- Supabase ダッシュボードでの DB 監視
- 手動でのデータ品質チェック（週 1 回）

#### バックアップ戦略

- Supabase の自動バックアップ機能を活用
- 重要な設定ファイルの Git 管理
- 環境変数の安全な管理（Vercel 環境変数）

この詳細な分析により、プロジェクト完遂の可能性を大幅に向上させることができます。
