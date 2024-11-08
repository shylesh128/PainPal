export class TweetService {
  constructor(fetchTweets, addPost) {
    this.fetchTweets = fetchTweets;
    this.addPost = addPost;
  }

  async fetchTweets(page) {
    return await this.fetchTweets(page);
  }

  async addPost(post) {
    return await this.addPost(post);
  }
}
