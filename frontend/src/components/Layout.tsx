import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="flex-grow">
        <div className="container-app py-8">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
