import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "一人公司热点漫画短视频工作台",
  description: "每日热点、社会科学理论共创、漫画短视频和四平台发布包。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
