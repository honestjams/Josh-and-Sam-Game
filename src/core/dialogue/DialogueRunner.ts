import type { DialogueTree, DialogueNode, Id } from '@/data/types';
import type { GameStore, ConsequenceSideEffect } from '@/core/store/GameStore';

/** What the scene renders for the current step. */
export interface DialogueView {
  speaker: string;
  text: string;
  /** Visible, condition-passing choices with their original indices. */
  choices: Array<{ label: string; index: number }>;
}

/** Side effects the runner surfaces for the scene to act on (shop, battle). */
export type DialogueSideEffect = ConsequenceSideEffect;

/**
 * Phaser-independent dialogue traversal. Owns branching, condition checks,
 * consequence application (through the store), and router ('auto') nodes.
 * The DialogueScene is a thin renderer over this — which keeps the branching
 * story logic unit-testable without an engine.
 */
export class DialogueRunner {
  private current: DialogueNode | null = null;
  readonly sideEffects: DialogueSideEffect[] = [];

  constructor(
    private readonly tree: DialogueTree,
    private readonly store: GameStore,
  ) {}

  /** Begin the conversation; returns the first renderable view or null if empty. */
  start(): DialogueView | null {
    this.current = this.tree.nodes[this.tree.startNodeId] ?? null;
    return this.settle();
  }

  /** Current renderable view, or null when the conversation is over. */
  view(): DialogueView | null {
    if (!this.current) return null;
    return {
      speaker: this.current.speaker,
      text: this.current.text,
      choices: this.visibleChoices(this.current).map((c) => ({
        label: c.choice.text,
        index: c.index,
      })),
    };
  }

  /** True when the current node presents player choices. */
  hasChoices(): boolean {
    return !!this.current && this.visibleChoices(this.current).length > 0;
  }

  /** Advance a plain (no-choice) node. Returns the next view or null. */
  advance(): DialogueView | null {
    if (!this.current || this.hasChoices()) return this.view();
    this.goto(this.current.next);
    return this.settle();
  }

  /** Pick a visible choice by its original index. Returns the next view or null. */
  choose(index: number): DialogueView | null {
    if (!this.current) return null;
    const choice = this.current.choices?.[index];
    if (!choice) return this.view();
    this.apply(choice.consequences);
    this.goto(choice.next);
    return this.settle();
  }

  // --- internals ----------------------------------------------------------

  private goto(id: Id | undefined): void {
    this.current = id ? this.tree.nodes[id] ?? null : null;
  }

  /** Run onEnter and auto-resolve router nodes until a renderable node/end. */
  private settle(): DialogueView | null {
    // Guard against malformed cyclic auto-routers.
    for (let guard = 0; guard < 64 && this.current; guard++) {
      this.apply(this.current.onEnter);
      if (!this.current.auto) return this.view();

      // Router: follow the first choice whose conditions pass.
      const next = this.visibleChoices(this.current)[0];
      if (!next) {
        this.current = null;
        return null;
      }
      this.apply(next.choice.consequences);
      this.goto(next.choice.next);
    }
    return this.view();
  }

  private visibleChoices(node: DialogueNode): Array<{ choice: NonNullable<DialogueNode['choices']>[number]; index: number }> {
    return (node.choices ?? [])
      .map((choice, index) => ({ choice, index }))
      .filter(({ choice }) => this.store.checkAll(choice.conditions));
  }

  private apply(consequences: DialogueNode['onEnter']): void {
    for (const c of consequences ?? []) {
      const effect = this.store.applyConsequence(c);
      if (effect) this.sideEffects.push(effect);
    }
  }
}
