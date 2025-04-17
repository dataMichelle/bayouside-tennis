// utils/navLinks.js
export const getNavLinksForRole = (role, isLoggedIn) => {
  const baseLinks = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About Us" },
    { path: "/coaches", label: "Coaches" },
    { path: "/players/info", label: "Player Info" },
    { path: "/booking", label: "Book Court" },
  ];

  let roleBasedLinks = [];

  if (isLoggedIn) {
    if (role === "player") {
      roleBasedLinks = [
        { path: "/players/reservations", label: "Reservations" },
      ];
    } else if (role === "coach") {
      roleBasedLinks = [{ path: "/dashboard/coach", label: "Dashboard" }];
    } else if (role === "owner") {
      roleBasedLinks = [{ path: "/dashboard/owner", label: "Dashboard" }];
    }
  }

  const authLinks = isLoggedIn
    ? [{ path: "#", label: "Log Out", onClick: true }]
    : [
        { path: "/auth/login", label: "Log In" },
        { path: "/auth/signup", label: "Sign Up" },
      ];

  return [...baseLinks, ...roleBasedLinks, ...authLinks];
};
