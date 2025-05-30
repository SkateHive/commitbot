import { Link, useLocation } from "wouter";

export default function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: "fas fa-chart-line" },
    { href: "/repositories", label: "Repositories", icon: "fab fa-github" },
    { href: "/summaries", label: "Summaries", icon: "fas fa-file-alt" },
    { href: "/configuration", label: "Configuration", icon: "fas fa-cog" },
    { href: "/history", label: "Post History", icon: "fas fa-history" },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-robot text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Skatehive DevBot</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">v1.0.0</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <a className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-primary text-white' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}>
                <i className={`${item.icon} w-5`}></i>
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Status Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <i className="fas fa-check text-green-600 dark:text-green-400 text-sm"></i>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Connected</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Last sync: 2 min ago</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
