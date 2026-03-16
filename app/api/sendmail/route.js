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
      html: html,
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'メール送信に失敗しました: ' + error.message }, { status: 500 })
  }
}
