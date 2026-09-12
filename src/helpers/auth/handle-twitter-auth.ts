import { Scraper } from "@the-convocation/twitter-scraper";
import ora from "ora";
import { Cookie } from "tough-cookie";

import {
  TWITTER_2FA_SECRET,
  TWITTER_COOKIES,
  TWITTER_EMAIL,
  TWITTER_PASSWORD,
  TWITTER_USERNAME,
} from "../../constants";
import { saveCookies } from "../cookies/save-cookies";
import { TouitomamoutError } from "../error";
import { oraPrefixer } from "../logs";
import { restorePreviousSession } from "./restore-previous-session";

const parseCookiesString = (raw: string): Cookie[] => {
  return raw
    .split(";")
    .map((part) => Cookie.parse(part.trim()))
    .filter((cookie): cookie is Cookie => Boolean(cookie));
};

const toActionableLoginError = (err: unknown): Error => {
  const message = err instanceof Error ? err.message : String(err);

  if (/403\b|cloudflare|forbidden/i.test(message)) {
    return new Error(
      TouitomamoutError(
        "Touitomamout was unable to log in to Twitter/X (blocked by anti-bot protection)",
        [
          `Original error: ${message}`,
          "X is flagging this server IP (common on datacenter/Unraid hosts).",
          'Fix: export cookies from a logged-in browser and set TWITTER_COOKIES="ct0=...; auth_token=..." in your .env, then restart.',
          "See https://github.com/the-convocation/twitter-scraper#cookie-based-authentication",
        ],
      ),
    );
  }

  if (/399\b|incorrect|try again|suspicious|authenticate/i.test(message)) {
    return new Error(
      TouitomamoutError(
        "Touitomamout was unable to log in to Twitter/X (credentials rejected)",
        [
          `Original error: ${message}`,
          "Double-check TWITTER_USERNAME, TWITTER_PASSWORD (and TWITTER_EMAIL if X asks for verification).",
          "If credentials are correct, X is blocking automated logins: use TWITTER_COOKIES from a logged-in browser instead.",
        ],
      ),
    );
  }

  if (/429\b|rate.?limit/i.test(message)) {
    return new Error(
      TouitomamoutError(
        "Touitomamout was rate-limited while logging in to Twitter/X",
        [
          `Original error: ${message}`,
          "Wait ~15 minutes and restart. Consider lowering sync frequency (SYNC_FREQUENCY_MIN).",
        ],
      ),
    );
  }

  return new Error(
    TouitomamoutError("Touitomamout was unable to log in to Twitter/X", [
      `Original error: ${message}`,
      "Check TWITTER_USERNAME / TWITTER_PASSWORD in your .env.",
      "If it keeps failing, set TWITTER_COOKIES from a logged-in browser session.",
    ]),
  );
};

export const handleTwitterAuth = async (client: Scraper) => {
  const log = ora({
    color: "gray",
    prefixText: oraPrefixer("🦤 client"),
  }).start("connecting to twitter...");

  // Preferred fallback: raw cookies from env (bypasses Cloudflare/399 blocks).
  if (TWITTER_COOKIES) {
    const cookies = parseCookiesString(TWITTER_COOKIES);
    if (cookies.length) {
      await client.setCookies(cookies);
      if (await client.isLoggedIn()) {
        log.succeed("connected (using TWITTER_COOKIES)");
        const freshCookies = await client.getCookies();
        if (freshCookies?.length) {
          await saveCookies(freshCookies);
        }
        log.stop();
        return;
      }
      log.warn("TWITTER_COOKIES were rejected, falling back to other methods");
    }
  }

  if (!TWITTER_USERNAME || !TWITTER_PASSWORD) {
    log.succeed("connected as guest | replies will not be synced");
    return;
  }

  // Try to restore the previous session
  await restorePreviousSession(client);

  if (await client.isLoggedIn()) {
    log.succeed("connected (session restored)");
  } else {
    // Handle restoration failure
    try {
      await client.login(
        TWITTER_USERNAME,
        TWITTER_PASSWORD,
        TWITTER_EMAIL || undefined,
        TWITTER_2FA_SECRET || undefined,
      );
    } catch (err) {
      log.fail("authentication failure");
      throw toActionableLoginError(err);
    }
    if (!(await client.isLoggedIn())) {
      log.fail("authentication failure");
      throw toActionableLoginError(
        "Login did not establish a session (wrong credentials or X challenge).",
      );
    }
    log.succeed("connected (using credentials)");
  }
  log.stop();

  // Save session
  if (await client.isLoggedIn()) {
    await client.getCookies().then((cookies) => {
      saveCookies(cookies);
    });
  }
};
