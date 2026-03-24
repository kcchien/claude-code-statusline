#!/usr/bin/env node
// slides.js — Generate project showcase PPTX
// Usage: node docs/slides.js

const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaTerminal, FaGithub, FaCheckCircle, FaBolt,
  FaEye, FaEyeSlash, FaPalette, FaCode, FaCog
} = require("react-icons/fa");

// ═══════════════════════════════════════════════════
// Color Palette — Terminal Dark + Anthropic Purple
// ═══════════════════════════════════════════════════

const C = {
  bg:       "13141F",  // deep dark
  bgCard:   "1C1D2E",  // card background
  purple:   "7266EA",  // Anthropic brand
  purpleL:  "9B8FFF",  // lighter purple
  green:    "2ECC71",  // progress bar green
  yellow:   "F1C40F",  // warning
  red:      "E74C3C",  // danger
  orange:   "EC7E22",  // mid gradient
  cyan:     "5BC0DE",  // model name
  blue:     "3498DB",  // directory
  white:    "FFFFFF",
  gray:     "8892A4",  // muted text
  grayDim:  "6B7280",  // muted but readable
  grayBg:   "252736",  // code block bg
};

const W = 20, H = 11.25; // Full HD

// ═══════════════════════════════════════════════════
// Icon helper
// ═══════════════════════════════════════════════════

function renderIconSvg(IconComponent, color, size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function iconPng(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, "#" + color, size);
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// ═══════════════════════════════════════════════════
// Shadow factory (avoid mutation pitfall)
// ═══════════════════════════════════════════════════

const mkShadow = () => ({
  type: "outer", color: "000000", blur: 10, offset: 3, angle: 135, opacity: 0.3
});

// ═══════════════════════════════════════════════════
// Slide helpers
// ═══════════════════════════════════════════════════

function addDarkBg(slide) {
  slide.background = { color: C.bg };
}

function addBrandMark(slide) {
  slide.addText("◆", {
    x: 0.6, y: 0.5, w: 0.6, h: 0.6,
    fontSize: 28, color: C.purple, fontFace: "Arial",
    align: "center", valign: "middle"
  });
}

function addSlideNumber(slide, num, total) {
  slide.addText(`${num} / ${total}`, {
    x: W - 2, y: H - 0.7, w: 1.5, h: 0.4,
    fontSize: 11, color: C.grayDim, fontFace: "Calibri",
    align: "right"
  });
}

function addCodeBlock(slide, lines, x, y, w, h) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h, fill: { color: C.grayBg },
    shadow: mkShadow()
  });
  slide.addText(lines, {
    x: x + 0.3, y: y + 0.2, w: w - 0.6, h: h - 0.4,
    fontFace: "Consolas", fontSize: 14, valign: "top", margin: 0
  });
}

// ═══════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════

const pres = new pptxgen();
pres.defineLayout({ name: "FHD", width: W, height: H });
pres.layout = "FHD";
pres.author = "KC Chien";
pres.title = "claude-code-statusline";

const TOTAL = 8;

