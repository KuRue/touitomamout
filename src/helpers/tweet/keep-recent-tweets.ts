import { Tweet } from "@the-convocation/twitter-scraper";

import { SYNC_LOOKBACK_DAYS } from "../../constants";

/**
 * Filter results to only keep the most recent ones.
 * Helps when the API returns only the most popular tweets.
 */
export const keepRecentTweets = (tweet: Tweet) => {
  const publicationUTCDate = new Date(tweet.timestamp ?? 0);
  const currentUTCDate = new Date(new Date().toUTCString());
  const threshold = SYNC_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;

  return currentUTCDate.getTime() - publicationUTCDate.getTime() < threshold;
};
