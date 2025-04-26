// app/utils/navLinks.js

// Links that always show in the static nav
export const baseLinks = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About Us" },
  { path: "/coaches", label: "Coaches" },
  { path: "/players/info", label: "Player Info" },
  { path: "/booking", label: "Reserve Court" },
];

// Links specific to roles
export const roleLinksMap = {
  player: [{ path: "/players/reservations", label: "Reservations" }],
  coach: [{ path: "/dashboard/coach", label: "Dashboard" }],
  owner: [{ path: "/dashboard/owner", label: "Dashboard" }],
};

// Auth-specific links
export const getAuthLinks = (isLoggedIn = false) =>
  isLoggedIn
    ? [{ path: "#", label: "Log Out", onClick: true }]
    : [
        { path: "/auth/login", label: "Log In" },
        { path: "/auth/signup", label: "Sign Up" },
      ];

// Combined helper for UserNav
export const getUserNavLinks = (role = "player", isLoggedIn = false) => {
  const roleLinks = isLoggedIn ? roleLinksMap[role] || [] : [];
  return [...roleLinks, ...getAuthLinks(isLoggedIn)];
};
