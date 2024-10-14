import { Match, MatchedRow, MatchLevel, MatchResult } from "./types";

export function rowStateMachine<Primary extends string, Foreign extends string>(
  setMerge: (
    updater: (
      state: MatchResult<Primary, Foreign> | undefined
    ) => MatchResult<Primary, Foreign> | undefined
  ) => void
) {
  return (
    row: MatchedRow<Primary, Foreign>,
    rowState: Record<Primary, Match<Foreign>>,
    transitionTo: MatchLevel
  ) => {
    const common = {
      id: row.id,
      data: row.data,
      name: row.name,
      transitionTo: transitionTo,
    };
    const next = (f: MatchedRow<Primary, Foreign>) =>
      setMerge(
        (prev) =>
          prev && {
            ...prev,
            matches: new Map(prev.matches).set(row.id, f),
          }
      );

    if (row.matchLevel === "potential-match") {
      if (transitionTo === "removed") {
        return next({ matchLevel: "removed", prevState: row, ...common });
      } else if (transitionTo === "unambiguous") {
        return next({
          matchLevel: "unambiguous",
          match: rowState[row.id],
          ...common,
        });
      }
    } else if (row.matchLevel === "unambiguous") {
      if (transitionTo === "potential-match") {
        return next({
          matchLevel: "potential-match",
          potentialMatches: [row.match],
          ...common,
        });
      } else if (transitionTo === "removed") {
        return next({ matchLevel: "removed", prevState: row, ...common });
      }
    } else if (row.matchLevel === "no-match") {
      if (transitionTo === "removed") {
        return next({ matchLevel: "removed", prevState: row, ...common });
      } else if (transitionTo === "unambiguous") {
        return next({
          matchLevel: "unambiguous",
          match: rowState[row.id],
          ...common,
        });
      }
    } else if (row.matchLevel === "removed") {
      return next(row.prevState);
    }
    throw new Error(
      `Invalid state transition for ${JSON.stringify(row)} to '${transitionTo}'`
    );
  };
}
