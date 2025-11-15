// src/components/Login.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  signInWithGoogle,
  loginWithEmail,
  getGoogleRedirectResult,
} from "../firebase/firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ---- Check for redirect result (if you ever switch to redirect) ----
  useEffect(() => {
    getGoogleRedirectResult()
      .then((result) => {
        if (result?.user) navigate("/");
      })
      .catch(() => {}); // ignore – not a redirect flow
  }, [navigate]);

  // ---- Google Sign-In (popup) ----
  const handleGoogle = async () => {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      await signInWithGoogle();
      navigate("/");
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // ---- Email/Password Sign-In ----
  const handleEmail = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      await loginWithEmail(email, password);
      navigate("/");
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // ---- Central error translator ----
  const handleAuthError = (err) => {
    console.error(err);
    switch (err.code) {
      case "auth/popup-closed-by-user":
        setError("Popup was closed. Please keep it open and try again.");
        break;
      case "auth/popup-blocked":
        setError("Popup blocked. Allow pop-ups for this site and retry.");
        break;
      case "auth/cancelled-popup-request":
        setError("Too many pop-ups. Try again in a moment.");
        break;
      case "auth/user-not-found":
      case "auth/wrong-password":
        setError("Incorrect email or password.");
        break;
      case "auth/invalid-email":
        setError("Invalid email address.");
        break;
      default:
        setError(err.message || "Sign-in failed. Check console.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-red-600 mb-6">
          Intrest
        </h1>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        {/* Google Button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-full py-3 mb-4 hover:bg-gray-50 transition"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="w-5 h-5"
          />
          <span className="font-medium">Continue with Google</span>
        </button>

        <div className="flex items-center my-6">
          <hr className="flex-1 border-gray-300" />
          <span className="px-3 text-sm text-gray-500">OR</span>
          <hr className="flex-1 border-gray-300" />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmail}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-full border border-gray-300 mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-full border border-gray-300 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-full font-semibold hover:bg-red-700 transition"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="text-red-600 font-medium hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;