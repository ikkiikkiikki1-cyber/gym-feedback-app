import nodemailer from 'nodemailer'

const STORE_EMAILS = {
  'Anchor Life Fitness 貴生川店': 'anchorlifefitness2024@gmail.com',
  'Muscle Quality 草津店': 'ikki.oshima@muscle-quality.com',
  'Muscle Quality 大津店': 'ikki.oshima@muscle-quality.com',
}

export async function POST(request) {
  try {
    const { storeName, customerName, html } = await request.json()

    const toEmail = STORE_EMAILS[storeName]
    if (!toEmail) {
      return Response.json({ error: '送信先が見つかりません' }, { status: 400 })
    }

    // シートのURLを生成
    const encoded = btoa(encodeURIComponent(html))
    const sheetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://gym-feedback-app.vercel.app'}/sheet?data=${encoded}`

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    })

    await transporter.sendMail({
      from: `フィードバックシート <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: `【${storeName}】${customerName}様 フィードバックシート`,
      html: `
        <div style="font-family:'Hiragino Sans','Yu Gothic',sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <div style="background:#1E2D2B;padding:16px 24px;border-bottom:3px solid #D4892A;border-radius:8px 8px 0 0;">
            <p style="color:#A8D5CE;margin:0;font-size:14px;text-align:center;">${storeName}　｜　プロトレーナー フィードバックシート</p>
          </div>
          <div style="background:#f9f9f9;padding:24px;border:1px solid #e0e0e0;">
            <h2 style="color:#1E2D2B;font-size:18px;margin-bottom:8px;">${customerName}様のフィードバックシートが届きました</h2>
            <p style="color:#6B7B79;font-size:14px;line-height:1.7;">下のボタンをクリックするとシートが開きます。そのまま印刷ボタンを押してください。</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${sheetUrl}" style="background:#1A7A6E;color:white;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;">
                📄 シートを開いて印刷する
              </a>
            </div>
            <p style="color:#A8D5CE;font-size:12px;text-align:center;margin-top:16px;">※このリンクはシートの内容が含まれています</p>
          </div>
        </div>
      `,
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'メール送信に失敗しました: ' + error.message }, { status: 500 })
  }
}
