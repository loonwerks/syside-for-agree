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

import { AstNode, Mutable, stream, TypeMetaData } from "langium";
import * as ast from "../generated/ast";
import { typeIndex } from "../model/types";
import { AstContainer, AstParent, AstPropertiesMatching } from "../utils/ast-util";
import { SysMLReferenceInfo } from "./references/linker";

export type SysMLType = keyof ast.SysMlAstType;
export type SysMLInterface<K extends SysMLType> = ast.SysMlAstType[K];

/**
 * Get the owning expression of an AST node that determines the reference type
 * @param ref AST node
 * @returns
 */
function findOwningExpression(ref: AstNode): AstNode | undefined {
    const parent = ref.$container;
    if (!parent) return parent;
    switch (parent.$type) {
        case ast.FeatureChainExpression:
            if (ref.$containerIndex === 0) return parent;
            return undefined;
        default:
            return undefined;
    }
}

export class SysMLAstReflection extends ast.SysMlAstReflection {
    protected readonly metadata = new Map<string, TypeMetaData>();

    override getReferenceType(refInfo: SysMLReferenceInfo): string {
        // references are split by scope and chain tokens and stored in the same
        // array so have to programmatically determine reference types

        const container = refInfo.container;

        const index = refInfo.index;
        if (container.$type === ast.FeatureReference) {
            const ref = container as ast.FeatureReference;
            return ref.$meta.featureIndices.indexOf(index) != -1 ? ast.Feature : ast.Element;
        }

        if (refInfo.index === container.chain.length - 1) {
            // last element
            switch (container.$type) {
                case ast.TypeReference:
                    return ast.Type;
                case ast.ClassifierReference:
                    return ast.Classifier;
                case ast.MetaclassReference:
                    return ast.Metaclass;
                case ast.ConjugatedPortReference:
                    return ast.PortDefinition;
            }

            // ElementReference
            switch (findOwningExpression(container)?.$type) {
                case ast.FeatureChainExpression:
                    return ast.Feature;
                case ast.InvocationExpression:
                    return ast.Type;
            }
        }

        return ast.Element;
    }

    override isSubtype(subtype: string, supertype: string): boolean {
        return typeIndex.isSubtype(subtype, supertype);
    }

    override getTypeMetaData(type: string): TypeMetaData {
        let meta = this.metadata.get(type);
        if (meta) return meta;

        // using map since there are a lot of duplicated properties
        const properties = new Map(
            super.getTypeMetaData(type).mandatory.map((p) => [p.name, p.type])
        );

        // the default langium implementation doesn't care about hierarchy
        // members resulting in some arrays/booleans being left undefined... fix
        // that here
        for (const base of typeIndex.getInheritanceChain(type)) {
            const baseMeta = super.getTypeMetaData(base);
            for (const { name, type } of baseMeta.mandatory) {
                if (properties.has(name)) continue;
                properties.set(name, type);
            }
        }

        meta = {
            name: type,
            mandatory: stream(properties.entries())
                .map(([name, type]) => {
                    return { name, type };
                })
                .toArray(),
        };

        // also make sure all nodes have $children member
        meta.mandatory.push({ name: "$children", type: "array" });
        this.metadata.set(type, meta);
        return meta;
    }

    private assignMandatoryProperties(obj: { $type: string }): void {
        const typeMetaData = this.getTypeMetaData(obj.$type);
        const out = obj as Record<string, unknown>;
        for (const mandatoryProperty of typeMetaData.mandatory) {
            const value = out[mandatoryProperty.name];
            if (mandatoryProperty.type === "array" && !Array.isArray(value)) {
                out[mandatoryProperty.name] = [];
            } else if (mandatoryProperty.type === "boolean" && value === undefined) {
                out[mandatoryProperty.name] = false;
            }
        }
    }

    /**
     * Programmatically create an AST node with a given {@link type}
     * @param type AST node type
     * @param values AST node values
     * @returns Constructed AST node
     */
    createNode<
        V extends SysMLType,
        T extends AstParent<SysMLInterface<V>>,
        P extends AstPropertiesMatching<SysMLInterface<V>, T>
    >(type: V, values: ConstructParams<SysMLInterface<V>, T, P>): SysMLInterface<V> {
        const partialNode = { $type: type, ...values };
        this.assignMandatoryProperties(partialNode);
        return this.assignNode(partialNode as unknown as SysMLInterface<V>, values);
    }

    /**
     * Assign {@link child} to a parent AST node with {@link info}
     * @param child Child AST node
     * @param info Properties defining {@link child} parent and its relationship
     * @returns child
     */
    assignNode<V extends AstNode, T extends AstParent<V>, P extends AstPropertiesMatching<V, T>>(
        child: V,
        info: AstContainer<V, T, P>
    ): V {
        const parent = info.$container;
        const property = info.$containerProperty;
        if (!parent || !property) return child;
        const member = (parent as NonNullable<T>)[property];
        const index = info.$containerIndex;
        if (Array.isArray(member)) {
            if (index) {
                member.forEach((v, i) => {
                    if (i >= index) (v as Mutable<AstNode>).$containerIndex = i + 1;
                });
                member.splice(index, 0, child);
                (child as Mutable<AstNode>).$containerIndex = index;
            } else {
                member.push(child);
                (child as Mutable<AstNode>).$containerIndex = member.length - 1;
            }
        } else {
            if (index) throw new Error("Cannot assign with an index to a non-array property");
            (parent as unknown as Record<string, V>)[property as string] = child;
        }

        (child as Mutable<AstNode>).$container = parent;
        (child as Mutable<AstNode>).$containerProperty = property as string;

        // if this was called during parsing, it may be possible that $children
        // has not been created yet
        if (parent.$children) parent.$children.push(child);
        return child;
    }
}

export type ConstructParams<
    V extends AstNode,
    T extends AstParent<V>,
    P extends AstPropertiesMatching<V, T>
> = Omit<Partial<V>, "$type" | "$container" | "$containerProperty" | "$containerIndex"> &
    AstContainer<V, T, P>;