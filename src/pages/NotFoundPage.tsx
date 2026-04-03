import React from "react";
import { Link } from "react-router-dom";
import error from "../components/svg/404error.svg";

const NotFoundPage: React.FC = () => {
  return (
    <main className="flex flex-col bg-bg items-center justify-center min-h-screen text-center text-text">
      <img src={error} alt="Страница не найдена" className="h-100 w-100"/>

      <Link
        to="/"
        className="px-8 py-2 rounded-md bg-primary hover:bg-primary-hover transition-colors"
      >
        Back to home page
      </Link>
    </main>
  );
};

export default NotFoundPage;
