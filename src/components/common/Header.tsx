export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              Theme Discovery Tool
            </h1>
          </div>
          <nav className="flex space-x-8">
            <a href="#" className="text-gray-500 hover:text-gray-900">
              ダッシュボード
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900">
              テーマ
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900">
              料金プラン
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}
