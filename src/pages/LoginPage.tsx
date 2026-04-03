import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const LoginPage: React.FC = () => {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const isDisabled = !emailOrUsername || !password;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!emailOrUsername || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      await login(emailOrUsername, password);
      navigate("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const apiError = (err.response?.data as { error?: string } | undefined)?.error;

        if (status === 401) {
          setError("Invalid username/email or password.");
          return;
        }

        if (status === 400) {
          setError(apiError || "Please check your input and try again.");
          return;
        }

        setError(apiError || "Server error. Please try again later.");
        return;
      }

      setError("Unknown error. Please try again later.");
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-bg text-text items-center justify-center px-4 py-10 sm:py-0">
      <div className="w-full max-w-md rounded-2xl bg-surface glow-hover px-5 py-10 sm:px-8 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-center">
          Login to CodeBoard
        </h1>

        <div className="flex flex-wrap items-center justify-center mb-6 gap-x-2 gap-y-1 text-center">
          <p className="text-text-secondary">Don't have an account?</p>
          <button
            type="button"
            className="font-semibold text-primary hover:text-primary-hover transition-colors"
            onClick={() => navigate("/register")}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col justify-center">
          <label className="text-text-secondary text-sm mb-1">Email or username</label>
          <input
            name="emailOrUsernameInput"
            type="text"
            autoCapitalize="none"
            autoCorrect="off"
            className="bg-surface-lite rounded-sm mb-4 p-3 focus:outline-none focus:bg-surface-lite-focus transition-colors duration-200 ease-in-out"
            value={emailOrUsername}
            onChange={(e) => {
              setEmailOrUsername(e.target.value);
              if (error) setError("");
            }}
          />

          <label className="text-text-secondary text-sm mb-1">Password</label>
          <input
            name="passwordInput"
            type="password"
            className="bg-surface-lite rounded-sm mb-2 p-3 focus:outline-none focus:bg-surface-lite-focus transition-colors duration-200 ease-in-out"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
          />

          {error && (
            <div className="mt-3 rounded-lg bg-error/10 border border-error/30 px-3 py-2">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isDisabled}
            className="bg-secondary p-4 mb-2 mt-5 rounded-lg text-text-buttons hover:bg-secondary-hover disabled:bg-surface-lite disabled:text-text-secondary transition-all duration-200 ease-in-out disabled:opacity-70 md:hover:-translate-y-0.5 active:translate-y-0"
          >
            Continue
          </button>

          <button
            type="button"
            className="bg-primary mt-2 rounded-lg hover:bg-primary-hover p-4 transition-all duration-200 ease-in-out text-text-buttons md:hover:-translate-y-0.5 active:translate-y-0"
          >
            Continue with GitHub
          </button>
        </form>
      </div>
    </main>
  );
};

export default LoginPage;
