import { Tweet } from "@the-convocation/twitter-scraper";

import { TWITTER_HANDLE } from "../../constants";

export const keepSelfReplies = async (tweet: Tweet) => {
  if (tweet.inReplyToStatus) {
    return tweet.inReplyToStatus.username === TWITTER_HANDLE;
  }

  // A missing parent does not make a reply an original post. Only keep
  // replies when the parent above confirms they are to our own account.
  return !tweet.isReply && !tweet.inReplyToStatusId;
};
