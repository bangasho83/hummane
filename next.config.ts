import type { NextConfig } from "next";

// Help URL history:
//  1. Admin sections lived at /help/<section>. They now live at /help/admin/<section>.
//  2. Briefly, the employee guide lived at /help/member/<section>. It now lives at /help (and /help/<section>).
const legacyAdminHelpSections = [
  "account-and-access",
  "dashboard",
  "team",
  "attendance",
  "payroll",
  "organization",
  "resources",
  "hiring",
  "performance",
  "settings",
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      ...legacyAdminHelpSections.map((slug) => ({
        source: `/help/${slug}`,
        destination: `/help/admin/${slug}`,
        permanent: true,
      })),
      { source: "/help/employee-portal", destination: "/help", permanent: true },
      { source: "/help/member", destination: "/help", permanent: true },
      { source: "/help/member/:section", destination: "/help/:section", permanent: true },
    ];
  },
};

export default nextConfig;
