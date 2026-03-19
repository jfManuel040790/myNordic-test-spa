const authority = B2C_AUTHORITY;
const clientId = B2C_CLIENT_ID;

const authorityHost = new URL(authority).hostname;

export const msalConfig = {
  auth: {
    clientId,
    authority,
    redirectUri: "http://localhost:8080/mynordic/callback",
    knownAuthorities: [authorityHost],
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
};

export const loginRequest = {
  scopes: ["openid", "profile"],
};
