#!/usr/bin/env bash
# ~/.claude/statusline.sh — Claude Code session status line (aesthetic edition)
#
# 三行輸出：
#   第一行：◆ 模型 │ 漸層進度條 百分比 │ 費用 │ 時間 │ 速率限制
#   第二行：⎇分支* │ +增/-減 │ 目錄
#   第三行：❯ 提示符（顏色跟上下文用量連動）
#
# 環境變數：
#   CLAUDE_STATUSLINE_ASCII=1     退回純 ASCII
#   CLAUDE_STATUSLINE_NERDFONT=1  啟用 Nerd Font 圖示
#   CLAUDE_STATUSLINE_POWERLINE=1 啟用 Powerline 分隔符（預設跟隨 NERDFONT）
#   COLORTERM=truecolor|24bit     系統自動設定，啟用真彩色漸層

set -euo pipefail

# ═══════════════════════════════════════════════════════════════
# 環境偵測
# ═══════════════════════════════════════════════════════════════

USE_ASCII="${CLAUDE_STATUSLINE_ASCII:-0}"
USE_NERDFONT="${CLAUDE_STATUSLINE_NERDFONT:-0}"
USE_POWERLINE="${CLAUDE_STATUSLINE_POWERLINE:-$USE_NERDFONT}"
USE_TRUECOLOR=0
if [[ "${COLORTERM:-}" == "truecolor" || "${COLORTERM:-}" == "24bit" ]]; then
  USE_TRUECOLOR=1
fi

# ═══════════════════════════════════════════════════════════════
# 色彩與符號
# ═══════════════════════════════════════════════════════════════

RST='\033[0m'
CYAN='\033[36m'
BLUE='\033[34m'
GRAY='\033[90m'
DIM='\033[2m'
YELLOW='\033[33m'
GREEN='\033[32m'
RED='\033[31m'
MAGENTA='\033[35m'

# Anthropic 品牌紫 (#7266EA)
if (( USE_TRUECOLOR )); then
  PURPLE='\033[38;2;114;102;234m'
else
  PURPLE='\033[35m'
fi

# 符號集
if [[ "$USE_ASCII" == "1" ]]; then
  S_BRAND="<>"
  S_BRANCH=">"
  S_WARN="!"
  S_PROMPT=">"
  S_TIME=""
  S_COST=""
  SEP=" | "
elif [[ "$USE_NERDFONT" == "1" ]]; then
  S_BRAND="◆"
  S_BRANCH=" "
  S_WARN=" 󰀦"
  S_PROMPT="❯"
  S_TIME="󰔟 "
  S_COST=" "
  if [[ "$USE_POWERLINE" == "1" ]]; then
    SEP="  "
  else
    SEP=" │ "
  fi
else
  S_BRAND="◆"
  S_BRANCH="⎇"
  S_WARN=" ⚠"
  S_PROMPT="❯"
  S_TIME=""
  S_COST=""
  if [[ "$USE_POWERLINE" == "1" ]]; then
    SEP="  "
  else
    SEP=" │ "
  fi
fi

# ═══════════════════════════════════════════════════════════════
# 降級輸出
# ═══════════════════════════════════════════════════════════════

fallback_prompt() {
  printf '%b' "${GRAY}${1:-─}${RST}"
  exit 0
}

command -v jq &>/dev/null || fallback_prompt "─ │ jq not found"

# ═══════════════════════════════════════════════════════════════
# 讀取 JSON（單次 jq）
# ═══════════════════════════════════════════════════════════════

input=$(cat)

