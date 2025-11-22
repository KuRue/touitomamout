import { afterEach, beforeEach, vi } from "vitest";

import { fetchLinkMetadata } from "../fetch-link-metadata";
import { METADATA_MOCK } from "./mocks/metadata";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

vi.mock("../../../constants", () => {
  return {
    TWITTER_HANDLE: "username",
    MASTODON_INSTANCE: "mastodon.social",
    MASTODON_MAX_POST_LENGTH: 500,
    BLUESKY_MAX_POST_LENGTH: 300,
  };
});

describe("fetchLinkMetadata", () => {
  it("should return the metadata if data is found", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(METADATA_MOCK), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const result = await fetchLinkMetadata("https://bsky.app");
    expect(JSON.stringify(result)).toStrictEqual(JSON.stringify(METADATA_MOCK));
  });

  it("should return null if no data is found", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "not found" }), {
        status: 404,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const result = await fetchLinkMetadata("https://does-not-exist.example");
    expect(result).toBeNull();
  });
});
