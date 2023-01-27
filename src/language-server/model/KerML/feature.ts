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

import {
    Feature,
    Type,
    isBehavior,
    isStep,
    isStructure,
    isFeature,
    isAssociation,
    isConnector,
    isClass,
    isResult,
} from "../../generated/ast";
import {
    FeatureDirectionKind,
    getFeatureDirectionKind,
    SpecializationKind,
    TypeClassifier,
} from "../enums";
import { TypeMeta } from "./type";
import { metamodelOf, ElementID } from "../metamodel";

export const ImplicitFeatures = {
    base: "Base::things",
    dataValue: "Base::dataValues",
    occurrence: "Occurrences::occurrences",
    suboccurrence: "Occurrences::Occurrence::suboccurrences",
    object: "Objects::objects",
    subobject: "Objects::Object::subobjects",
    participant: "Links::Link::participant",
    // TODO
    startingAt:
        "FeatureReferencingPerformances::FeatureAccessPerformance::onOccurrence::startingAt",
    // TODO
    accessedFeature:
        "FeatureReferencingPerformances::FeatureAccessPerformance::onOccurrence::startingAt::accessedFeature",
};

@metamodelOf(Feature, ImplicitFeatures)
export class FeatureMeta extends TypeMeta {
    /**
     * Featuring types
     */
    readonly featuredBy = new Set<Type>();

    /**
     * Feature direction
     */
    direction: FeatureDirectionKind = "none";

    /**
     * Whether this feature is composite
     */
    isComposite = false;

    /**
     * Whether this feature is portion
     */
    isPortion = false;

    /**
     * Whether this feature is readonly
     */
    isReadonly = false;

    /**
     * Whether this feature is derived
     */
    isDerived = false;

    /**
     * Whether this feature is end
     */
    isEnd = false;

    constructor(node: Feature, elementId: ElementID) {
        super(node, elementId);
    }

    override initialize(node: Feature): void {
        if (!node.name && node.redefines.length > 0) {
            const newName = node.redefines[0].chain.at(-1)?.$refText;
            if (newName) this.setName(newName);
        }

        this.direction = getFeatureDirectionKind(node.direction);
        this.isComposite = !!node.isComposite;
        this.isPortion = !!node.isPortion;
        this.isReadonly = !!node.isReadOnly;
        this.isDerived = !!node.isDerived;
        this.isEnd =
            !!node.isEnd || (isConnector(node.$container) && node.$containerProperty === "ends");
    }

    override reset(): void {
        super.reset();
        this.featuredBy.clear();
    }

    override defaultGeneralTypes(): string[] {
        const supertypes = super.defaultGeneralTypes();
        if (this.isAssociationEnd()) supertypes.push("participant");

        return supertypes;
    }

    override defaultSupertype(): string {
        if (this.hasStructureType()) return this.isSubobject() ? "subobject" : "object";
        if (this.hasClassType()) return this.isSuboccurrence() ? "suboccurrence" : "occurrence";
        if (this.hasDataType()) return "dataValue";
        return "base";
    }

    override self(): Feature {
        return super.deref() as Feature;
    }

    /**
     * @returns true if this feature specializes any structure type, false
     * otherwise
     */
    hasStructureType(): boolean {
        return (this.classifier & TypeClassifier.Structure) === TypeClassifier.Structure;
    }

    /**
     * @returns true if this feature specializes any class type, false otherwise
     */
    hasClassType(): boolean {
        return (this.classifier & TypeClassifier.Class) === TypeClassifier.Class;
    }

    /**
     * @returns true if this feature specializes any data type, false otherwise
     */
    hasDataType(): boolean {
        return (this.classifier & TypeClassifier.DataType) === TypeClassifier.DataType;
    }

    /**
     * @returns true if this feature specializes any association type, false
     * otherwise
     */
    hasAssociation(): boolean {
        return (this.classifier & TypeClassifier.Association) === TypeClassifier.Association;
    }

    /**
     * @returns true if this feature is owned by a behavior or step, false
     * otherwise
     */
    protected isEnclosedPerformance(): boolean {
        const owner = this.parent();
        return isBehavior(owner) || isStep(owner);
    }

    /**
     * @returns true if this feature is composite and is enclosed performance,
     * false otherwise
     */
    protected isSubperformance(): boolean {
        return this.isComposite && this.isEnclosedPerformance();
    }

    /**
     * @returns true if this feature is composite and is owned by a structure
     * type or a feature specializing a structure type, false otherwise
     */
    protected isSubobject(): boolean {
        if (!this.isComposite) return false;
        const owner = this.parent();
        return isStructure(owner) || (isFeature(owner) && owner.$meta.hasStructureType());
    }

    /**
     * @returns same as {@link FeatureMeta.isSubobject isSubobject}
     */
    protected isOwnedPerformance(): boolean {
        return this.isSubobject();
    }

    /**
     * @returns true if this feature is composite and is owned by a class type
     * or a feature specializing a class type, false otherwise
     */
    protected isSuboccurrence(): boolean {
        if (!this.isComposite) return false;
        const owner = this.parent();
        return isClass(owner) || (isFeature(owner) && owner.$meta.hasClassType());
    }

    /**
     * @returns true if this feature is end feature and is owned by an
     * association of a connector
     */
    isAssociationEnd(): boolean {
        if (!this.isEnd) return false;
        const owner = this.parent();
        return isAssociation(owner) || isConnector(owner);
    }

    /**
     * Feature that provides the name for this feature. Itself if it was named,
     * otherwise the naming feature of the first redefinition
     */
    get namingFeature(): (Feature & { name: string }) | undefined {
        const feature = this.self();
        if (feature.name) return feature as Feature & { name: string };
        const redefinitions = this.specializations(SpecializationKind.Redefinition);
        if (redefinitions.length === 0) return undefined;
        // redefinitions are always features
        return (redefinitions[0].type as Feature).$meta.namingFeature;
    }

    isIgnoredParameter(): boolean {
        return this.isResultParameter;
    }

    get isParameter(): boolean {
        // parameter if direction was specified explicitly
        const parent = this.parent();
        return (isBehavior(parent) || isStep(parent)) && this.direction !== "none";
    }

    get isResultParameter(): boolean {
        return isResult(this.parent());
    }

    override addSpecialization(type: Type, kind: SpecializationKind, isImplicit?: boolean): void {
        super.addSpecialization(type, kind, isImplicit);

        if (kind !== SpecializationKind.Redefinition || this.name) return;
        const namingFeature = this.namingFeature;
        if (namingFeature) this.setName(namingFeature.name);
    }

    override specializationKind(): SpecializationKind {
        return SpecializationKind.Subsetting;
    }
}

declare module "../../generated/ast" {
    interface Feature {
        $meta: FeatureMeta;
    }
}