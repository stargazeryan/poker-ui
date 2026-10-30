/**
 * The docs' table of contents and API surface.
 *
 * `tests/docs-api.test.ts` reads this and compares every prop list against the
 * real interfaces in the package using the TypeScript compiler API, so a prop
 * that is renamed or added without updating the docs fails CI.
 */

export interface ApiRow {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export interface ComponentDoc {
  slug: string;
  title: string;
  /** The exported interface in src this page documents. */
  interfaceName: string;
  /**
   * Nav page that documents this component. Defaults to `slug`, so only the
   * components that share a page with another need it.
   */
  page?: string;
  summary: string;
  props: ApiRow[];
  /** For interfaces that are mostly slot content. */
  slots?: ApiRow[];
  /**
   * For a component whose interface declares nothing of its own because it
   * narrows another one. The test asserts the `extends Omit<…, keys>` clause in
   * the source matches `keys` exactly, so "it adds no props, it is the same
   * component with the shape decided" is verified rather than asserted.
   */
  omitOf?: { from: string; keys: string[] };
}

export const NAV = [
  {
    section: "Guide",
    items: [
      { slug: "getting-started", title: "Getting started" },
      { slug: "table-types", title: "Table types" },
      { slug: "games", title: "Worked examples" },
      { slug: "theming", title: "Theming" },
      { slug: "known-gaps", title: "Known gaps" },
    ],
  },
  {
    section: "Components",
    items: [
      { slug: "card-table", title: "CardTable" },
      { slug: "round-table", title: "RoundTable" },
      { slug: "square-table", title: "SquareTable" },
      { slug: "dealer-table", title: "DealerTable" },
      { slug: "fit-box", title: "FitBox" },
      { slug: "seat", title: "Seat" },
      { slug: "counter", title: "Counter" },
      { slug: "playing-card", title: "PlayingCard" },
      { slug: "card-back", title: "CardBack" },
      { slug: "card-row", title: "CardRow" },
      { slug: "card-slot", title: "CardSlot" },
    ],
  },
  {
    section: "Wager",
    items: [{ slug: "chips", title: "Chips" }],
  },
  {
    section: "Reference",
    items: [
      { slug: "layout", title: "Layout & geometry" },
      { slug: "turn-order", title: "Turn order" },
    ],
  },
] as const;

export const FIRST_SLUG = "getting-started";

export const COMPONENTS: ComponentDoc[] = [
  {
    slug: "card-table",
    title: "CardTable",
    interfaceName: "CardTableProps",
    summary:
      "The engine every table type is a preset of: a surface (an ellipse, a rounded rectangle or nothing), a strategy that places the seats on it, and slots for rings, per-seat content and an overlay. It lays out and draws, and it holds no opinion about the game — not whose turn it is, not who won, and not whether there is a betting line.",
    props: [
      {
        name: "seatCount",
        type: "number",
        default: "6",
        description:
          "Number of seats. No upper limit: the frames shrink to keep `seatGap`, so 11–16 lay out fine and past ~16 they overlap.",
      },
      {
        name: "renderSeat",
        type: "(index: number, box: SeatBox) => ReactNode",
        description:
          "Render a seat by index. The only way to render one, and a function because it hands you `box` — the laid-out centre and frame size — which an array of nodes cannot reach. Return `null` to skip the position. Nothing about the game: pass `isActive` / `isWinner` to `Seat` yourself.",
      },
      { name: "startAngle", type: "number", default: "90", description: "Angle of seat 0, in degrees. 90° is directly below the centre. On a rectangle the seats walk the perimeter from the bottom edge's centre instead." },
      {
        name: "shape",
        type: '"ellipse" | "rect" | "none"',
        default: '"ellipse"',
        description:
          'The boundary. `"ellipse"` is a round table, `"rect"` a rectangle with `cornerRadius`, `"none"` no surface at all — the design box is the table and nothing is painted behind the seats.',
      },
      { name: "cornerRadius", type: "number", default: "45% of the short half-extent", description: 'Corner radius of a `rect` table, in design-space px. `0` for hard edges.' },
      {
        name: "seatPlacement",
        type: '"ring" | "perimeter" | "row"',
        default: "the shape's own",
        description:
          "Where the seats go: around an ellipse, by arc length around a rectangle's perimeter, or a straight row along the bottom. Override it to mix, e.g. a rectangle with its seats on a ring.",
      },
      {
        name: "deck",
        type: "boolean",
        default: "true (except with shape=\"none\")",
        description: "Draw the rail, the felt and the rim. `false` gives you the seats and the geometry with nothing painted behind them.",
      },
      {
        name: "watermark",
        type: "ReactNode",
        description:
          "Decoration across the middle of the felt. **Nothing is drawn by default** — a suit watermark is a card-room decoration, not part of a table, so a game that is not played on green felt does not inherit one.",
      },
      { name: "railClassName", type: "string", description: "Extra classes on the rail, to restyle or replace it." },
      { name: "feltClassName", type: "string", description: "Extra classes on the felt." },
      {
        name: "rings",
        type: "TableRing[]",
        description:
          "Outlines drawn on the surface: `{ id, radius, className? }`. `radius` is a fraction of the surface, and the drawn ring follows it exactly. Empty by default — the table draws no line of its own.",
      },
      {
        name: "slots",
        type: "TableSlot[]",
        description:
          "Content positioned between the centre and each seat: `{ id, radius, render(index) }`. This is the mechanism a betting line's chips, a bid pill or a muck pile all need, with none of them named. Empty by default.",
      },
      { name: "center", type: "ReactNode", description: "Content in the middle of the table (cards, a counter, anything)." },
      { name: "ambient", type: "boolean", default: "true", description: "Breathing spotlight and felt sheen." },
      { name: "glow", type: "boolean", default: "false", description: "The edge glow — a halo hugging the rail, drawn behind the seats. `glow={isMyTurn}`. Draw it here, not in `renderOverlay`, which is above the seats." },
      {
        name: "renderOverlay",
        type: "(geometry: TableOverlayGeometry) => ReactNode",
        description:
          "Content drawn above the seats inside the scaled design box, `pointer-events-none`. Where table-edge effects and celebrations go — the table does not know why anything is happening. **Called** with the geometry: `layout.ringBox(r)` is the box a ring at that radius traces, `layout.slotPoint(i, r)` where a slot lands, and `layout.seats` every seat centre and frame size. Ignore the argument when you do not need it.",
      },
      { name: "seatWidth", type: "number", default: "160", description: "Preferred seat frame width, in design-space px." },
      { name: "seatHeight", type: "number", default: "176", description: "Preferred seat frame height." },
      {
        name: "seatGap",
        type: "number",
        default: "24",
        description:
          "Minimum clearance between neighbouring frames. Frames shrink uniformly (never below 50%) until it is honoured; `0` disables it. Every `Seat` inside the table is told the size that was settled on.",
      },
      { name: "designWidth", type: "number", default: "1200", description: "Width of the design box." },
      { name: "designHeight", type: "number", default: "900", description: "Height of the design box." },
      { name: "marginX", type: "number", default: "164 / 1200", description: "Rail inset as a fraction of the design box width." },
      { name: "marginY", type: "number", default: "196 / 900", description: "Rail inset as a fraction of the design box height." },
      { name: "feltGap", type: "number", default: "11", description: "Felt inset from the rail, in design-space px." },
      {
        name: "fit",
        type: '"design" | "container"',
        default: '"design"',
        description: '`"container"` derives the design width from the container aspect ratio (clamped 0.5–2.5) so the table fills the box instead of letterboxing.',
      },
      { name: "className", type: "string", description: "Extra classes on the outer element." },
    ],
  },
  {
    slug: "round-table",
    title: "RoundTable",
    interfaceName: "RoundTableProps",
    omitOf: { from: "CardTableProps", keys: ["shape", "seatPlacement", "cornerRadius"] },
    summary:
      "A table type: an ellipse of felt with the players' frames on a ring around it, for any game where everybody sits around a circle and the middle is shared. It adds no props of its own — it is `CardTable` with the surface and the seat placement already decided.",
    props: [],
  },
  {
    slug: "square-table",
    title: "SquareTable",
    interfaceName: "SquareTableProps",
    omitOf: { from: "CardTableProps", keys: ["shape", "seatPlacement"] },
    summary:
      "A table type: a rounded rectangle with the players' frames spaced along its perimeter by arc length, so four, six or eight players do not bunch into the corners. Also adds no props of its own — `cornerRadius` survives, because how round a rectangle's corners are is a property of the rectangle.",
    props: [],
  },
  {
    slug: "dealer-table",
    title: "DealerTable",
    interfaceName: "DealerTableProps",
    summary:
      "A table type: one frame at the head and a row of frames for the players, on a rounded rectangle. For the many card games that are not played *around* anything — twenty-one, the banking games, baccarat, dragon-tiger — where one position holds something everybody else acts against. What separates it from `CardTable` is the *arrangement*: its positions are laid out with `rowFrames`, never a ring. The surface is the same one `CardTable` draws, so the felt cannot drift between the two.",
    props: [
      // surface
      { name: "shape", type: "TableShape", default: '"rect"', description: 'Boundary to draw. `"ellipse"` if your players really do line up around a circle; `"none"` paints nothing.' },
      { name: "cornerRadius", type: "number", default: "45% of the short half-extent", description: "Corner radius of a `rect` surface, in design-space px." },
      { name: "deck", type: "boolean", default: 'true (false with shape="none")', description: "Draw the rail, the felt and the rim." },
      { name: "ambient", type: "boolean", default: "true", description: "Ambient spotlight + felt sheen." },
      { name: "glow", type: "boolean", default: "false", description: "The edge glow — a halo hugging the rail, drawn behind the hands." },
      { name: "watermark", type: "ReactNode", description: "Decoration across the middle of the felt. Nothing is drawn by default." },
      { name: "railClassName", type: "string", description: "Extra classes for the rail." },
      { name: "feltClassName", type: "string", description: "Extra classes for the felt." },
      { name: "marginX", type: "number", default: "164/1200", description: "Rail inset as a fraction of the design box." },
      { name: "marginY", type: "number", default: "196/900", description: "Rail inset as a fraction of the design box." },
      { name: "feltGap", type: "number", default: "11", description: "Felt inset from the rail, in design-space px." },
      { name: "head", type: "ReactNode", description: "Content of the head frame — a hand, a pile, a label. Positioned and sized; not drawn." },
      { name: "headWidth", type: "number", default: "240", description: "Preferred head frame width." },
      { name: "headHeight", type: "number", default: "230", description: "Preferred head frame height." },
      { name: "headY", type: "number", default: "0.16", description: "Centre of the head frame, as a fraction of the design height." },
      {
        name: "renderHand",
        type: "(index: number, box: FrameBox) => ReactNode",
        description:
          "Render a player position by index. The only way to render one, and a function because it hands you `box`, the frame size the row was laid out for. Return `null` to skip it.",
      },
      { name: "handCount", type: "number", default: "1", description: "How many player positions there are. A row whose length changes mid-round is one number, not a rebuilt array." },
      { name: "handWidth", type: "number", default: "220", description: "Preferred hand frame width." },
      { name: "handHeight", type: "number", default: "280", description: "Preferred hand frame height." },
      {
        name: "handGap",
        type: "number",
        default: "24",
        description: "Minimum clearance between hand frames. Frames shrink uniformly until it is honoured; `0` disables it.",
      },
      { name: "handY", type: "number", default: "0.74", description: "Centre of the row of hands, as a fraction of the design height." },
      { name: "designWidth", type: "number", default: "1200", description: "Width of the design box." },
      { name: "designHeight", type: "number", default: "900", description: "Height of the design box." },
      { name: "fit", type: '"design" | "container"', default: '"design"', description: '`"container"` fills the box instead of letterboxing a fixed aspect ratio.' },
      {
        name: "renderOverlay",
        type: "(geometry: DealerOverlayGeometry) => ReactNode",
        description:
          "Content over the whole design box, `pointer-events-none` — a settlement banner, confetti. **Called**, like `CardTable`'s, so both tables spell this slot the same way; the geometry is the design box and its scale, since there is no surface here to position a ring against.",
      },
      { name: "className", type: "string", description: "Extra classes on the outer element." },
    ],
  },
  {
    slug: "fit-box",
    title: "FitBox",
    interfaceName: "FitBoxProps",
    summary:
      "A container that lays its contents out in a fixed design box and scales that box to fit. It is the whole responsive half of every table type, on its own — so a layout that is none of them (a circle of options, a card you flip, a custom arrangement) still gets the scaling and the auto-shrink for free.",
    props: [
      { name: "designWidth", type: "number", default: "1200", description: "Width of the design box your content is laid out in." },
      { name: "designHeight", type: "number", default: "900", description: "Height of the design box." },
      {
        name: "fit",
        type: '"design" | "container"',
        default: '"design"',
        description: '`"container"` derives the design width from the container aspect ratio (clamped 0.5–2.5) instead of letterboxing a fixed one.',
      },
      {
        name: "children",
        type: "(design: DesignBox) => ReactNode",
        description:
          "**Called** with `{ width, height, scale }` rather than mounted — so the contents stay a function of the live geometry instead of becoming a new component type on every render.",
      },
      { name: "className", type: "string", description: "Extra classes on the outer element (which is `relative flex h-full w-full items-center justify-center overflow-hidden`)." },
    ],
  },
  {
    slug: "seat",
    title: "Seat",
    interfaceName: "SeatProps",
    summary:
      "A neutral frame with named slots and three generic states. It knows nothing about any particular game: put 0 cards, 13 cards, an avatar, a bid button or nothing at all in `children`.",
    props: [
      { name: "isActive", type: "boolean", default: "false", description: "Current/turn highlight (animated by default)." },
      { name: "isWinner", type: "boolean", default: "false", description: "Win highlight (animated by default)." },
      { name: "isDimmed", type: "boolean", default: "false", description: "Dimmed — out of the hand, disconnected, empty." },
      { name: "animated", type: "boolean", default: "true", description: "Enable the turn/winner glow animations." },
      { name: "onClick", type: "() => void", description: "Makes the frame a keyboard-accessible button." },
      { name: "width", type: "number", default: "laid-out size", description: "Frame width. Defaults to what the surrounding table laid out, or 160 outside one." },
      { name: "height", type: "number", default: "laid-out size", description: "Frame height. Same default as `width`." },
      { name: "className", type: "string", description: "Extra classes on the outer element." },
      { name: "frameClassName", type: "string", description: "Extra classes on the inner frame, to override visuals." },
      { name: "frameStyle", type: "CSSProperties", description: "Inline styles for the inner frame." },
    ],
    slots: [
      { name: "header", type: "ReactNode", description: "Top row inside the frame — name, badges." },
      { name: "children", type: "ReactNode", description: "Centre content — 0..N cards, an avatar, anything." },
      { name: "footer", type: "ReactNode", description: "Bottom row inside the frame — stack, status." },
      { name: "badge", type: "ReactNode", description: "Floating element at the top-right of the frame." },
      { name: "overlay", type: "ReactNode", description: "Overlay centred over the frame." },
      { name: "above", type: "ReactNode", description: "Floating content above the frame, centred — e.g. an action bubble." },
      { name: "below", type: "ReactNode", description: "Content below the frame, centred — e.g. a countdown or a wager pill." },
      { name: "topLeft", type: "ReactNode", description: "Floating content at the top-left corner — e.g. a crown, a rank badge." },
      { name: "topRight", type: "ReactNode", description: "Floating content at the top-right corner." },
      { name: "topCenter", type: "ReactNode", description: "Floating content centred above the top edge — e.g. dealer or blind badges." },
    ],
  },
  {
    slug: "counter",
    title: "Counter",
    interfaceName: "CounterProps",
    summary:
      "A labelled amount that optionally counts up to a new value. Standalone and optional — no table needs it. It attaches no unit, because the library does not know whether your numbers are chips, dollars, points, lives or big blinds.",
    props: [
      { name: "amount", type: "number", description: "The amount to display." },
      { name: "label", type: "string", description: 'Optional label, e.g. "Main", "Bank", "Round".' },
      {
        name: "format",
        type: "(amount: number) => string",
        default: "plain number",
        description:
          "Formatter for the amount. Defaults to a locale-grouped plain number. `formatBB` from `@stargazeryan/poker-ui/wager` is the opt-in big-blind helper.",
      },
      { name: "animate", type: "boolean", default: "true", description: "Count up smoothly when the amount changes." },
      { name: "className", type: "string", description: "Extra classes." },
    ],
  },
  {
    slug: "playing-card",
    title: "PlayingCard",
    interfaceName: "PlayingCardProps",
    summary:
      'A single card, driven by a compact code like "As" or "10h", or a card back. Size comes from the `size` prop, never from viewport breakpoints, so cards scale predictably inside any container.',
    props: [
      { name: "card", type: "string | null", description: 'Compact card code ("As", "10h", "Kd") or `null` for a face-down card back.' },
      {
        name: "size",
        type: '"xs" | "sm" | "md" | "lg"',
        default: '"md"',
        description: "`xs`/`sm` show a single larger centred index; `md`/`lg` add the rotated corner index and centre suit.",
      },
      {
        name: "label",
        type: "string",
        description:
          'Accessible name. Defaults to `describeCard(card)` — "Ace of spades" rather than the fragments "A" and "♠" a screen reader would otherwise read out. A null card forwards it to CardBack.',
      },
      { name: "className", type: "string", description: "Extra classes." },
    ],
  },
  {
    slug: "card-back",
    title: "CardBack",
    interfaceName: "CardBackProps",
    summary:
      "The face-down card: a dark red gradient, a gold rosette drawn as inline SVG, and a themed border. This is what PlayingCard renders for a null card.",
    props: [
      { name: "size", type: '"xs" | "sm" | "md" | "lg"', default: '"md"', description: "Card size." },
      { name: "label", type: "string", default: '"face-down card"', description: "Accessible name." },
      { name: "className", type: "string", description: "Extra classes." },
    ],
  },
  {
    slug: "card-row",
    title: "CardRow",
    interfaceName: "CardRowProps",
    summary:
      "A row of cards — a hand, a board, a meld, a dealer's up-cards. **One** component with one animation prop, instead of a component per game term: the arrangement and the entrance are the same in every card game, and only the vocabulary differs.",
    props: [
      { name: "cards", type: "(string | null)[]", description: "The cards; `null` entries render as card backs (or as empty positions, see `placeholder`)." },
      { name: "size", type: '"xs" | "sm" | "md" | "lg"', default: '"md"', description: "Card size." },
      {
        name: "animation",
        type: '"deal" | "flip" | false',
        default: '"deal"',
        description: '`"deal"` slides each card in, `"flip"` turns it over in 3D, `false` renders the row static.',
      },
      { name: "stagger", type: "number", default: "STAGGER_MS / FLIP_MS", description: "Delay between neighbouring cards, in ms." },
      {
        name: "animationKey",
        type: "string | number",
        description: "Change this to replay the animation for an unchanged row (a hand id, a round number).",
      },
      { name: "slots", type: "number", description: "Reserve this many positions so the row's width never changes as cards arrive." },
      {
        name: "placeholder",
        type: '"back" | "empty"',
        default: '"back"',
        description:
          'What a `null` **within** `cards` means: a face-down card, or an undealt position. Past the end of the array is always empty.',
      },
      { name: "className", type: "string", description: "Extra classes." },
    ],
  },
  {
    slug: "card-fan",
    title: "CardFan",
    interfaceName: "CardFanProps",
    page: "card-row",
    summary:
      "Overlapping cards, optionally fanned into an arc — the shape a large hand wants. Thirteen cards at any readable size are wider than a seat frame; overlapped, they fit.",
    props: [
      { name: "cards", type: "(string | null)[]", description: "The cards, left to right; `null` renders a card back." },
      { name: "size", type: '"xs" | "sm" | "md" | "lg"', default: '"lg"', description: "Card size." },
      { name: "overlap", type: "number", default: "0.55", description: "How much neighbouring cards overlap, 0–0.95 of a card width. `0` is a plain row." },
      { name: "arc", type: "number", default: "0", description: "Total spread in degrees. `0` is a flat overlapping row; 20–30 reads as a held hand." },
      { name: "className", type: "string", description: "Extra classes." },
    ],
  },
  {
    slug: "card-slot",
    title: "CardSlot",
    interfaceName: "CardSlotProps",
    summary:
      "A reserved position for a card that may or may not be there yet — a board that is half dealt, a three-card game's three positions, a face-down slot. Renders as a dashed outline when empty, so a game's final shape can be laid out before any card exists.",
    props: [
      { name: "size", type: '"xs" | "sm" | "md" | "lg"', default: '"md"', description: "The card size the slot reserves room for." },
      { name: "label", type: "string", default: '"empty card slot"', description: "Accessible name for the empty slot. Ignored once the slot has content." },
      { name: "children", type: "ReactNode", description: "Put a card (or anything else) in the slot." },
      { name: "className", type: "string", description: "Extra classes — e.g. a highlight on the position that matters." },
    ],
  },
  {
    slug: "chip-stack",
    title: "ChipStack",
    interfaceName: "ChipStackProps",
    page: "chips",
    summary:
      "The chips for an amount, as a real stack with the largest denomination on top. Break the amount down with the greedy set a dealer would use (white 1, red 5, blue 10, green 25, black 100) and draw the result. Lives in `@stargazeryan/poker-ui/wager`.",
    props: [
      { name: "amount", type: "number", description: "Amount in chip units — the smallest chip is 1. See `chipBreakdown`." },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Chip width: 22 / 30 / 42px." },
      {
        name: "denominations",
        type: "Denomination[]",
        default: "DEFAULT_DENOMINATIONS",
        description: "Which chips exist and what they are worth. Blue defaults to 10; swap in 20 if your room does that.",
      },
      {
        name: "maxChips",
        type: "number",
        default: "12",
        description: "Most chips to draw, biggest first — a 10,000 bet would otherwise be 100 black chips. The number left off is shown underneath.",
      },
      { name: "label", type: "ReactNode", description: "Content under the stack, usually the formatted amount." },
      { name: "className", type: "string", description: "Extra classes." },
    ],
  },
  {
    slug: "chip",
    title: "Chip",
    interfaceName: "ChipProps",
    page: "chips",
    summary:
      "A single chip, drawn as SVG: a coloured disc with a darker edge for thickness, eight edge spots, a rim highlight and a white centre carrying the value.",
    props: [
      { name: "value", type: "number | string", description: "Printed on the centre of the face. Omit it for a blank chip." },
      { name: "color", type: "string", description: "CSS colour for the body. Any CSS colour works, including `var(--color-chip-red)`." },
      {
        name: "colorClassName",
        type: "string",
        description:
          "A `fill-*` utility applied over `color`. The default denominations use these so the `--color-chip-*` tokens get emitted and stay themeable; a class wins over the `fill` attribute, so `color` is the fallback.",
      },
      {
        name: "spotColor",
        type: "string",
        description:
          "Colour of the eight edge spots. Defaults to `chipSpotColor(color)`, which is white except on a light body — white spots on the white chip sit at 1.1:1 and vanish.",
      },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Chip width: 22 / 30 / 42px." },
      { name: "label", type: "string", description: 'Accessible name. Defaults to "<value> chip".' },
      { name: "className", type: "string", description: "Extra classes." },
    ],
  },
  {
    slug: "confetti",
    title: "Confetti",
    interfaceName: "ConfettiProps",
    page: "card-table",
    summary:
      "Falling confetti, filling the box it is rendered into. A decoration with no opinion about why it is falling: render it when *you* decide something is worth celebrating, usually inside a table's `overlay`.",
    props: [
      { name: "count", type: "number", default: "44", description: "How many pieces to scatter." },
      {
        name: "colors",
        type: "string[]",
        default: "party palette",
        description: "Piece colours, cycled. A prop rather than a theme token because they land in inline styles, which Tailwind's tree-shaking cannot see.",
      },
      { name: "className", type: "string", description: "Extra classes." },
    ],
  },
  {
    slug: "hole-cards",
    title: "HoleCards",
    interfaceName: "HoleCardsProps",
    page: "card-row",
    summary:
      "**Deprecated** — `CardRow` with `size=\"lg\"`. \"Hole cards\" is one game's word for a row of cards, and the mechanism was never specific to it.",
    props: [
      { name: "cards", type: "(string | null)[]", description: "The cards; `null` entries render as card backs." },
      { name: "size", type: '"xs" | "sm" | "md" | "lg"', default: '"lg"', description: "Card size." },
      { name: "className", type: "string", description: "Extra classes." },
      { name: "deal", type: "boolean", default: "true", description: "Animate the cards dealing in." },
      { name: "dealKey", type: "string | number", description: "Change this to replay the deal for an unchanged hand." },
    ],
  },
  {
    slug: "community-cards",
    title: "CommunityCards",
    interfaceName: "CommunityCardsProps",
    page: "card-row",
    summary:
      "**Deprecated** — `CardRow` with `animation=\"flip\"`. \"Community\" is one game's word for a shared row, and the difference from a hand was only ever the animation.",
    props: [
      { name: "cards", type: "(string | null)[]", description: "The cards; `null` entries render as empty positions here, unlike `CardRow`'s default." },
      { name: "size", type: '"xs" | "sm" | "md" | "lg"', default: '"md"', description: "Card size." },
      { name: "className", type: "string", description: "Extra classes." },
      { name: "animated", type: "boolean", default: "true", description: "Animate each card with a 3D flip." },
      { name: "slots", type: "number", description: "Reserve a fixed number of positions so the row width never changes." },
    ],
  },
];

export const DOC_BY_SLUG: Record<string, ComponentDoc> = Object.fromEntries(
  COMPONENTS.map((c) => [c.slug, c]),
);
