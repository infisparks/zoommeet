export interface AppBranding {
  appName: string;
  shortName: string;
  tagline: string;
  logo: string;
  primaryColor: string;
  accentColor: string;
  supportEmail: string;
  version: string;
}

export const branding: AppBranding = {
  appName: "Infiplus Meet",
  shortName: "InfiMeet",
  tagline: "Enterprise-grade real-time video meetings & seamless collaboration",
  logo: "/logo.svg",
  primaryColor: "#2563EB",
  accentColor: "#6366F1",
  supportEmail: "support@infiplus.in",
  version: "1.0.0",
};
