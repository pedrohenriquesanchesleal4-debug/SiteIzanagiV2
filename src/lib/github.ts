import { REPO_FULL_NAME } from "@/content/agents";

const API_BASE = `https://api.github.com/repos/${REPO_FULL_NAME}`;
const REVALIDATE_SECONDS = 3600;

export interface GithubRelease {
  id: number;
  name: string | null;
  tagName: string;
  publishedAt: string | null;
  htmlUrl: string;
  body: string | null;
}

export interface GithubCommit {
  sha: string;
  message: string;
  authorName: string;
  authorAvatar: string | null;
  date: string | null;
  htmlUrl: string;
}

async function githubFetch(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "izanagi-ai-site",
    },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export async function getReleases(limit = 6): Promise<GithubRelease[]> {
  const data = await githubFetch(`/releases?per_page=${limit}`);
  if (!Array.isArray(data)) return [];

  return data.map(
    (r: {
      id: number;
      name: string | null;
      tag_name: string;
      published_at: string | null;
      html_url: string;
      body: string | null;
    }) => ({
      id: r.id,
      name: r.name,
      tagName: r.tag_name,
      publishedAt: r.published_at,
      htmlUrl: r.html_url,
      body: r.body,
    })
  );
}

export async function getCommits(limit = 10): Promise<GithubCommit[]> {
  const data = await githubFetch(`/commits?per_page=${limit}`);
  if (!Array.isArray(data)) return [];

  return data.map(
    (c: {
      sha: string;
      commit: { message: string; author: { name: string; date: string } | null };
      author: { avatar_url: string } | null;
      html_url: string;
    }) => ({
      sha: c.sha.slice(0, 7),
      message: c.commit.message.split("\n")[0],
      authorName: c.commit.author?.name ?? "unknown",
      authorAvatar: c.author?.avatar_url ?? null,
      date: c.commit.author?.date ?? null,
      htmlUrl: c.html_url,
    })
  );
}
