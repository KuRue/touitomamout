import { Tweet } from "@the-convocation/twitter-scraper";

import { keepSelfReplies } from "../keep-self-replies";

vi.mock("../../../constants", () => {
  return {
    TWITTER_HANDLE: "username",
  };
});

describe("keepSelfReplies", () => {
  describe("when the tweet is a reply", () => {
    it.each([
      { isReply: true },
      { inReplyToStatusId: "123" },
      { isReply: false, inReplyToStatusId: "123" },
      { isReply: true, inReplyToStatusId: "123" },
      { isReply: true, inReplyToStatus: {} },
    ])(
      "should reject replies with an unknown parent author: %j",
      async (tweet) => {
        expect(await keepSelfReplies(tweet as Tweet)).toBe(false);
      },
    );

    it("should return true when is to the same user", async () => {
      const result = await keepSelfReplies({
        inReplyToStatus: { username: "username" },
      } as unknown as Tweet);

      expect(result).toBe(true);
    });

    it("should return false when is to a different user", async () => {
      const result = await keepSelfReplies({
        inReplyToStatus: { username: "potatoinc" },
      } as unknown as Tweet);

      expect(result).toBe(false);
    });
  });

  describe("when the tweet is not a reply", () => {
    it("should return true when is from the same user", async () => {
      const result = await keepSelfReplies({} as unknown as Tweet);

      expect(result).toBe(true);
    });
  });
});
