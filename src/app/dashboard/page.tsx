import Image from "next/image";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar */}
      <nav className="bg-forest-green-900 shadow-md p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image 
              src="/assets/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-full bg-white p-1"
            />
            <h1 className="text-xl font-bold text-white">Ceylon Green Life EMS</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="bg-gold-500 hover:bg-gold-400 text-forest-green-900 font-semibold px-4 py-2 rounded-md shadow-sm transition">
              + Add Employee
            </button>
            <button className="bg-forest-green-700 hover:bg-forest-green-600 text-white font-semibold px-4 py-2 rounded-md shadow-sm transition">
              Export Excel
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Employee Directory</h2>
          <p className="text-gray-500">Manage and view all plantation staff members.</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6 flex gap-4">
          <input 
            type="text" 
            placeholder="Search employees..." 
            className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-forest-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <select className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-forest-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">All Branches</option>
            <option value="Warakapola">Warakapola Metro</option>
            <option value="Kegalle">Kegalle</option>
          </select>
        </div>

        {/* Empty State */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-forest-green-100 text-forest-green-600 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No Employees Found</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-4">
            The database is currently empty. Connect your database and add an employee to get started.
          </p>
          <button className="text-forest-green-600 hover:text-forest-green-700 font-semibold underline">
            Refresh Data
          </button>
        </div>
      </main>
    </div>
  );
}
