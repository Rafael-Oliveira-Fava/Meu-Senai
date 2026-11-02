# Design — Meu SENAI

Source of truth for tokens: [`src/tema.ts`](src/tema.ts) (`cor`, `tipografia`, `espaco`, `raio`, `animacao`). Components: [`src/componentes/`](src/componentes) (`estrutura`, `controles`, `indicadores`, `linhas`), motion in [`src/componentes/animacao.tsx`](src/componentes/animacao.tsx).

## Direction

School super-app standard (references: Layers Super App, MeuSesi), executed with care. Operate mode: the app is a working tool; brand shows in color, shape and detail, never in layout tricks.

## Color

| Token | Hex | Use |
| --- | --- | --- |
| `primary` | `#0B4DA2` | Header, app bars, filled buttons, active tab, links |
| `primaryContainer` | `#E3ECFA` | Shortcut circles, tonal buttons, selected chips, icon tiles |
| `onPrimaryMuted` | `#C9DAF3` | Secondary text on blue |
| `bg` | `#F3F5F9` | Screen ground |
| `surface` | `#FFFFFF` | Cards, tab bar, inputs |
| `ink` | `#111418` | Headings, snackbar, "Hoje" badge (black detail) |
| `text` / `muted` | `#1F2937` / `#566173` | Body / secondary (≥ 4.5:1 on white) |
| `outline` / `outlineStrong` | `#DCE2EB` / `#B9C3D1` | Dividers / input borders |
| `red` | `#E30613` | SENAI red. Brand: 4 px stripe under every app bar, avatar ring, section-title marker, extended FAB. Meaning: counts, unread dots, "needs you" items, disciplinary/urgent notices, destructive actions |
| `green` / `amber` | `#1C7A45` / `#8A5300` | Approved / pending status (with containers) |

Blue owns surfaces and primary actions; red is the identity accent and the attention signal. Red never fills a large area and never replaces the blue primary button.

Rule: status is never color alone. Every status ships with an icon and a word (`StatusBadge`, `TicketBadge`).

## Type

Roboto (via `@expo-google-fonts/roboto`), Material scale in sp so it follows the OS font size:

| Role | Size / line | Weight |
| --- | --- | --- |
| display | 28/34 | 700 |
| headline | 22/28 | 700 |
| title | 18/24 | 700 |
| titleSm | 16/22 | 500 |
| body | 16/24 | 400 |
| bodySm | 14/20 | 400 |
| label | 14/20 | 500 |
| labelSm | 12/16 | 500 |

Times and protocol numbers use tabular numerals.

## Shape, space, depth

- Spacing scale 4 · 8 · 12 · 16 · 20 · 24 · 32.
- Shape: anything tappable is a pill or a circle (buttons, chips, FAB, search, tab indicator, icon buttons, icon tiles). Containers use three radii by role: `field` 16 (inputs, option lists, banners, inner boxes), `card` 20 (cards, bubbles, list rows), `sheet` 28 (curved headers, shortcut card, login card). No other values.
- Depth: two soft blue-tinted shadows (`shadow`, `shadowRaised`); no hard offsets.
- Touch targets ≥ 48 dp. Content column max 640 px on wide screens.

## Components

Wordmark ("MEU SENAI" logo image: official SENAI mark + "MEU" in Exo 2 ExtraBold slanted 10°; white on blue, blue on light; `assets/meu-senai-logo*.png`) · App bar (blue, curved 28 px bottom with 4 px red stripe; one row: round translucent back button, 20 px title + subtitle, small MEU SENAI logo or header actions on the right; tab screens: title only) · Section title (red marker, optional red count, "Ver todos" pill action) · Bottom tabs with pale-blue pill indicator and red counts · Home header with curved bottom and overlapping shortcut card · Card · Button (filled, tonal, outlined, text, danger, dangerOutlined) · FAB (extended, red pill) · Chip / ChipRow filters · Field (label, required mark, helper, error, 2 px blue focus border) · OptionList (radio rows) · SwitchRow · Badge / StatusBadge / TicketBadge · UnreadDot · EmptyState (icon, title, what to do, action) · InfoRow · Snackbar · rows for notices, certificates, authorizations, tickets.

## Motion

Emil Kowalski rules: motion conveys state, short and strong ease-out.

- Press: scale 0.97 (cards 0.985, shortcuts 0.95), 160 ms, `cubic-bezier(0.23, 1, 0.32, 1)`.
- List entry: opacity + 8 px rise, 240 ms, 40 ms stagger capped at 6 items.
- Snackbar: in 240 ms from below, out 160 ms (exit faster than enter).
- Reduce motion: movement removed, opacity kept.

## Voice

Plain Brazilian Portuguese. Buttons name the action ("Estou ciente", "Aprovar saída", "Enviar atestado"). Errors say what is wrong and how to fix it. Every request shows a protocol number (Nº 2026/0147).
