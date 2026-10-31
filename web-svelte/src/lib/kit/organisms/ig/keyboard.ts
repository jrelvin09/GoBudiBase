/** Keyboard navigation of the active grid cell (K5-04, §1.3). */

export type CellPos = { row: number; column: number };

export type CellBounds = { rows: number; columns: number };

const MOVES: Record<string, (pos: CellPos, bounds: CellBounds) => CellPos> = {
	ArrowLeft: (pos) => ({ ...pos, column: Math.max(0, pos.column - 1) }),
	ArrowRight: (pos, bounds) => ({ ...pos, column: Math.min(bounds.columns - 1, pos.column + 1) }),
	ArrowUp: (pos) => ({ ...pos, row: Math.max(0, pos.row - 1) }),
	ArrowDown: (pos, bounds) => ({ ...pos, row: Math.min(bounds.rows - 1, pos.row + 1) }),
	Home: (pos) => ({ ...pos, column: 0 }),
	End: (pos, bounds) => ({ ...pos, column: bounds.columns - 1 }),
	Tab: (pos, bounds) => ({ ...pos, column: Math.min(bounds.columns - 1, pos.column + 1) }),
	ShiftTab: (pos) => ({ ...pos, column: Math.max(0, pos.column - 1) })
};

/**
 * Returns the cell the cursor moves to, or null when the key does not move it
 * (Enter/F2 switch to editing, which the grid handles itself).
 */
export function nextCell(pos: CellPos, key: string, bounds: CellBounds): CellPos | null {
	if (bounds.rows < 1 || bounds.columns < 1) return null;
	const move = MOVES[key];
	return move ? move(pos, bounds) : null;
}

/** The key name `nextCell` expects, folding Shift+Tab into one name. */
export function navKey(key: string, shiftKey: boolean): string {
	return key === 'Tab' && shiftKey ? 'ShiftTab' : key;
}
