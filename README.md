# ジム フィードバックシート生成アプリ

体組成計（TANITA等）の写真を撮るだけで、プロフェッショナルなフィードバックシートを自動生成するWebアプリです。
**完全無料**で運用できます。

---

## デプロイ手順（一度だけ）

### ステップ1：GitHubアカウントを作る
1. https://github.com を開く
2. 「Sign up」をクリック
3. メールアドレス・パスワード・ユーザー名を登録

### ステップ2：このファイルをGitHubにアップロード
1. GitHubにログイン後、右上「+」→「New repository」
2. Repository name: `gym-feedback-app`
3. 「Create repository」をクリック
4. 「uploading an existing file」をクリック
5. このフォルダの全ファイルをドラッグ＆ドロップ
6. 「Commit changes」をクリック

### ステップ3：Gemini APIキーを取得する（無料・カード登録不要）
1. https://aistudio.google.com を開く
2. Googleアカウント（Gmail）でログイン
3. 「Get API key」→「Create API key」
4. キーをコピー（`AIza...`で始まる文字列）
5. 月1,500回まで完全無料・クレジットカード登録不要

### ステップ4：Vercelにデプロイ
1. https://vercel.com を開く
2. 「Sign Up」→「Continue with GitHub」でGitHubアカウントと連携
3. 「Add New Project」→ `gym-feedback-app` を選択→「Import」
4. **Environment Variables** に以下を追加：
   - Name: `GEMINI_API_KEY`
   - Value: ステップ3でコピーしたキー（`AIza...`）
5. 「Deploy」をクリック
6. 数分後にURLが発行される（例: `https://gym-feedback-app-xxx.vercel.app`）

### ステップ5：スタッフに共有
発行されたURLをLINEで送るだけ。

---

## スタッフの使い方
1. スマホでURLを開く
2. 店舗を選ぶ
3. お客様名を入力
4. 体組成計を撮影またはギャラリーから選ぶ
5. 「生成する」をタップ（10〜20秒）
6. 印刷またはスクリーンショットで共有

---

## 費用まとめ
| サービス | 費用 |
|---|---|
| Vercel（ホスティング） | 完全無料 |
| Gemini API（AI） | 月1,500回まで無料（月5人なら余裕） |
| **合計** | **0円** |

---

## 技術構成
- フロントエンド: Next.js 14（React）
- ホスティング: Vercel（無料）
- AI: Google Gemini API（gemini-1.5-flash・無料枠）
- 1日20回の利用制限つき（安全装置）
