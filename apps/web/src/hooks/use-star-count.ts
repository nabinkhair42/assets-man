"use client"

import { useEffect, useState } from "react"

export function useStarCount(repo: string) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetch(`https://api.github.com/repos/${repo}`)
      .then((res) => res.json())
      .then((data) => setCount(data.stargazers_count ?? 0))
      .catch(() => setCount(0))
  }, [repo])

  return count
}
