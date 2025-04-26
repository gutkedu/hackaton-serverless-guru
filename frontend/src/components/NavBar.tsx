import { Link } from "react-router-dom";

export default function NavBar() {
  return (
    <header className="bg-white shadow dark:bg-gray-800">
      <div className="container-app">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-primary-600">
              LiveStream App
            </Link>
            <nav className="ml-10 space-x-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
              >
                Home
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
