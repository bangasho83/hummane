import type { NextConfig } from "next";

// Help sections used to live at /help/<section>. They now sit under /help/admin or /help/member.
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
      { source: "/help/employee-portal", destination: "/help/member", permanent: true },
    ];
  },
};

export default nextConfig;
