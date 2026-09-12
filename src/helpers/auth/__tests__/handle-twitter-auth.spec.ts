import { Scraper } from "@the-convocation/twitter-scraper";
import { beforeEach, Mock, vi } from "vitest";

import { handleTwitterAuth } from "../handle-twitter-auth";
import { restorePreviousSession } from "../restore-previous-session";

vi.mock("../restore-previous-session", () => ({
  restorePreviousSession: vi.fn(),
}));

const { mockedConstants } = vi.hoisted(() => ({
  mockedConstants: {
    TWITTER_USERNAME: "",
    TWITTER_PASSWORD: "",
    TWITTER_EMAIL: "",
    TWITTER_2FA_SECRET: "",
    TWITTER_COOKIES: "",
  },
}));

vi.mock("../../../constants", () => mockedConstants);

vi.doMock("../../../constants", () => ({
  TWITTER_USERNAME: mockedConstants.TWITTER_USERNAME,
  TWITTER_PASSWORD: mockedConstants.TWITTER_PASSWORD,
}));

const restorePreviousSessionSpy = restorePreviousSession as Mock;

const isLoggedInSpy = vi.fn();
const loginSpy = vi.fn();
const getCookiesSpy = vi.fn();
const setCookiesSpy = vi.fn();

const twitterClient = {
  isLoggedIn: isLoggedInSpy,
  login: loginSpy,
  getCookies: getCookiesSpy,
  setCookies: setCookiesSpy,
} as unknown as Scraper;

describe("handleTwitterAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when constants are not set", () => {
    beforeEach(() => {
      mockedConstants.TWITTER_USERNAME = "";
      mockedConstants.TWITTER_PASSWORD = "";
      mockedConstants.TWITTER_EMAIL = "";
      mockedConstants.TWITTER_2FA_SECRET = "";
      mockedConstants.TWITTER_COOKIES = "";
    });

    it("should not log in", async () => {
      const result = await handleTwitterAuth(twitterClient);

      expect(restorePreviousSessionSpy).not.toHaveBeenCalled();
      expect(loginSpy).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe("when constants are set", () => {
    beforeEach(() => {
      mockedConstants.TWITTER_USERNAME = "username";
      mockedConstants.TWITTER_PASSWORD = "password";
      mockedConstants.TWITTER_EMAIL = "";
      mockedConstants.TWITTER_2FA_SECRET = "";
      mockedConstants.TWITTER_COOKIES = "";
    });

    describe("when cookies are set", () => {
      beforeEach(() => {
        getCookiesSpy.mockResolvedValue(["cookies"]);
        isLoggedInSpy.mockResolvedValue(true);
      });

      it("should restore the previous session", async () => {
        await handleTwitterAuth(twitterClient);

        expect(restorePreviousSessionSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe("when cookies are not set", () => {
      beforeEach(() => {
        getCookiesSpy.mockResolvedValue(["cookies"]);
        isLoggedInSpy
          .mockResolvedValueOnce(false)
          .mockResolvedValueOnce(true)
          .mockResolvedValue(true);
      });

      it("should login", async () => {
        await handleTwitterAuth(twitterClient);

        expect(restorePreviousSessionSpy).toHaveBeenCalledTimes(1);
        expect(isLoggedInSpy).toHaveBeenCalledTimes(3);
        expect(loginSpy).toHaveBeenCalledTimes(1);
        expect(loginSpy).toHaveBeenCalledWith(
          "username",
          "password",
          undefined,
          undefined,
        );
      });
    });
  });
});
