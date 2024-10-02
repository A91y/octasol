import axios from "axios";
import { GRAPHQL_STATS_QUERY } from "./githubQueries";
import { getUserByAuthHeader } from "@/lib/apiUtils";
import { setGithubDevProfile } from "./dbUtils";

export async function getRepos(page: number, authHeader: string) {
  const url = `https://api.github.com/user/repos?per_page=100&page=${page}&affiliation=owner`;
  const res = await axios.get(url, {
    headers: {
      Authorization: `${authHeader}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  return res.data;
}

export async function getTotalCommits(username: string, authHeader: string) {
  const url = `https://api.github.com/search/commits?q=author:${username}`;
  const res = await axios.get(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `${authHeader}`,
      Accept: "application/vnd.github.cloak-preview",
    },
  });
  return res.data.total_count;
}

export async function getGithubGraphql(login: string, authHeader: string) {
  try {
    const res = await axios({
      url: "https://api.github.com/graphql",
      method: "post",
      headers: {
        Authorization: `${authHeader}`,
        Accept: "application/vnd.github.v3+json",
      },
      data: {
        query: GRAPHQL_STATS_QUERY,
        variables: {
          login: login,
          includeMergedPullRequests: true,
          includeDiscussions: true,
          includeDiscussionsAnswers: true,
        },
      },
    });
    return res.data.data;
  } catch (error: any) {
    console.error("Error fetching GitHub GraphQL data:", error.message);
    throw new Error("Failed to fetch GitHub GraphQL data");
  }
}

export const updateGithubProfile = async (accessToken: string) => {
  let page = 1;
  let stars = 0;
  let forked_repos = 0;
  let original_repos = 0;
  let forks = 0;
  let next = true;
  while (next) {
    const repos = await getRepos(page, `Bearer ${accessToken}`);
    for (let repo of repos) {
      stars += repo.stargazers_count;
      if (repo.fork) {
        forked_repos++;
      } else {
        original_repos++;
      }
      forks += repo.forks_count;
    }
    page++;
    if (repos.length < 100) {
      next = false;
    }
  }

  const { login, id, followers } = await getUserByAuthHeader(
    `Bearer ${accessToken}`
  );

  const totalCommits = await getTotalCommits(login, `Bearer ${accessToken}`);
  const { user } = await getGithubGraphql(login, `Bearer ${accessToken}`);

  const repositoriesContributedTo = user.repositoriesContributedTo.totalCount;
  const pullRequests = user.pullRequests.totalCount;
  const mergedPullRequests = user.mergedPullRequests.totalCount;
  const totalIssues = user.openIssues.totalCount + user.closedIssues.totalCount;

  await setGithubDevProfile(id, {
    stars: stars,
    forkedRepos: forked_repos,
    originalRepos: original_repos,
    forks: forks,
    followers: followers,
    totalCommits: totalCommits,
    repositoriesContributedTo: repositoriesContributedTo,
    pullRequests: pullRequests,
    mergedPullRequests: mergedPullRequests,
    totalIssues: totalIssues,
  });
};