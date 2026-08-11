// this function inits Bright Data Configuration
export function initBrightData() {
  // BrightData proxy configuration
  const username = String(process.env.BRIGHT_DATA_USERNAME);
  const password = String(process.env.BRIGHT_DATA_PASSWORD);
  const port = 33335;
  // const port = 22225;
  const session_id = (1000000 * Math.random()) | 0;
  const options: {
    auth: {
      username: string;
      password: string;
    };
    host: string;
    port: number;
    rejectUnauthorized: boolean;
    headers?: Record<string, string>;
  } = {
    auth: {
      username: `${username}-session-${session_id}`,
      password,
    },
    host: "brd.superproxy.io",
    port,
    rejectUnauthorized: false,
  };

  return { options };
}
