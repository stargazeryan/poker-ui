import { GameGallery } from "../../examples/games";
import { Callout, H2, P, Prop } from "../ui";

/**
 * The worked examples, and the argument they exist to make.
 *
 * The gallery itself imports only `@stargazeryan/poker-ui` and
 * `@stargazeryan/poker-ui/wager` — the same two entry points a consumer gets —
 * because the point is that a game you have not been handed a component for is
 * still buildable. If these files needed anything a consumer cannot reach, the
 * claim would be false.
 */
export function GamesPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Worked examples</h1>
      <P>
        The library ships three table <strong>shapes</strong> — round, square and dealer — and no game-specific tables
        at all. There is no <Prop>PokerTable</Prop>, no <Prop>BigTwoTable</Prop>, no <Prop>BlackjackTable</Prop>{" "}
        anywhere in the package, on purpose: a table named after one game is useless to the game you write next.
      </P>
      <P>
        That raises the only question that matters: <em>can you actually build a game the library has never heard
        of?</em> The four below are the answer. Each imports only <Prop>@stargazeryan/poker-ui</Prop> and{" "}
        <Prop>@stargazeryan/poker-ui/wager</Prop> — the same two entries a consumer gets, and nothing private — and
        each holds no rules at all: no hand evaluation, no betting legality, no dealer draw. They are what a
        consumer&apos;s own game file looks like.
      </P>

      <H2>The four games</H2>
      <P>
        Read them as a set and the design falls out. The banking game and the twenty-one game share{" "}
        <em>one</em> table type, because a table type serves many games where a game-specific table serves one. The
        shedding game declares no ring, no slot and no watermark — nothing to wager and nothing to decorate — and so
        it draws none: it is the same round/square machinery with the opinions left out. The flop game is the only one
        with a betting line, and only because it <em>declared</em> one as a ring.
      </P>
      <div className="mt-6">
        <GameGallery />
      </div>

      <Callout title="If your seating is none of the three shapes…">
        …you are not stuck. <Prop>FitBox</Prop> plus the functions in <Prop>frames.ts</Prop>, or{" "}
        <Prop>CardTable</Prop> with its own props, is the escape hatch — and it is the exact same code the three table
        types are built from, so nothing in those examples is out of reach of your own game.
      </Callout>
    </>
  );
}
