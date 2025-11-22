import { afterEach, beforeEach, vi } from "vitest";

import { mediaDownloaderService } from "../media-downloader.service";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("mediaDownloaderService", () => {
  it("should download media", async () => {
    fetchMock.mockResolvedValue(
      new Response("placeholder", {
        status: 200,
        headers: { "content-type": "image/png" },
      }),
    );

    const url = "https://placehold.co/10x10.png";
    const result = await mediaDownloaderService(url);

    expect(result).toBeInstanceOf(Blob);
  });

  describe("when the media is not found", () => {
    it("should fail", async () => {
      fetchMock.mockRejectedValue(new Error("not found"));

      await expect(mediaDownloaderService("")).rejects.toBeInstanceOf(Error);
    });
  });
});
