import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { queryKeys } from "../api/queryClient";
import { useTweetStore } from "../stores/tweetStore";

/**
 * Hook to fetch tweets with pagination
 */
export const useTweets = (page = 1) => {
  const setTweets = useTweetStore((state) => state.setTweets);

  return useQuery({
    queryKey: queryKeys.tweets.list(page),
    queryFn: async () => {
      const response = await api.get(`/tweets?page=${page}`);
      const tweets = response.data.data.tweets;
      if (page === 1) {
        setTweets(tweets);
      }
      return tweets;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Hook to fetch tweets with infinite scrolling
 */
export const useInfiniteTweets = () => {
  const setTweets = useTweetStore((state) => state.setTweets);

  return useInfiniteQuery({
    queryKey: queryKeys.tweets.infinite(),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get(`/tweets?page=${pageParam}`);
      return {
        tweets: response.data.data.tweets,
        nextPage: response.data.data.tweets.length > 0 ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 1 * 60 * 1000,
    onSuccess: (data) => {
      // Flatten all pages into a single array
      const allTweets = data.pages.flatMap((page) => page.tweets);
      setTweets(allTweets);
    },
  });
};

/**
 * Hook to create a new tweet
 */
export const useCreateTweet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      const response = await api.post("/tweets", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data.tweet;
    },
    onSuccess: (newTweet) => {
      // Optimistically add to cache
      queryClient.setQueryData(queryKeys.tweets.list(1), (old) => {
        if (old) {
          return [newTweet, ...old];
        }
        return [newTweet];
      });

      // Invalidate to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.tweets.all });
    },
  });
};

/**
 * Hook to like/unlike a tweet with optimistic updates
 */
export const useLikeTweet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tweetId) => {
      const response = await api.post(`/tweets/${tweetId}/like`);
      return response.data.data.tweet;
    },
    onMutate: async (tweetId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tweets.all });

      // Snapshot previous value
      const previousTweets = queryClient.getQueryData(queryKeys.tweets.list(1));

      // Optimistically update
      queryClient.setQueryData(queryKeys.tweets.list(1), (old) => {
        if (!old) return old;
        return old.map((tweet) =>
          tweet._id === tweetId
            ? { ...tweet, likesCount: (tweet.likesCount || 0) + 1 }
            : tweet
        );
      });

      return { previousTweets };
    },
    onError: (err, tweetId, context) => {
      // Rollback on error
      if (context?.previousTweets) {
        queryClient.setQueryData(queryKeys.tweets.list(1), context.previousTweets);
      }
    },
    onSettled: () => {
      // Invalidate to sync with server
      queryClient.invalidateQueries({ queryKey: queryKeys.tweets.all });
    },
  });
};

export default {
  useTweets,
  useInfiniteTweets,
  useCreateTweet,
  useLikeTweet,
};

