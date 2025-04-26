export default function Footer() {
  return (
    <footer className="bg-white py-6 dark:bg-gray-800">
      <div className="container-app">
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            © {new Date().getFullYear()} LiveStream App. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
