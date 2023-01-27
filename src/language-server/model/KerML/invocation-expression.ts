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

import { InvocationExpression, Type, isExpression, isSysMLFunction } from "../../generated/ast";
import { metamodelOf, ElementID } from "../metamodel";
import { InlineExpressionMeta } from "./inline-expression";

@metamodelOf(InvocationExpression)
export class InvocationExpressionMeta extends InlineExpressionMeta {
    constructor(node: InvocationExpression, id: ElementID) {
        super(node, id);
    }

    override self(): InvocationExpression {
        return super.self() as InvocationExpression;
    }

    /**
     * @returns fully qualified name of the invoked function
     */
    getFunction(): string | undefined {
        return this.invoked()?.$meta.qualifiedName;
    }

    /**
     * @returns explicitly invoked function type
     */
    private invoked(): Type | undefined {
        return this.self().type?.$meta.to.target;
    }

    override returnType(): string | Type | undefined {
        const type = this.invoked();
        if (isExpression(type) || isSysMLFunction(type)) return type.$meta.returnType();
        return type;
    }
}

declare module "../../generated/ast" {
    interface InvocationExpression {
        $meta: InvocationExpressionMeta;
    }
}