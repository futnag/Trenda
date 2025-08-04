import Link from 'next/link'
import Header from '@/components/common/Header'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            個人開発者向け
            <br />
            テーマ発見ツール
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl">
            マネタイズ可能性の高い開発テーマを効率的に発見し、
            市場分析から収益予測まで包括的にサポートします。
          </p>
          
          <div className="space-x-4">
            <Link
              href="/auth/login"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
            >
              今すぐ始める
            </Link>
            <Link
              href="/pricing"
              className="bg-white hover:bg-gray-100 text-gray-800 font-bold py-3 px-6 rounded-lg text-lg border border-gray-300"
            >
              料金プランを見る
            </Link>
          </div>
        </div>

        <div className="grid text-center lg:max-w-5xl lg:w-full lg:grid-cols-4 lg:text-left gap-6">
          <div className="group rounded-lg border border-gray-200 bg-white px-5 py-4 transition-colors hover:border-blue-300 hover:bg-blue-50">
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              トレンド分析
            </h2>
            <p className="text-sm text-gray-600">
              市場トレンドを分析し、マネタイズ可能性の高いテーマを発見
            </p>
          </div>

          <div className="group rounded-lg border border-gray-200 bg-white px-5 py-4 transition-colors hover:border-blue-300 hover:bg-blue-50">
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              競合分析
            </h2>
            <p className="text-sm text-gray-600">
              競合状況を把握し、ブルーオーシャンを特定
            </p>
          </div>

          <div className="group rounded-lg border border-gray-200 bg-white px-5 py-4 transition-colors hover:border-blue-300 hover:bg-blue-50">
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              収益予測
            </h2>
            <p className="text-sm text-gray-600">
              マネタイズスコアと収益予測で投資判断をサポート
            </p>
          </div>

          <div className="group rounded-lg border border-gray-200 bg-white px-5 py-4 transition-colors hover:border-blue-300 hover:bg-blue-50">
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              技術評価
            </h2>
            <p className="text-sm text-gray-600">
              技術的実現可能性と開発期間を評価
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
