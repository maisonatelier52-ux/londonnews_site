import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3005";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    ...(process.env.PLAYWRIGHT_USE_SYSTEM_CHROME ? { channel: "chrome" as const } : {})
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: "npm run start",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        env: {
          ...process.env,
          HOSTNAME: "127.0.0.1",
          PORT: "3005",
          NEXTAUTH_URL: baseURL
        }
      }
});

// import { defineConfig } from "@playwright/test";

// const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3005";

// export default defineConfig({
//   testDir: "./tests",
//   timeout: 30_000,
//   expect: {
//     timeout: 10_000
//   },
//   fullyParallel: false,
//   retries: process.env.CI ? 2 : 0,
//   reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
//   use: {
//     baseURL,
//     trace: "retain-on-failure",
//     ...(process.env.PLAYWRIGHT_USE_SYSTEM_CHROME ? { channel: "chrome" as const } : {})
//   },
//   webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
//     ? undefined
//     : {
//         command: "npm run start",
//         url: baseURL,
//         reuseExistingServer: !process.env.CI,
//         env: {
//           ...process.env,
//           HOSTNAME: "127.0.0.1",
//           PORT: "3005"
//         }
//       }
// });
