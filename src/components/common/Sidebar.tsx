export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-50 min-h-screen border-r border-gray-200">
      <div className="p-4">
        <nav className="space-y-2">
          <a
            href="#"
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-gray-100 rounded-md"
          >
            ダッシュボード
          </a>
          <a
            href="#"
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            トレンドテーマ
          </a>
          <a
            href="#"
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            競合分析
          </a>
          <a
            href="#"
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            アラート設定
          </a>
        </nav>
      </div>
    </aside>
  )
}
