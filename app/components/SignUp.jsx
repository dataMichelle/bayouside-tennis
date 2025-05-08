import React from "react";

const SignUp = ({
  handleSignUp,
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  role,
  setRole,
  error,
  loading,
}) => {
  return (
    <form onSubmit={handleSignUp} className="space-y-6 max-w-md mx-auto">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
          placeholder="Jane Doe"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
          placeholder="123-456-7890"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium mb-1"
        >
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium mb-1">
          Role
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
        >
          <option value="player">Player</option>
          <option value="coach">Coach</option>
        </select>
      </div>

      {error && <p className="text-red-500 text-center">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? "Signing up..." : "Sign Up"}
      </button>
    </form>
  );
};

export default SignUp;
