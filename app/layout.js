export const metadata = {
  title: 'フィードバックシート生成 | Anchor Life Fitness',
  description: '体組成データからフィードバックシートを自動生成',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
