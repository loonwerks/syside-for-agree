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

import { Mixin } from "ts-mixer";
import { ConstraintDefinition } from "../../generated/ast";
import { PredicateMeta } from "../KerML/predicate";
import { metamodelOf, ElementID } from "../metamodel";
import { OccurrenceDefinitionMeta } from "./occurrence-definition";

@metamodelOf(ConstraintDefinition, {
    base: "Constraints::ConstraintCheck",
})
export class ConstraintDefinitionMeta extends Mixin(OccurrenceDefinitionMeta, PredicateMeta) {
    constructor(node: ConstraintDefinition, id: ElementID) {
        super(node, id);
    }

    override self(): ConstraintDefinition {
        return super.self() as ConstraintDefinition;
    }
}

declare module "../../generated/ast" {
    interface ConstraintDefinition {
        $meta: ConstraintDefinitionMeta;
    }
}