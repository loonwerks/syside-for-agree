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

import { NamespaceReference } from "../../../generated/ast";
import { Target } from "../../../utils/containers";
import { ElementID, metamodelOf, ModelContainer } from "../../metamodel";
import { ElementReferenceMeta, NamespaceMeta } from "../_internal";

@metamodelOf(NamespaceReference)
export class NamespaceReferenceMeta extends ElementReferenceMeta {
    override readonly to = new Target<NamespaceMeta>();

    constructor(id: ElementID, parent: ModelContainer<NamespaceReference>) {
        super(id, parent);
    }

    override ast(): NamespaceReference | undefined {
        return this._ast as NamespaceReference;
    }

    override parent(): ModelContainer<NamespaceReference> {
        return this._parent;
    }
}

declare module "../../../generated/ast" {
    interface NamespaceReference {
        $meta: NamespaceReferenceMeta;
    }
}
