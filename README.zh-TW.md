<p align="center">
  <img src="docs/images/cover.jpeg" alt="claude-code-statusline" width="100%">
</p>

# ◆ claude-code-statusline

[English](README.md) | **繁體中文**

為 [Claude Code](https://docs.anthropic.com/en/docs/claude-code)（Anthropic 的 CLI 工具）打造的即時狀態列——把空白的底部變成一目了然的 session 儀表板。

模型名稱、上下文用量漸層進度條、花費、經過時間、Git 分支、速率限制……所有你在寫程式時需要用餘光掃到的資訊。

## 預覽

**正常狀態** — 上下文 42%，一切正常

![正常](docs/images/normal.svg)

**警告狀態** — 上下文 75%，該留意了

![警告](docs/images/warning.svg)

**危險狀態** — 上下文 92%，快爆了

![危險](docs/images/danger.svg)

**Session 剛啟動** — 乾乾淨淨，零噪音

![啟動](docs/images/startup.svg)

## 功能

| 功能 | 說明 |
|------|------|
| **漸層進度條** | 真彩色（24-bit）漸層，從綠到黃到紅。不支援時自動退回 ANSI 256 色或 ASCII。 |
| **智慧隱藏** | 零值（`+0/-0`、`0m0s`、速率限制）自動隱藏。`$0.00` 保留但用暗灰色。 |
| **費用動態變色** | 預設黃色，超過 $5 變黃色警告，超過 $10 變紅色。 |
| **Git 分支 + 髒標記** | 顯示分支名，有未提交變更時加 `*`。快取 5 秒，不拖慢速度。 |
| **速率限制** | 5 小時和 7 天用量（僅 Claude Pro/Max）。超過 80% 變紅色。 |
| **Agent / Worktree 指示器** | `⚙ code-reviewer` 或 `⚙ worktree:my-feature`——僅在啟用時顯示。 |
| **上下文視窗大小** | 顯示 `1M` 或 `200k`，但如果模型名稱已包含此資訊則不重複。 |
| **品牌識別** | `◆` 菱形，用 Anthropic 品牌紫 (#7266EA) 上色。 |
| **三層渲染退回** | 真彩色 → ANSI → ASCII。任何終端機都能用。 |
| **Nerd Font 支援** | 選配：``, `󰔟`, `` 圖示。設定 `CLAUDE_STATUSLINE_NERDFONT=1`。 |
| **Powerline 分隔符** | 選配：`` 箭頭。設定 `CLAUDE_STATUSLINE_POWERLINE=1`。 |
| **啟動成本指示器** | 顯示你的啟動配置（CLAUDE.md、rules、memory、skills）吃掉多少上下文——在你開口問之前就已經消耗的量。進度條分色：暗灰（啟動）vs 漸層（對話）。 |
| **< 50ms** | 單次 `jq` 呼叫 + Git 快取。無感延遲。 |

## 安裝

### 前置條件

- 已安裝 [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- `jq` — 用 `brew install jq`（macOS）或 `apt install jq`（Linux）安裝

### 快速安裝

```bash
git clone https://github.com/kcchien/claude-code-statusline.git
cd claude-code-statusline
./install.sh
```

### 手動安裝

```bash
# 1. 複製腳本
cp statusline.sh ~/.claude/statusline.sh
chmod +x ~/.claude/statusline.sh

# 2. 編輯 ~/.claude/settings.json，加入：
```

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh",
    "timeout": 10
  }
}
```

重啟 Claude Code 即可。狀態列會在第一次互動後出現。

## 設定

所有設定透過環境變數控制。加到 `~/.zshrc` 或 `~/.bashrc`：

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `CLAUDE_STATUSLINE_ASCII` | `0` | 設為 `1` 啟用純 ASCII 模式（無 Unicode） |
| `CLAUDE_STATUSLINE_NERDFONT` | `0` | 設為 `1` 啟用 [Nerd Font](https://www.nerdfonts.com/) 圖示 |
| `CLAUDE_STATUSLINE_POWERLINE` | 跟隨 NERDFONT | 設為 `1` 啟用 Powerline 箭頭分隔符 |
| `COLORTERM` | （系統自動） | `truecolor` 或 `24bit` 時啟用漸層進度條 |

```bash
# 範例：在 ~/.zshrc 中
export CLAUDE_STATUSLINE_NERDFONT=1  # 啟用 Nerd Font 圖示 + Powerline 箭頭
```

## 啟動成本指示器

大多數使用者不知道自己的啟動配置吃掉了多少上下文。一個大的 `CLAUDE.md`、很多 rules、memory 檔案和 skills，可以在你還沒開始工作之前就燒掉 10–30% 的上下文視窗。

這個 fork 加入了**啟動成本快照**：狀態列在 session 中第一次執行時，會記錄當下的上下文用量作為「啟動成本」。之後：

- **進度條**分為三個區域：暗灰（啟動）→ 漸層（對話）→ 空白
- 百分比旁邊會出現灰色的 **`(boot N%)`** 標籤

```
◆ Opus 4 │ ██████░░░░ 45% (boot 27%) 1M │ $1.20 │ 10m0s
           ^^          ^^^^
           啟動(暗灰)   對話(漸層)
```

啟動快照存在 `/tmp/claude-statusline-boot`，每次新 session 自動重置。

## 運作原理

Claude Code 的 `statusLine` 機制會在每次助理回覆後，把完整的 session 狀態打包成 JSON，透過 stdin 送給你指定的腳本。

本腳本的處理流程：

1. **單次 `jq` 呼叫**（~3ms）——一次解析全部 14 個欄位
2. **Git 快取**（命中 ~0ms，重整 ~40ms）——髒標記結果快取在 `/tmp/`，5 秒更新一次
3. **智慧組裝**——只有非零的區段才會出現在畫面上
4. **`printf '%b'`**——最終解釋 ANSI 跳脫碼，輸出彩色結果

端到端耗時：**< 50ms**。

### Claude Code 提供的 JSON 資料

狀態列接收的完整 JSON 欄位可參考[官方文件](https://code.claude.com/docs/en/statusline#available-data)，主要包含：

- `model.display_name` — 目前使用的模型
- `context_window.used_percentage` — 上下文用量（0-100）
- `cost.total_cost_usd` — 本次 session 累計花費
- `cost.total_duration_ms` — 經過時間
- `cost.total_lines_added/removed` — 程式碼變動行數
- `rate_limits.five_hour/seven_day.used_percentage` — 速率限制
- `worktree.branch/name` — Git 工作樹資訊
- `agent.name` — 子代理名稱

## 測試

執行測試腳本，可以看到所有顯示模式：

```bash
chmod +x examples/test-mock.sh
./examples/test-mock.sh          # 全部情境
./examples/test-mock.sh normal   # 只看正常狀態
./examples/test-mock.sh danger   # 只看危險狀態
./examples/test-mock.sh ascii    # ASCII 退回模式
```

## Bash 3.2 相容性

本腳本針對 macOS 預設的 bash 3.2 設計。幾個關鍵的設計決策：

- **進度條用查找表（lookup table）**——迴避不同 bash 版本對 UTF-8 字串截取（substring）的行為差異
- **逐行 `read`**——bash 3.2 的 `IFS` + `read` 會靜默合併連續的空分隔符號。改用每行一個值就能正確保留空欄位
- **jq 哨兵值**——bash 的 `$()` 命令替換會吃掉尾部所有換行符。如果最後一個欄位是空字串，就會被吞掉。加一個永不為空的 `"END"` 哨兵值可以防止這個問題

## 授權

MIT — 詳見 [LICENSE](LICENSE)。

## 致謝

使用 [Claude Code](https://claude.ai/claude-code)（Opus 4.6, 1M context）在一次 session 中完成。狀態列的設計是透過對話逐步迭代的——從功能原型到美學儀表板。

靈感來源：[官方 statusline 文件](https://code.claude.com/docs/en/statusline)以及社群專案 [ccstatusline](https://github.com/sirmalloc/ccstatusline) 和 [starship-claude](https://github.com/martinemde/starship-claude)。
