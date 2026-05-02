import { GrowthMetric, GrowthSummary } from "./types";

export function summarizeGrowth(metrics: GrowthMetric[]): GrowthSummary {
  const totalViews = metrics.reduce((sum, item) => sum + item.views, 0);
  const avgCompletion = Math.round(metrics.reduce((sum, item) => sum + item.completionRate, 0) / metrics.length);
  const totalSaves = metrics.reduce((sum, item) => sum + item.saves, 0);
  const totalComments = metrics.reduce((sum, item) => sum + item.comments, 0);
  const commentRate = Number(((totalComments / Math.max(totalViews, 1)) * 100).toFixed(2));
  const keywords = metrics.flatMap((item) => item.commentKeywords);
  const topKeywords = Array.from(new Set(keywords)).slice(0, 6);

  return {
    totalViews,
    avgCompletion,
    totalSaves,
    commentRate,
    topKeywords,
    insights: [
      {
        signal: avgCompletion >= 60 ? "完播表现稳定" : "前半段流失偏高",
        nextMove: avgCompletion >= 60 ? "保留解释深度，把金句提前到第 5 格。" : "缩短理论铺垫，把冲突画面提前到第 1 格。",
        priority: "high"
      },
      {
        signal: totalSaves > totalComments * 4 ? "高收藏低评论" : "评论意愿不错",
        nextMove: totalSaves > totalComments * 4 ? "下一条加强二选一提问，制造温和表达欲。" : "保留评论区问题，但降低对立感。",
        priority: "medium"
      },
      {
        signal: `高频关键词：${topKeywords.slice(0, 3).join("、")}`,
        nextMove: "下一批选题优先围绕这些情绪词做系列化。",
        priority: "low"
      }
    ]
  };
}
