import { GoogleGenerativeAI } from '@google/generative-ai'

export const maxDuration = 60

// --- 1日の利用回数制限 ---
const DAILY_LIMIT = 20
const usageStore = { date: '', count: 0 }

function checkAndIncrementUsage() {
  const today = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })
  if (usageStore.date !== today) {
    usageStore.date = today
    usageStore.count = 0
  }
  if (usageStore.count >= DAILY_LIMIT) return false
  usageStore.count++
  return true
}
// ---------------------------

export async function POST(request) {
  if (!checkAndIncrementUsage()) {
    return Response.json(
      { error: `本日の利用上限（${DAILY_LIMIT}回）に達しました。明日またお試しください。` },
      { status: 429 }
    )
  }

  try {
    const formData = await request.formData()
    const image = formData.get('image')
    const customerName = formData.get('customerName') || 'お客様'
    const storeName = formData.get('storeName') || 'Anchor Life Fitness 貴生川店'

    if (!image) {
      return Response.json({ error: '画像が必要です' }, { status: 400 })
    }

    const buffer = await image.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mediaType = image.type || 'image/jpeg'

    // Gemini API 呼び出し
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

    const prompt = `この体組成計（TANITA等）の測定結果画像からデータを読み取り、以下のJSON形式のみで返してください。読み取れない項目はnullにしてください。説明文や\`\`\`は一切不要です。

{
  "age": 数値,
  "gender": "男性" or "女性",
  "height": 数値(cm),
  "weight": 数値(kg),
  "bodyFatPct": 数値(%),
  "fatMass": 数値(kg),
  "muscleMass": 数値(kg),
  "leanMass": 数値(kg),
  "bmi": 数値,
  "bmr": 数値(kcal),
  "vfr": 数値(内臓脂肪レベル),
  "trunkMuscle": 数値(kg),
  "leftArm": 数値(kg),
  "rightArm": 数値(kg),
  "leftLeg": 数値(kg),
  "rightLeg": 数値(kg),
  "measureDate": "文字列(測定日)"
}`

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: mediaType, data: base64 } },
    ])

    let bodyData = {}
    try {
      const text = result.response.text().trim()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        bodyData = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      return Response.json({ error: 'データの読み取りに失敗しました。画像をもう一度確認してください。' }, { status: 500 })
    }

    // フィードバックHTML生成
    const gender = bodyData.gender || '男性'
    const bodyFat = bodyData.bodyFatPct || 0
    const isMale = gender === '男性'

    let fatComment = ''
    let goalFat = 0
    if (isMale) {
      if (bodyFat <= 18) { fatComment = '理想的な体組成です。この状態を維持しながら、さらなる引き締めを目指せます。'; goalFat = Math.max(12, bodyFat - 4) }
      else if (bodyFat <= 25) { fatComment = `体脂肪率は少し高め（${bodyFat}%）ですが、正しいアプローチで脂肪燃焼と筋肉維持を両立できます。`; goalFat = bodyFat - 5 }
      else { fatComment = `体脂肪率は標準より高め（${bodyFat}%）ですが、食事×マシンの組み合わせで体質改善が見込めます。焦らず着実に進めましょう。`; goalFat = bodyFat - 6 }
    } else {
      if (bodyFat <= 24) { fatComment = '理想的な体組成です。この状態を維持しながら引き締めへ向かいましょう。'; goalFat = Math.max(18, bodyFat - 4) }
      else if (bodyFat <= 30) { fatComment = `体脂肪率は少し高め（${bodyFat}%）ですが、正しいアプローチで美しいラインへ近づけます。`; goalFat = bodyFat - 5 }
      else if (bodyFat <= 40) { fatComment = `体脂肪率は標準より高め（${bodyFat}%）ですが、筋肉を守りながら脂肪だけを落とす戦略で確実に変われます。`; goalFat = bodyFat - 6 }
      else { fatComment = 'じっくり着実に。無理なく続けられるペースで体質から変えていきましょう。'; goalFat = bodyFat - 6 }
    }

    const goalFatRounded = Math.round(goalFat * 10) / 10
    const weightVal = bodyData.weight || 70
    const fatLoss = Math.round((weightVal * (bodyFat - goalFatRounded) / 100) * 10) / 10

    const trunkMuscle = bodyData.trunkMuscle || 0
    const legMuscle = (bodyData.leftLeg || 0) + (bodyData.rightLeg || 0)
    const trainings = []

    if (trunkMuscle > 0) {
      trainings.push({ name: 'チェストプレス', desc: '体幹部の筋肉を活かして大胸筋・三角筋を強化。脂肪燃焼のベースを高めます' })
      trainings.push({ name: 'ラットプルダウン', desc: '広背筋・僧帽筋を鍛え、代謝アップ効果の高い大きな筋群を刺激します' })
    }
    if (legMuscle > 0) {
      trainings.push({ name: 'レッグプレス', desc: '下半身の大筋群を鍛えて脂肪燃焼効率UP。関節への負担が少ないマシンです' })
      trainings.push({ name: 'レッグエクステンション', desc: '大腿四頭筋ピンポイント強化。脚の引き締めと膝周りの安定に直結します' })
    }
    trainings.push({ name: 'アブドミナル', desc: '内臓脂肪レベルの改善に直結する腹筋マシン。体幹強化にも効果的です' })

    const measureDate = bodyData.measureDate || new Date().toLocaleDateString('ja-JP')
    const vfr = bodyData.vfr

    const html = generateFeedbackHTML({
      customerName, storeName, bodyData, fatComment,
      goalFatRounded, fatLoss, trainings, measureDate, vfr, weightVal, isMale,
    })

    const remaining = DAILY_LIMIT - usageStore.count
    return Response.json({ html, bodyData, remaining, dailyLimit: DAILY_LIMIT })

  } catch (error) {
    console.error(error)
    return Response.json({ error: 'サーバーエラーが発生しました: ' + error.message }, { status: 500 })
  }
}