parsed=$(echo "$input" | jq -r '
  (.model.display_name // ""),
  (.context_window.used_percentage // 0 | tostring),
  (.cost.total_cost_usd // 0 | tostring),
  (.workspace.current_dir // "." | split("/") | last),
  (.worktree.branch // ""),
  (.rate_limits.five_hour.used_percentage // -1 | tostring),
  (.rate_limits.seven_day.used_percentage // -1 | tostring),
  (.agent.name // ""),
  (.workspace.current_dir // "."),
  (.cost.total_lines_added // 0 | tostring),
  (.cost.total_lines_removed // 0 | tostring),
  (.cost.total_duration_ms // 0 | tostring),
  (.context_window.context_window_size // 0 | tostring),
  (.worktree.name // ""),
  "END"
' 2>/dev/null) || fallback_prompt "─ │ parse error"

{
  IFS= read -r model_name
  IFS= read -r ctx_pct
  IFS= read -r cost
  IFS= read -r dir
  IFS= read -r branch
  IFS= read -r rate5h
  IFS= read -r rate7d
  IFS= read -r agent_name
  IFS= read -r cwd_full
  IFS= read -r lines_add
  IFS= read -r lines_rm
  IFS= read -r duration_ms
  IFS= read -r ctx_size
  IFS= read -r wt_name
  IFS= read -r _sentinel
} <<< "$parsed"

# ═══════════════════════════════════════════════════════════════
# 模型
# ═══════════════════════════════════════════════════════════════

model="${model_name:-─}"

# ═══════════════════════════════════════════════════════════════
# 啟動成本快照（Boot Cost Snapshot）
# ═══════════════════════════════════════════════════════════════

BOOT_CACHE="/tmp/claude-statusline-boot"

pct_int=${ctx_pct%.*}
pct_int=${pct_int:-0}
if (( pct_int < 0 )); then pct_int=0; fi
if (( pct_int > 100 )); then pct_int=100; fi

# 第一次執行時鎖定啟動成本
boot_pct=0
if [[ ! -f "$BOOT_CACHE" ]]; then
  echo "$pct_int" > "$BOOT_CACHE"
  boot_pct=$pct_int
else
  boot_pct=$(cat "$BOOT_CACHE" 2>/dev/null)
  boot_pct=${boot_pct:-0}
fi

# ═══════════════════════════════════════════════════════════════
# 上下文進度條（含啟動成本分色）
# ═══════════════════════════════════════════════════════════════

bar_filled=$(( pct_int / 10 ))
if (( bar_filled > 10 )); then bar_filled=10; fi

boot_filled=$(( boot_pct / 10 ))
if (( boot_filled > 10 )); then boot_filled=10; fi

# 漸層色（真彩色）：綠 → 黃 → 橘 → 紅
GRAD_R=(46 116 186 241 239 236 233 231 211 192)
GRAD_G=(204 195 186 196 161 126 101 76 66 57)
GRAD_B=(113 89 64 15 24 34 44 60 50 43)

# 進度條三態：boot(暗灰█) → chat(漸層█) → 空(暗灰░)
bar=""
if [[ "$USE_ASCII" == "1" ]]; then
  for (( i=0; i<10; i++ )); do
    if (( i < boot_filled )); then bar+="="
    elif (( i < bar_filled )); then bar+="#"
    else bar+="-"; fi
  done
elif (( USE_TRUECOLOR )); then
  for (( i=0; i<10; i++ )); do
    if (( i < boot_filled )); then
      # boot 區：暗灰實心，表示「已被吃掉，回不來」
      bar+="\\033[38;2;80;80;80m█"
    elif (( i < bar_filled )); then
      # chat 區：原版漸層色
      bar+="\\033[38;2;${GRAD_R[$i]};${GRAD_G[$i]};${GRAD_B[$i]}m█"
    else
      # 空區：暗灰空心
      bar+="\\033[38;2;60;60;60m░"
    fi
  done
  bar+="${RST}"
else
  if (( pct_int >= 90 )); then bar_color="$RED"
  elif (( pct_int >= 70 )); then bar_color="$YELLOW"
  else bar_color="$GREEN"; fi

  for (( i=0; i<10; i++ )); do
    if (( i < boot_filled )); then bar+="${GRAY}█${RST}"
    elif (( i < bar_filled )); then bar+="${bar_color}█${RST}"
    else bar+="░"; fi
  done
fi

# boot 標籤（灰色小字，持續提醒）
boot_label=""
if (( boot_pct > 0 )); then
  boot_label=" ${GRAY}(boot ${boot_pct}%)${RST}"
fi

# 百分比文字顏色（跟進度條整體色一致）
if (( pct_int >= 90 )); then pct_color="$RED"
elif (( pct_int >= 70 )); then pct_color="$YELLOW"
else pct_color="$GREEN"; fi

# 警告符號
ctx_warn=""
if (( pct_int >= 90 )); then ctx_warn="${RED}${S_WARN}${RST}"; fi

# 上下文視窗大小（僅在 model display_name 不包含 context 資訊時才顯示）
ctx_size_int=${ctx_size:-0}
ctx_label=""
if [[ "$model" != *context* && "$model" != *Context* ]]; then
  if (( ctx_size_int >= 1000000 )); then ctx_label=" ${GRAY}1M${RST}"
  elif (( ctx_size_int >= 200000 )); then ctx_label=" ${GRAY}200k${RST}"
  fi
fi

# ═══════════════════════════════════════════════════════════════
# 費用
# ═══════════════════════════════════════════════════════════════

cost_val="${cost:-0}"
cost_fmt=$(printf '%.2f' "$cost_val" 2>/dev/null || echo "0.00")
cost_int=${cost_val%.*}
cost_int=${cost_int:-0}

if (( cost_int >= 10 )); then cost_color="$RED"
elif (( cost_int >= 5 )); then cost_color="$YELLOW"
elif [[ "$cost_fmt" == "0.00" ]]; then cost_color="$GRAY"
else cost_color="$YELLOW"; fi

# ═══════════════════════════════════════════════════════════════
# 經過時間（零值智慧隱藏）
# ═══════════════════════════════════════════════════════════════

dur_ms=${duration_ms:-0}
dur_section=""
if (( dur_ms > 0 )); then
  dur_sec=$((dur_ms / 1000))
  dur_min=$((dur_sec / 60))
  dur_s=$((dur_sec % 60))
  # 格式化後仍為 0m0s 就不顯示（session 啟動初期 dur_ms 可能是幾百毫秒）
  if (( dur_min > 0 || dur_s > 0 )); then
    dur_section="${SEP}${GRAY}${S_TIME}${dur_min}m${dur_s}s${RST}"
  fi
fi

# ═══════════════════════════════════════════════════════════════
# Git 分支與髒標記（帶快取）
# ═══════════════════════════════════════════════════════════════

GIT_CACHE="/tmp/claude-statusline-git-cache"
GIT_CACHE_MAX_AGE=5

git_branch="${branch:-}"
dirty=""

git_cache_is_stale() {
  [[ ! -f "$GIT_CACHE" ]] && return 0
  local cache_age=$(( $(date +%s) - $(stat -f %m "$GIT_CACHE" 2>/dev/null || echo 0) ))
  (( cache_age > GIT_CACHE_MAX_AGE ))
}

if [[ -n "${cwd_full:-}" && -d "${cwd_full:-}" ]]; then
  if git_cache_is_stale; then
    if git -C "$cwd_full" rev-parse --git-dir &>/dev/null; then
      cached_branch="${git_branch}"
      if [[ -z "$cached_branch" ]]; then
        cached_branch=$(git -C "$cwd_full" -c core.useBuiltinFSMonitor=false branch --show-current 2>/dev/null) || true
        if [[ -z "$cached_branch" ]]; then
          cached_branch=$(git -C "$cwd_full" rev-parse --short HEAD 2>/dev/null) || true
        fi
      fi
      cached_dirty=""
      if ! git -C "$cwd_full" -c core.useBuiltinFSMonitor=false diff --quiet 2>/dev/null || \
         ! git -C "$cwd_full" -c core.useBuiltinFSMonitor=false diff --cached --quiet 2>/dev/null; then
        cached_dirty="*"
      fi
      echo "${cached_branch}|${cached_dirty}" > "$GIT_CACHE"
    else
      echo "|" > "$GIT_CACHE"
    fi
  fi

  if [[ -f "$GIT_CACHE" ]]; then
    IFS='|' read -r cached_br cached_dt < "$GIT_CACHE"
    if [[ -z "$git_branch" ]]; then git_branch="${cached_br}"; fi
    dirty="${cached_dt}"
  fi
fi

# ═══════════════════════════════════════════════════════════════
# 行數增減（零值智慧隱藏）
# ═══════════════════════════════════════════════════════════════

lines_add=${lines_add:-0}
lines_rm=${lines_rm:-0}
lines_section=""
if (( lines_add > 0 || lines_rm > 0 )); then
  lines_section="${GREEN}+${lines_add}${RST}/${RED}-${lines_rm}${RST}"
fi

# ═══════════════════════════════════════════════════════════════
# 速率限制（條件顯示）
# ═══════════════════════════════════════════════════════════════

rate_section=""
rate5h_int=${rate5h%.*}; rate5h_int=${rate5h_int:-0}
rate7d_int=${rate7d%.*}; rate7d_int=${rate7d_int:-0}

rate_parts=""
if (( rate5h_int >= 0 )); then
  if (( rate5h_int >= 80 )); then rate_parts+="${RED}5h:${rate5h_int}%${RST}"
  else rate_parts+="${GRAY}5h:${rate5h_int}%${RST}"; fi
fi
if (( rate7d_int >= 0 )); then
  if [[ -n "$rate_parts" ]]; then rate_parts+=" "; fi
  if (( rate7d_int >= 80 )); then rate_parts+="${RED}7d:${rate7d_int}%${RST}"
  else rate_parts+="${GRAY}7d:${rate7d_int}%${RST}"; fi
fi
if [[ -n "$rate_parts" ]]; then
  rate_section="${SEP}${rate_parts}"
fi

# ═══════════════════════════════════════════════════════════════
# 動態提示符（顏色跟上下文用量連動）
# ═══════════════════════════════════════════════════════════════

if (( pct_int >= 90 )); then prompt_color="$RED"
elif (( pct_int >= 70 )); then prompt_color="$YELLOW"
else prompt_color="$GREEN"; fi

# ═══════════════════════════════════════════════════════════════
# 組裝第一行
# ═══════════════════════════════════════════════════════════════

line1="${PURPLE}${S_BRAND}${RST} ${CYAN}${model}${RST}"
line1+="${SEP}${bar} ${pct_color}${pct_int}%${RST}${boot_label}${ctx_warn}${ctx_label}"
line1+="${SEP}${cost_color}${S_COST}\$${cost_fmt}${RST}"
line1+="${dur_section}"
line1+="${rate_section}"

# ═══════════════════════════════════════════════════════════════
# 組裝第二行
# ═══════════════════════════════════════════════════════════════

parts=()
if [[ -n "$git_branch" ]]; then
  parts+=("${GRAY}${S_BRANCH}${git_branch}${dirty}${RST}")
fi
if [[ -n "$lines_section" ]]; then
  parts+=("${lines_section}")
fi
parts+=("${BLUE}${dir}${RST}")

# Agent / Worktree 指示器（僅在非主 session 時顯示）
if [[ -n "${wt_name:-}" ]]; then
  parts+=("${YELLOW}⚙ worktree:${wt_name}${RST}")
elif [[ -n "${agent_name:-}" ]]; then
  parts+=("${YELLOW}⚙ ${agent_name}${RST}")
fi

line2=""
for i in "${!parts[@]}"; do
  if (( i > 0 )); then
    line2+="${SEP}"
  fi
  line2+="${parts[$i]}"
done

# ═══════════════════════════════════════════════════════════════
# 輸出
# ═══════════════════════════════════════════════════════════════

# 只輸出兩行（Claude Code 有自己的輸入提示符，不需要我們的 ❯）
printf '%b\n%b' "$line1" "$line2"
