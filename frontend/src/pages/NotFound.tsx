import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg text-center">
      <h1 className="mb-4 text-6xl font-bold">404</h1>
      <p className="mb-8 text-xl">Page not found</p>
      <Link to="/" className="btn btn-primary">
        Go back home
      </Link>
    </div>
  );
}
