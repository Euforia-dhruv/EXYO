import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: "https://accounts.google.com",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
