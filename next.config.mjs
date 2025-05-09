const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
            default-src 'self' https://bayousidetennis.netlify.app;
            script-src 'self' 'unsafe-inline' ${
              isDev ? "'unsafe-eval'" : ""
            } https://*.firebaseio.com https://www.googletagmanager.com https://apis.google.com;
            style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;
            font-src 'self' https://fonts.gstatic.com data:;
            connect-src 'self' https://*.firebaseio.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com;
            frame-src 'self' https://*.firebaseapp.com https://*.google.com https://*.gstatic.com;
            img-src 'self' data:;
            object-src 'none';
          `
              .replace(/\s{2,}/g, " ")
              .trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