function generateFeedbackHTML({ customerName, storeName, bodyData, fatComment, goalFatRounded, fatLoss, trainings, measureDate, vfr, weightVal, isMale }) {
  const proteinMin = Math.round(weightVal * 1.6)
  const proteinMax = Math.round(weightVal * 2.0)

  const trainingRows = trainings.map((t, i) => `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f0faf9'}">
      <td style="padding:10px 14px;font-weight:600;color:#1A7A6E;font-size:13px;border-bottom:1px solid #A8D5CE;border-right:1px solid #A8D5CE;width:32%">${t.name}</td>
      <td style="padding:10px 14px;color:#1E2D2B;font-size:13px;border-bottom:1px solid #A8D5CE">${t.desc}</td>
    </tr>`).join('')

  const dataRows = [
    ['体重', bodyData.weight ? `${bodyData.weight} kg` : '---'],
    ['体脂肪率', bodyData.bodyFatPct ? `${bodyData.bodyFatPct} %　（標準：${isMale ? '11〜22' : '17〜27'}%）` : '---'],
    ['脂肪量', bodyData.fatMass ? `${bodyData.fatMass} kg` : '---'],
    ['筋肉量（全身）', bodyData.muscleMass ? `${bodyData.muscleMass} kg` : '---'],
    ['体幹部筋肉量', bodyData.trunkMuscle ? `${bodyData.trunkMuscle} kg` : '---'],
    ['下肢筋肉量（左/右）', (bodyData.leftLeg && bodyData.rightLeg) ? `${bodyData.leftLeg} kg / ${bodyData.rightLeg} kg` : '---'],
    ['BMI', bodyData.bmi ? `${bodyData.bmi}` : '---'],
    ['内臓脂肪レベル', vfr ? `${vfr}` : '---'],
    ['基礎代謝量（BMR）', bodyData.bmr ? `${bodyData.bmr} kcal / 日` : '---'],
  ].map((row, i) => `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f0faf9'}">
      <td style="padding:9px 14px;color:#6B7B79;font-size:13px;border-bottom:1px solid #A8D5CE;border-right:1px solid #A8D5CE;width:42%">${row[0]}</td>
      <td style="padding:9px 14px;font-weight:700;color:#1A7A6E;font-size:13px;border-bottom:1px solid #A8D5CE">${row[1]}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>フィードバックシート - ${customerName}様</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Noto Sans JP', 'Yu Gothic', sans-serif; background: #f4f4f0; }
  .page { width: 210mm; min-height: 297mm; margin: 0 auto; background: white; }
  @media print {
    body { background: white; }
    .page { width: 100%; box-shadow: none; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="no-print" style="background:#1A7A6E;color:white;padding:12px 20px;text-align:center;font-family:'Noto Sans JP',sans-serif;position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:center;gap:16px">
  <span style="font-size:14px">📄 フィードバックシートが生成されました</span>
  <button onclick="window.print()" style="background:#D4892A;color:white;border:none;padding:8px 20px;border-radius:6px;font-size:14px;cursor:pointer;font-family:inherit">🖨️ 印刷する</button>
</div>
<div class="page">
  <div style="background:#1E2D2B;padding:12px 24px;border-bottom:3px solid #D4892A">
    <p style="color:#A8D5CE;font-size:13px;text-align:center;letter-spacing:1px">${storeName}　｜　プロトレーナー フィードバックシート</p>
  </div>
  <div style="background:#1A7A6E;padding:28px 32px;text-align:center">
    <h1 style="color:white;font-size:28px;font-weight:700;margin-bottom:8px">プロトレーナーからのフィードバック</h1>
    <p style="color:#A8D5CE;font-size:15px">${customerName}様へ　〜脂肪だけ落として、理想の体を手に入れる〜</p>
  </div>
  <div style="padding:20px 24px">
    <p style="color:#1E2D2B;font-size:13px;line-height:1.8;margin-bottom:20px">　本日は体験にお越しいただき、誠にありがとうございます。体組成計で詳細な測定を行いました（測定日：${measureDate}）。あなたのデータをもとに、最短で結果が出る戦略をご提案します。</p>

    <div style="background:#1A7A6E;padding:10px 16px;border-left:5px solid #D4892A;margin-bottom:12px">
      <h2 style="color:white;font-size:16px;font-weight:700">📊 現状分析</h2>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:14px;border:1px solid #A8D5CE;overflow:hidden">${dataRows}</table>
    <div style="background:#E8F5F3;border-left:5px solid #1A7A6E;padding:12px 16px;margin-bottom:12px;border-radius:0 6px 6px 0">
      <p style="color:#1E2D2B;font-size:13px;line-height:1.7">${fatComment}</p>
    </div>
    <div style="background:#FEF6EA;border-left:5px solid #D4892A;padding:14px 18px;margin-bottom:20px;border-radius:0 6px 6px 0">
      <p style="color:#D4892A;font-weight:700;font-size:14px;margin-bottom:6px">最初のゴール設定</p>
      <p style="color:#1E2D2B;font-size:13px">体脂肪率　${bodyData.bodyFatPct || '--'}% → ${goalFatRounded}%（約 ${Math.abs((bodyData.bodyFatPct || 0) - goalFatRounded).toFixed(1)}% 減）　脂肪量 −${fatLoss} kg</p>
      <p style="color:#6B7B79;font-size:12px;margin-top:4px">目安期間：3〜4ヶ月（週2〜3回ペース）</p>
    </div>

    <div style="background:#1A7A6E;padding:10px 16px;border-left:5px solid #D4892A;margin-bottom:12px">
      <h2 style="color:white;font-size:16px;font-weight:700">🏋️ トレーニング戦略</h2>
    </div>
    <p style="color:#1E2D2B;font-size:13px;line-height:1.7;margin-bottom:12px">測定データをもとに、最も効率よく結果が出るマシンプログラムを組みました。</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;border:1px solid #A8D5CE;overflow:hidden">
      ${trainingRows}
      <tr style="background:#FEF6EA">
        <td style="padding:10px 14px;font-weight:700;color:#D4892A;font-size:13px;border-bottom:1px solid #D4892A;border-right:1px solid #D4892A">有酸素運動（20分）</td>
        <td style="padding:10px 14px;color:#1E2D2B;font-size:13px;border-bottom:1px solid #D4892A">黄金の仕上げ！トレーニング後に行うことで脂肪燃焼効率が2〜3倍UP。バイクまたはトレッドミルで最大心拍数の60〜70%を維持</td>
      </tr>
    </table>

    <div style="background:#1A7A6E;padding:10px 16px;border-left:5px solid #D4892A;margin-bottom:12px">
      <h2 style="color:white;font-size:16px;font-weight:700">🥗 食事アドバイス</h2>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;border:1px solid #A8D5CE;overflow:hidden">
      <tr>
        <td style="background:#1A7A6E;color:white;padding:10px 14px;font-weight:700;font-size:13px;border-bottom:1px solid #A8D5CE;border-right:1px solid #D4892A;width:22%;text-align:center">タンパク質</td>
        <td style="padding:10px 14px;color:#1E2D2B;font-size:13px;border-bottom:1px solid #A8D5CE">目標：体重×1.6〜2.0g = <strong>${proteinMin}〜${proteinMax}g/日</strong>　鶏胸肉・卵・豆腐・プロテインで確保。筋肉量を守りながら脂肪だけ落とす最重要栄養素。</td>
      </tr>
      <tr style="background:#f0faf9">
        <td style="background:#D4892A;color:white;padding:10px 14px;font-weight:700;font-size:13px;border-bottom:1px solid #A8D5CE;border-right:1px solid #D4892A;text-align:center">脂質見直し</td>
        <td style="padding:10px 14px;color:#1E2D2B;font-size:13px;border-bottom:1px solid #A8D5CE">揚げ物・マヨネーズ・菓子パンを週3回以下に。1食あたり脂質20g以下を目安に。${vfr ? `内臓脂肪レベル${vfr}は食事改善だけで2〜3ヶ月で標準圏内に入ります。` : '食事改善で内臓脂肪を効率よく落とせます。'}</td>
      </tr>
      <tr>
        <td style="background:#1A7A6E;color:white;padding:10px 14px;font-weight:700;font-size:13px;border-right:1px solid #D4892A;text-align:center">タイミング</td>
        <td style="padding:10px 14px;color:#1E2D2B;font-size:13px">トレーニング後30分以内にタンパク質+炭水化物を摂取。これで筋肉の回復速度が大幅UP。${bodyData.bmr ? `基礎代謝${bodyData.bmr}kcalを下回らない摂取カロリーを意識しましょう。` : ''}</td>
      </tr>
    </table>

    <div style="border:2px solid #D4892A;background:#FEF6EA;border-radius:8px;padding:18px 20px;margin-bottom:20px">
      <p style="color:#D4892A;font-weight:700;font-size:14px;margin-bottom:8px">トレーナーより</p>
      <p style="color:#1E2D2B;font-size:13px;line-height:1.8">本日の測定データを拝見し、確かな可能性を感じました。あとは「正しいアプローチ」をするだけで、必ず結果が出ます。一緒に頑張りましょう！まずは週2回から始めて、少しずつ体の変化を実感していただければと思います。</p>
    </div>

    <div style="border-top:1px solid #A8D5CE;padding-top:10px;text-align:center">
      <p style="color:#6B7B79;font-size:11px">${storeName}　｜　測定日：${measureDate}</p>
      <p style="color:#6B7B79;font-size:11px">ご不明な点はスタッフまでお気軽にお申し付けください</p>
    </div>
  </div>
</div>
</body>
</html>`
}
