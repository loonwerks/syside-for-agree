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

import { AstNode, LangiumDocument } from "langium";
import { PortConjugation } from "../../../generated/ast";
import { ConjugationMeta, RelationshipOptionsBody } from "../../KerML";
import { ElementIDProvider, MetatypeProto, metamodelOf } from "../../metamodel";
import { ConjugatedPortDefinitionMeta, PortDefinitionMeta } from "../port-definition";

@metamodelOf(PortConjugation)
// @ts-expect-error ignoring static inheritance error
export class PortConjugationMeta<
    T extends PortDefinitionMeta = PortDefinitionMeta,
> extends ConjugationMeta<T> {
    override ast(): PortConjugation | undefined {
        return this._ast as PortConjugation;
    }

    static override create<T extends AstNode>(
        this: MetatypeProto<T>,
        provider: ElementIDProvider,
        document: LangiumDocument,
        options?: RelationshipOptionsBody<PortDefinitionMeta, ConjugatedPortDefinitionMeta>
    ): T["$meta"] {
        return super.create(provider, document, options);
    }
}

declare module "../../../generated/ast" {
    interface PortConjugation {
        $meta: PortConjugationMeta;
    }
}
