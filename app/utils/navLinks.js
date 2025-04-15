// utils/navLinks.js
export const getNavLinksForRole = (role, isLoggedIn) => {
  const baseLinks = [
    { path: "/", label: "Home", public: true },
    { path: "/about", label: "About Us", public: true },
    { path: "/signup", label: "Sign Up", public: true },
  ];

  const roleLinks = {
    player: [
      { path: "/coaches", label: "Coaches" },
      { path: "/players/info", label: "Player Info" },
      { path: "/players/reservations", label: "Reservations" },
      { path: "/booking", label: "Book Court" },
    ],
    coach: [{ path: "/dashboard/coach", label: "Dashboard" }],
    owner: [{ path: "/dashboard/owner", label: "Dashboard" }],
  };

  const logoutOrLogin = isLoggedIn
    ? [{ path: "#", label: "Log Out" }]
    : [{ path: "/login", label: "Log In" }];

  return [
    ...baseLinks,
    ...(roleLinks[role] || []),
    ...(isLoggedIn ? [] : [{ path: "/login", label: "Log In" }]),
    ...logoutOrLogin,
  ];
};
