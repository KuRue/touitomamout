import { afterEach, beforeEach, expect, vi } from "vitest";

import { getRedirectedUrl } from "../get-redirection";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getRedirectedUrl", () => {
  describe("when the url is redirected", () => {
    it("should return the final url", async () => {
      fetchMock
        .mockResolvedValueOnce(
          new Response(null, {
            status: 301,
            headers: {
              location: "https://github.com/",
            },
          }),
        )
        .mockResolvedValueOnce(
          new Response("<html></html>", {
            status: 200,
            headers: {
              "content-type": "text/html",
            },
          }),
        );

      const result = await getRedirectedUrl("https://t.co/bbJgfyzcJR");

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result).toStrictEqual("https://github.com/");
    });
  });
  describe("when the url is not redirected", () => {
    it("should return null", async () => {
      fetchMock.mockResolvedValue(
        new Response("<html></html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      );

      const result = await getRedirectedUrl("https://t.co/_____null_____");
      expect(result).toStrictEqual(null);
    });
  });
});
