/********************************************************************************
 * Copyright (c) 2022-2023 Sensmetry UAB and others
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License, v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is
 * available at https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { stream } from "langium";
import { Type, TypeReference, isFeature } from "../generated/ast";
import { SpecializationKind } from "./enums";
import { Position } from "vscode-languageserver";
import { JSONConvertible } from "../utils/common";

export type SpecializationType<T extends Type = Type> = {
    type: T;
    kind: SpecializationKind;
    isImplicit: boolean;
};

/**
 * Container for specializations that also allows filtering with caching
 */
export class Specializations
    implements Iterable<SpecializationType>, JSONConvertible<SpecializationType[]>
{
    toJSON(): SpecializationType[] {
        return this.get(SpecializationKind.None);
    }

    [Symbol.iterator](): Iterator<SpecializationType, undefined, undefined> {
        return this.types.values()[Symbol.iterator]();
    }

    protected readonly types = new Map<Type, SpecializationType>();
    protected caches: { [key in SpecializationKind]?: SpecializationType[] } = {};

    /**
     * Clear all registered specializations
     */
    clear(): void {
        this.types.clear();
        this.caches = {};
    }

    /**
     * Add a new specialization
     * @param type specialized type
     * @param kind specialization kind
     * @param isImplicit if true, the specialization is implicit, otherwise -
     * explicit
     */
    add(type: Type, kind: SpecializationKind, isImplicit = false): void {
        if (this.types.has(type)) return;

        this.types.set(type, { type, kind, isImplicit });
        this.caches = {};
    }

    /**
     * @param kind specialization kind
     * @returns all specializations matching {@link kind}
     */
    get(kind: SpecializationKind): SpecializationType[] {
        let cached = this.caches[kind];
        if (cached) return cached;

        cached =
            kind === SpecializationKind.None
                ? Array.from(this)
                : stream(this)
                      .filter((s) => (s.kind & kind) === kind)
                      .toArray();
        this.caches[kind] = cached;
        return cached;
    }
}

const EMPTY_POS: Position = { line: 0, character: 0 };

/**
 * @param node type to collect explicit specializations for
 * @returns type references used in explicit specialization in the order they
 * were declared in the parsed file
 */
export function getExplicitSpecializations(node: Type): TypeReference[] {
    let refs = stream(node.specializes, node.conjugates);
    if (isFeature(node))
        refs = refs.concat(stream(node.typedBy, node.references, node.redefines, node.subsets));

    // TODO: extract range comparison to a separate function and use it to sort
    // $children in parser.ts
    return refs.toArray().sort((l, r) => {
        const lpos = l.$cstNode?.range.start ?? EMPTY_POS;
        const rpos = r.$cstNode?.range.start ?? EMPTY_POS;

        const lineDiff = lpos.line - rpos.line;
        if (lineDiff !== 0) return lineDiff;
        return lpos.character - rpos.character;
    });
}