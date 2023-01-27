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
import { MetadataFeature } from "../../generated/ast";
import { ElementID, metamodelOf } from "../metamodel";
import { AnnotationMeta } from "./annotating-element";
import { FeatureMeta } from "./feature";

export const ImplicitMetadataFeatures = {
    base: "Metaobjects::metaobjects",
    annotatedElement: "Metaobjects::Metaobject::annotatedElement", // TODO
    baseType: "Metaobjects::SemanticMetadata::baseType", // TODO
};

@metamodelOf(MetadataFeature, ImplicitMetadataFeatures)
export class MetadataFeatureMeta extends Mixin(FeatureMeta, AnnotationMeta) {
    constructor(node: MetadataFeature, id: ElementID) {
        super(node, id);
    }

    override self(): MetadataFeature {
        return super.deref() as MetadataFeature;
    }

    override defaultSupertype(): string {
        return "base";
    }
}

declare module "../../generated/ast" {
    interface MetadataFeature {
        $meta: MetadataFeatureMeta;
    }
}