async function build() {
  const iconTerminal = await iconPng(FaTerminal, C.purple);
  const iconGithub = await iconPng(FaGithub, C.white);
  const iconCheck = await iconPng(FaCheckCircle, C.green);
  const iconBolt = await iconPng(FaBolt, C.yellow);
  const iconEye = await iconPng(FaEye, C.cyan);
  const iconEyeSlash = await iconPng(FaEyeSlash, C.gray);
  const iconPalette = await iconPng(FaPalette, C.purpleL);
  const iconCode = await iconPng(FaCode, C.cyan);
  const iconCog = await iconPng(FaCog, C.gray);

  // ── Slide 1: Title ──
  {
    const s = pres.addSlide();
    addDarkBg(s);

    // Big diamond
    s.addText("◆", {
      x: W / 2 - 1, y: 1.8, w: 2, h: 2,
      fontSize: 96, color: C.purple, fontFace: "Arial",
      align: "center", valign: "middle"
    });

    s.addText("claude-code-statusline", {
      x: 2, y: 4.2, w: W - 4, h: 1.2,
      fontSize: 44, fontFace: "Consolas", color: C.white,
      bold: true, align: "center"
    });

    s.addText("A beautiful, information-dense status line for Claude Code", {
      x: 3, y: 5.5, w: W - 6, h: 0.8,
      fontSize: 20, fontFace: "Calibri", color: C.gray,
      align: "center"
    });

    // Gradient bar mockup
    const barColors = ["2ECC71","74C359","BABA40","F1C40F","EFA118","EC7E22","E9652C","E74C3C","D34232","C0392B"];
    const barY = 7, barH = 0.35, barW = 0.8;
    const barStartX = (W - barW * 10) / 2;
    for (let i = 0; i < 10; i++) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: barStartX + i * barW, y: barY, w: barW, h: barH,
        fill: { color: barColors[i] }
      });
    }

    s.addText("github.com/kcchien/claude-code-statusline", {
      x: 3, y: 8.5, w: W - 6, h: 0.6,
      fontSize: 16, fontFace: "Consolas", color: C.grayDim,
      align: "center"
    });

    addSlideNumber(s, 1, TOTAL);
  }

  // ── Slide 2: The Problem ──
  {
    const s = pres.addSlide();
    addDarkBg(s);
    addBrandMark(s);
    addSlideNumber(s, 2, TOTAL);

    s.addText("The Problem", {
      x: 1.5, y: 0.4, w: 10, h: 0.8,
      fontSize: 36, fontFace: "Calibri", color: C.white, bold: true
    });

    s.addText("Claude Code 預設的狀態列只顯示目錄名和 Git 分支。\n在長時間 session 中，你真正需要知道的是：", {
      x: 1.5, y: 1.5, w: 17, h: 1.2,
      fontSize: 18, fontFace: "Calibri", color: C.gray
    });

    // Before: boring status line
    s.addText("BEFORE", {
      x: 1.5, y: 3, w: 3, h: 0.5,
      fontSize: 14, fontFace: "Consolas", color: C.red, bold: true
    });

    s.addShape(pres.shapes.RECTANGLE, {
      x: 1.5, y: 3.5, w: 17, h: 1.2,
      fill: { color: C.grayBg }, shadow: mkShadow()
    });
    s.addText([
      { text: "my-project", options: { color: C.blue, fontFace: "Consolas", fontSize: 16 } },
      { text: " main*", options: { color: C.grayDim, fontFace: "Consolas", fontSize: 16 } }
    ], { x: 1.8, y: 3.7, w: 16, h: 0.8, margin: 0 });

    // Pain points
    const pains = [
      "上下文快用完了嗎？",
      "這個 session 花了多少錢？",
      "速率限制還夠嗎？",
      "我改了多少行程式碼？"
    ];
    for (let i = 0; i < pains.length; i++) {
      const py = 5.5 + i * 0.75;
      s.addText("?", {
        x: 1.5, y: py, w: 0.5, h: 0.5,
        fontSize: 20, fontFace: "Calibri", color: C.red, bold: true,
        align: "center", valign: "middle"
      });
      s.addText(pains[i], {
        x: 2.2, y: py, w: 15, h: 0.5,
        fontSize: 18, fontFace: "Calibri", color: C.white, valign: "middle"
      });
    }
  }

  // ── Slide 3: The Solution — Before / After ──
  {
    const s = pres.addSlide();
    addDarkBg(s);
    addBrandMark(s);
    addSlideNumber(s, 3, TOTAL);

    s.addText("The Solution", {
      x: 1.5, y: 0.4, w: 10, h: 0.8,
      fontSize: 36, fontFace: "Calibri", color: C.white, bold: true
    });

    s.addText("三種狀態，一目了然", {
      x: 1.5, y: 1.3, w: 17, h: 0.5,
      fontSize: 18, fontFace: "Calibri", color: C.gray
    });

    // Normal state
    s.addShape(pres.shapes.RECTANGLE, {
      x: 1.5, y: 2.1, w: 17, h: 2.2,
      fill: { color: C.grayBg }, shadow: mkShadow()
    });
    s.addText("Normal — 42%", {
      x: 1.8, y: 2.2, w: 5, h: 0.4,
      fontSize: 11, fontFace: "Consolas", color: C.green, italic: true
    });
    s.addText([
      { text: "◆ ", options: { color: C.purple } },
      { text: "Claude Opus 4.6", options: { color: C.cyan } },
      { text: " │ ", options: { color: C.grayDim } },
      { text: "████", options: { color: C.green } },
      { text: "░░░░░░", options: { color: C.grayDim } },
      { text: " 42%", options: { color: C.green } },
      { text: " │ ", options: { color: C.grayDim } },
      { text: "$0.85", options: { color: C.yellow } },
      { text: " │ ", options: { color: C.grayDim } },
      { text: "3m42s", options: { color: C.gray } },
      { text: " │ ", options: { color: C.grayDim } },
      { text: "5h:15%", options: { color: C.gray } },
    ], { x: 1.8, y: 2.7, w: 16.5, h: 0.5, fontFace: "Consolas", fontSize: 15, margin: 0 });
    s.addText([
      { text: "⎇main*", options: { color: C.gray } },
      { text: " │ ", options: { color: C.grayDim } },
      { text: "+150", options: { color: C.green } },
      { text: "/", options: { color: C.grayDim } },
      { text: "-30", options: { color: C.red } },
      { text: " │ ", options: { color: C.grayDim } },
      { text: "my-project", options: { color: C.blue } },
    ], { x: 1.8, y: 3.3, w: 16.5, h: 0.5, fontFace: "Consolas", fontSize: 15, margin: 0 });

    // Warning state
    s.addShape(pres.shapes.RECTANGLE, {
      x: 1.5, y: 4.8, w: 17, h: 2.2,
      fill: { color: C.grayBg }, shadow: mkShadow()
    });
    s.addText("Warning — 75%", {
      x: 1.8, y: 4.9, w: 5, h: 0.4,
      fontSize: 11, fontFace: "Consolas", color: C.yellow, italic: true
    });
    s.addText([
      { text: "◆ ", options: { color: C.purple } },
      { text: "Claude Sonnet 4.6", options: { color: C.cyan } },
      { text: " │ ", options: { color: C.grayDim } },
      { text: "███████", options: { color: C.yellow } },
      { text: "░░░", options: { color: C.grayDim } },
      { text: " 75%", options: { color: C.yellow } },
      { text: " 200k", options: { color: C.gray } },
      { text: " │ ", options: { color: C.grayDim } },
      { text: "$3.20", options: { color: C.yellow } },
      { text: " │ ", options: { color: C.grayDim } },
      { text: "12m5s", options: { color: C.gray } },
    ], { x: 1.8, y: 5.4, w: 16.5, h: 0.5, fontFace: "Consolas", fontSize: 15, margin: 0 });
    s.addText([
      { text: "⎇feat/auth*", options: { color: C.gray } },
      { text: " │ ", options: { color: C.grayDim } },
      { text: "+280", options: { color: C.green } },
      { text: "/", options: { color: C.grayDim } },
      { text: "-45", options: { color: C.red } },
      { text: " │ ", options: { color: C.grayDim } },
      { text: "my-project", options: { color: C.blue } },
    ], { x: 1.8, y: 6.0, w: 16.5, h: 0.5, fontFace: "Consolas", fontSize: 15, margin: 0 });

    // Danger state
    s.addShape(pres.shapes.RECTANGLE, {
      x: 1.5, y: 7.5, w: 17, h: 2.2,
      fill: { color: C.grayBg }, shadow: mkShadow()
    });
    s.addText("Danger — 92% ⚠", {
      x: 1.8, y: 7.6, w: 5, h: 0.4,
      fontSize: 11, fontFace: "Consolas", color: C.red, italic: true
    });
    s.addText([
      { text: "◆ ", options: { color: C.purple } },
      { text: "Claude Opus 4.6", options: { color: C.cyan } },
      { text: " │ ", options: { color: C.grayDim } },
      { text: "█████████", options: { color: C.red } },
      { text: "░", options: { color: C.grayDim } },
      { text: " 92% ⚠", options: { color: C.red } },
      { text: " │ ", options: { color: C.grayDim } },
      { text: "$15.30", options: { color: C.red } },
      { text: " │ ", options: { color: C.grayDim } },
      { text: "45m12s", options: { color: C.gray } },
      { text: " │ ", options: { color: C.grayDim } },
      { text: "5h:85%", options: { color: C.red } },
    ], { x: 1.8, y: 8.1, w: 16.5, h: 0.5, fontFace: "Consolas", fontSize: 15, margin: 0 });
    s.addText([
      { text: "⎇main", options: { color: C.gray } },
      { text: " │ ", options: { color: C.grayDim } },
      { text: "+500", options: { color: C.green } },
      { text: "/", options: { color: C.grayDim } },
      { text: "-120", options: { color: C.red } },
      { text: " │ ", options: { color: C.grayDim } },
      { text: "api-server", options: { color: C.blue } },
    ], { x: 1.8, y: 8.7, w: 16.5, h: 0.5, fontFace: "Consolas", fontSize: 15, margin: 0 });
  }

  // ── Slide 4: Key Features (icon grid) ──
  {
    const s = pres.addSlide();
    addDarkBg(s);
    addBrandMark(s);
    addSlideNumber(s, 4, TOTAL);

    s.addText("Features", {
      x: 1.5, y: 0.4, w: 10, h: 0.8,
      fontSize: 36, fontFace: "Calibri", color: C.white, bold: true
    });

    const features = [
      { icon: iconPalette, title: "True-color Gradient", desc: "每格獨立上色的漸層進度條\n從綠到黃到紅，一眼感受緊迫度" },
      { icon: iconEyeSlash, title: "Smart Hiding", desc: "零值自動隱藏\nSession 起始時乾乾淨淨" },
      { icon: iconBolt, title: "< 50ms", desc: "單次 jq 解析 + Git 快取\n完全無感延遲" },
      { icon: iconCode, title: "3-Tier Rendering", desc: "True color → ANSI 256 → ASCII\n任何終端機都能用" },
      { icon: iconCog, title: "Agent / Worktree", desc: "子代理和工作樹狀態指示器\n知道自己在哪個 session" },
      { icon: iconCheck, title: "Bash 3.2 Compatible", desc: "macOS 預設 bash 完全相容\n零額外依賴（只要 jq）" },
    ];

    const cols = 3, rows = 2;
    const cardW = 5.2, cardH = 3.2;
    const gapX = 0.5, gapY = 0.5;
    const gridW = cols * cardW + (cols - 1) * gapX;
    const startX = (W - gridW) / 2;  // 置中
    const startY = 1.8;

    for (let i = 0; i < features.length; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const cx = startX + col * (cardW + gapX);
      const cy = startY + row * (cardH + gapY);

      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: cy, w: cardW, h: cardH,
        fill: { color: C.bgCard }, shadow: mkShadow()
      });

      // Purple accent line on left
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: cy, w: 0.06, h: cardH,
        fill: { color: C.purple }
      });

      s.addImage({
        data: features[i].icon,
        x: cx + 0.4, y: cy + 0.4, w: 0.5, h: 0.5
      });

      s.addText(features[i].title, {
        x: cx + 1.1, y: cy + 0.35, w: cardW - 1.5, h: 0.6,
        fontSize: 18, fontFace: "Calibri", color: C.white, bold: true, valign: "middle", margin: 0
      });

      s.addText(features[i].desc, {
        x: cx + 0.4, y: cy + 1.3, w: cardW - 0.8, h: 1.6,
        fontSize: 14, fontFace: "Calibri", color: C.gray, valign: "top", margin: 0
      });
    }
  }

  // ── Slide 5: Gradient Progress Bar Deep Dive ──
  {
    const s = pres.addSlide();
    addDarkBg(s);
    addBrandMark(s);
    addSlideNumber(s, 5, TOTAL);

    s.addText("Gradient Progress Bar", {
      x: 1.5, y: 0.4, w: 12, h: 0.8,
      fontSize: 36, fontFace: "Calibri", color: C.white, bold: true
    });

    s.addText("每一格都有獨立的 RGB 色值，形成從綠到紅的平滑漸層。不用讀數字，用餘光就知道狀態。", {
      x: 1.5, y: 1.4, w: 17, h: 0.8,
      fontSize: 18, fontFace: "Calibri", color: C.gray
    });

    // Big gradient bar visualization
    const barColors = [
      { hex: "2ECC71", r: 46, g: 204, b: 113 },
      { hex: "74C359", r: 116, g: 195, b: 89 },
      { hex: "BABA40", r: 186, g: 186, b: 64 },
      { hex: "F1C40F", r: 241, g: 196, b: 15 },
      { hex: "EFA118", r: 239, g: 161, b: 24 },
      { hex: "EC7E22", r: 236, g: 126, b: 34 },
      { hex: "E9652C", r: 233, g: 101, b: 44 },
      { hex: "E74C3C", r: 231, g: 76, b: 60 },
      { hex: "D34232", r: 211, g: 66, b: 50 },
      { hex: "C0392B", r: 192, g: 57, b: 43 },
    ];

    const bx = 1.5, by = 2.8, bw = 1.6, bh = 1.8, bgap = 0.12;
    for (let i = 0; i < 10; i++) {
      const x = bx + i * (bw + bgap);
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: by, w: bw, h: bh,
        fill: { color: barColors[i].hex },
        shadow: mkShadow()
      });
      s.addText(`${(i + 1) * 10}%`, {
        x, y: by + bh + 0.15, w: bw, h: 0.4,
        fontSize: 12, fontFace: "Consolas", color: C.gray, align: "center"
      });
      s.addText(`#${barColors[i].hex}`, {
        x, y: by + bh + 0.5, w: bw, h: 0.3,
        fontSize: 9, fontFace: "Consolas", color: C.grayDim, align: "center"
      });
    }

    // Rendering tiers
    s.addText("三層渲染退回機制", {
      x: 1.5, y: 6.2, w: 10, h: 0.6,
      fontSize: 22, fontFace: "Calibri", color: C.white, bold: true
    });

    const tiers = [
      { label: "True Color (24-bit)", code: "█ █ █ █ ░░░░░░", note: "每格獨立漸層色", color: C.green, codeColors: [
        { text: "█", options: { color: "2ECC71" } }, { text: "█", options: { color: "BABA40" } },
        { text: "█", options: { color: "F1C40F" } }, { text: "█", options: { color: "EC7E22" } },
        { text: "░░░░░░", options: { color: C.grayDim } },
      ]},
      { label: "ANSI 256", code: "████░░░░░░", note: "單色填滿（綠/黃/紅）", color: C.green },
      { label: "ASCII", code: "####------", note: "純 ASCII，任何環境", color: C.gray },
    ];

    for (let i = 0; i < tiers.length; i++) {
      const ty = 7.0 + i * 1.1;
      s.addShape(pres.shapes.RECTANGLE, {
        x: 1.5, y: ty, w: 17, h: 0.9,
        fill: { color: C.grayBg }
      });
      s.addText(tiers[i].label, {
        x: 1.8, y: ty + 0.1, w: 4.5, h: 0.7,
        fontSize: 15, fontFace: "Calibri", color: C.white, bold: true, valign: "middle", margin: 0
      });
      if (tiers[i].codeColors) {
        s.addText(tiers[i].codeColors, {
          x: 6.5, y: ty + 0.1, w: 5, h: 0.7,
          fontSize: 16, fontFace: "Consolas", valign: "middle", margin: 0
        });
      } else {
        s.addText(tiers[i].code, {
          x: 6.5, y: ty + 0.1, w: 5, h: 0.7,
          fontSize: 16, fontFace: "Consolas", color: tiers[i].color, valign: "middle", margin: 0
        });
      }
      s.addText(tiers[i].note, {
        x: 12, y: ty + 0.1, w: 6, h: 0.7,
        fontSize: 13, fontFace: "Calibri", color: C.gray, valign: "middle", margin: 0
      });
    }
  }

  // ── Slide 6: Architecture ──
  {
    const s = pres.addSlide();
    addDarkBg(s);
    addBrandMark(s);
    addSlideNumber(s, 6, TOTAL);

    s.addText("How It Works", {
      x: 1.5, y: 0.4, w: 10, h: 0.8,
      fontSize: 36, fontFace: "Calibri", color: C.white, bold: true
    });

    // Flow diagram using shapes
    const steps = [
      { label: "Claude Code", sub: "JSON via stdin", color: C.purple },
      { label: "jq (single call)", sub: "~3ms", color: C.cyan },
      { label: "Git Cache", sub: "5s TTL, ~0ms hit", color: C.green },
      { label: "Smart Assembly", sub: "條件性組裝", color: C.yellow },
      { label: "printf '%b'", sub: "ANSI output", color: C.orange },
    ];

    const flowY = 2, flowH = 2, flowW = 3, flowGap = 0.5;
    const flowStartX = (W - (steps.length * flowW + (steps.length - 1) * flowGap)) / 2;

    for (let i = 0; i < steps.length; i++) {
      const fx = flowStartX + i * (flowW + flowGap);

      s.addShape(pres.shapes.RECTANGLE, {
        x: fx, y: flowY, w: flowW, h: flowH,
        fill: { color: C.bgCard }, shadow: mkShadow()
      });
      // Top accent
      s.addShape(pres.shapes.RECTANGLE, {
        x: fx, y: flowY, w: flowW, h: 0.06,
        fill: { color: steps[i].color }
      });

      s.addText(steps[i].label, {
        x: fx, y: flowY + 0.4, w: flowW, h: 0.7,
        fontSize: 16, fontFace: "Calibri", color: C.white, bold: true,
        align: "center", margin: 0
      });
      s.addText(steps[i].sub, {
        x: fx, y: flowY + 1.2, w: flowW, h: 0.5,
        fontSize: 13, fontFace: "Consolas", color: steps[i].color,
        align: "center", margin: 0
      });

      // Arrow between steps
      if (i < steps.length - 1) {
        s.addText("→", {
          x: fx + flowW, y: flowY + 0.6, w: flowGap, h: 0.8,
          fontSize: 24, fontFace: "Arial", color: C.grayDim,
          align: "center", valign: "middle"
        });
      }
    }

    // Performance callout
    s.addShape(pres.shapes.RECTANGLE, {
      x: 3, y: 5, w: 14, h: 2.5,
      fill: { color: C.bgCard }, shadow: mkShadow()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 3, y: 5, w: 0.06, h: 2.5,
      fill: { color: C.green }
    });

    s.addText("< 50ms", {
      x: 3.5, y: 5.2, w: 5, h: 1,
      fontSize: 48, fontFace: "Consolas", color: C.green, bold: true, margin: 0
    });
    s.addText("end-to-end", {
      x: 3.5, y: 6.2, w: 5, h: 0.5,
      fontSize: 18, fontFace: "Calibri", color: C.gray, margin: 0
    });

    s.addText([
      { text: "jq 解析 14 個欄位", options: { color: C.white, breakLine: true } },
      { text: "Git dirty check（5 秒快取）", options: { color: C.white, breakLine: true } },
      { text: "條件性組裝 + ANSI 輸出", options: { color: C.white } },
    ], {
      x: 9, y: 5.3, w: 7.5, h: 2,
      fontSize: 16, fontFace: "Calibri", bullet: true, margin: 0
    });

    // Bash 3.2 gotchas
    s.addText("Bash 3.2 Gotchas We Solved", {
      x: 1.5, y: 8, w: 17, h: 0.6,
      fontSize: 20, fontFace: "Calibri", color: C.white, bold: true
    });

    const gotchas = [
      { prob: "IFS+read 合併空欄位", fix: "改用每行一值 + 逐行 read" },
      { prob: "$() 吞尾部換行", fix: "加 \"END\" 哨兵值" },
      { prob: "UTF-8 substring 不一致", fix: "查找表取代字串截取" },
    ];

    for (let i = 0; i < gotchas.length; i++) {
      const gx = 1.5 + i * 6;
      s.addText(gotchas[i].prob, {
        x: gx, y: 8.7, w: 5.5, h: 0.5,
        fontSize: 13, fontFace: "Consolas", color: C.red, margin: 0
      });
      s.addText("→ " + gotchas[i].fix, {
        x: gx, y: 9.2, w: 5.5, h: 0.5,
        fontSize: 13, fontFace: "Consolas", color: C.green, margin: 0
      });
    }
  }

  // ── Slide 7: Installation ──
  {
    const s = pres.addSlide();
    addDarkBg(s);
    addBrandMark(s);
    addSlideNumber(s, 7, TOTAL);

    s.addText("Installation", {
      x: 1.5, y: 0.4, w: 10, h: 0.8,
      fontSize: 36, fontFace: "Calibri", color: C.white, bold: true
    });

    s.addText("三步完成，一分鐘搞定", {
      x: 1.5, y: 1.3, w: 17, h: 0.6,
      fontSize: 18, fontFace: "Calibri", color: C.gray
    });

    const installSteps = [
      { num: "1", title: "Clone", code: "git clone https://github.com/kcchien/claude-code-statusline.git" },
      { num: "2", title: "Install", code: "cd claude-code-statusline && ./install.sh" },
      { num: "3", title: "Configure settings.json", code: '{\n  "statusLine": {\n    "type": "command",\n    "command": "~/.claude/statusline.sh",\n    "timeout": 10\n  }\n}' },
    ];

    for (let i = 0; i < installSteps.length; i++) {
      const sy = 2.3 + i * 2.7;

      // Step number circle
      s.addShape(pres.shapes.OVAL, {
        x: 1.5, y: sy, w: 0.8, h: 0.8,
        fill: { color: C.purple }
      });
      s.addText(installSteps[i].num, {
        x: 1.5, y: sy, w: 0.8, h: 0.8,
        fontSize: 24, fontFace: "Calibri", color: C.white, bold: true,
        align: "center", valign: "middle"
      });

      s.addText(installSteps[i].title, {
        x: 2.6, y: sy, w: 6, h: 0.8,
        fontSize: 22, fontFace: "Calibri", color: C.white, bold: true, valign: "middle", margin: 0
      });

      const codeH = i === 2 ? 1.5 : 0.7;
      s.addShape(pres.shapes.RECTANGLE, {
        x: 2.6, y: sy + 0.9, w: 15, h: codeH,
        fill: { color: C.grayBg }
      });
      s.addText(installSteps[i].code, {
        x: 2.9, y: sy + 0.95, w: 14.5, h: codeH - 0.1,
        fontSize: 14, fontFace: "Consolas", color: C.green, valign: "top", margin: 0
      });
    }
  }

  // ── Slide 8: Closing ──
  {
    const s = pres.addSlide();
    addDarkBg(s);
    addSlideNumber(s, 8, TOTAL);

    // Big diamond
    s.addText("◆", {
      x: W / 2 - 1, y: 2, w: 2, h: 2,
      fontSize: 80, color: C.purple, fontFace: "Arial",
      align: "center", valign: "middle"
    });

    s.addText("claude-code-statusline", {
      x: 2, y: 4.5, w: W - 4, h: 1,
      fontSize: 40, fontFace: "Consolas", color: C.white, bold: true, align: "center"
    });

    s.addImage({
      data: iconGithub,
      x: W / 2 - 4.5, y: 6.2, w: 0.45, h: 0.45
    });

    s.addText("github.com/kcchien/claude-code-statusline", {
      x: W / 2 - 4, y: 6.1, w: 9, h: 0.7,
      fontSize: 20, fontFace: "Consolas", color: C.purpleL,
      valign: "middle", margin: 0
    });

    s.addText("Star ⭐ if you find it useful!", {
      x: 4, y: 7.5, w: W - 8, h: 0.6,
      fontSize: 18, fontFace: "Calibri", color: C.gray, align: "center"
    });

    // Gradient bar at bottom (decorative)
    const barColors2 = ["2ECC71","74C359","BABA40","F1C40F","EFA118","EC7E22","E9652C","E74C3C","D34232","C0392B"];
    for (let i = 0; i < 10; i++) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: i * (W / 10), y: H - 0.35, w: W / 10, h: 0.35,
        fill: { color: barColors2[i] }
      });
    }

    s.addText("Built with Claude Code · MIT License", {
      x: 4, y: 9, w: W - 8, h: 0.5,
      fontSize: 13, fontFace: "Calibri", color: C.grayDim, align: "center"
    });
  }

  // ── Write file ──
  const outPath = __dirname + "/../docs/claude-code-statusline.pptx";
  await pres.writeFile({ fileName: outPath });
  console.log(`✓ Generated: ${outPath}`);
}

build().catch(err => { console.error(err); process.exit(1); });
