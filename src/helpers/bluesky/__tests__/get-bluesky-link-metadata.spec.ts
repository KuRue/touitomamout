import { AtpAgent } from "@atproto/api";
import { afterEach, beforeEach, vi } from "vitest";

import { fetchLinkMetadata } from "../fetch-link-metadata";
import { getBlueskyLinkMetadata } from "../get-bluesky-link-metadata";
import { METADATA_MOCK } from "./mocks/metadata";

vi.mock("../../../services/index", () => ({
  mediaDownloaderService: vi.fn(() => ({
    blobData: "blobData",
    mimeType: "mimeType",
  })),
}));

vi.mock("../../medias/parse-blob-for-bluesky", () => ({
  parseBlobForBluesky: vi.fn(() => ({
    blobData: "blobData",
    mimeType: "mimeType",
  })),
}));

vi.mock("../fetch-link-metadata", () => ({
  fetchLinkMetadata: vi.fn(),
}));

vi.mock("../../../constants", () => {
  return {
    TWITTER_HANDLE: "username",
    MASTODON_INSTANCE: "mastodon.social",
    MASTODON_MAX_POST_LENGTH: 500,
    BLUESKY_MAX_POST_LENGTH: 300,
  };
});

const uploadBlobMock = vi.fn(() => ({
  success: true,
  data: {
    blob: {
      original: "123456789",
    },
  },
}));

const fetchLinkMetadataMock = fetchLinkMetadata as unknown as ReturnType<
  typeof vi.fn
>;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getBlueskyLinkMetadata", () => {
  it("should return the metadata if data is found", async () => {
    fetchLinkMetadataMock.mockResolvedValue(METADATA_MOCK);

    const result = await getBlueskyLinkMetadata("https://bsky.app", {
      uploadBlob: uploadBlobMock,
    } as unknown as AtpAgent);
    expect(result).toStrictEqual({
      ...METADATA_MOCK,
      image: {
        success: true,
        data: {
          blob: {
            original: "123456789",
          },
        },
      },
    });
  });

  describe("when no image if found", () => {
    it("should return the metadata without image property", async () => {
      fetchLinkMetadataMock.mockResolvedValue({
        ...METADATA_MOCK,
        url: "https://github.com/",
        title:
          "GitHub · Build and ship software on a single, collaborative platform",
        description:
          "Join the world's most widely adopted, AI-powered developer platform where millions of developers, businesses, and the largest open source community build software that advances humanity.",
        image: undefined,
      });

      const result = await getBlueskyLinkMetadata("https://github.com", {
        uploadBlob: uploadBlobMock,
      } as unknown as AtpAgent);

      expect(result).toStrictEqual({
        ...METADATA_MOCK,
        description:
          "Join the world's most widely adopted, AI-powered developer platform where millions of developers, businesses, and the largest open source community build software that advances humanity.",
        image: undefined,
        title:
          "GitHub · Build and ship software on a single, collaborative platform",
        url: "https://github.com/",
      });
    });
  });

  it("should return null if not data is found", async () => {
    fetchLinkMetadataMock.mockResolvedValue(null);

    const result = await getBlueskyLinkMetadata(
      "https://thisturldoesnotexist.example.com",
      {
        uploadBlob: uploadBlobMock,
      } as unknown as AtpAgent,
    );
    expect(result).toBeNull();
  });
});
