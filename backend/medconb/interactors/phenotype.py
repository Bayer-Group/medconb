from copy import deepcopy
from typing import cast

import medconb.domain as d
import medconb.graphql.types as gql

from .base import (
    BaseInteractor,
    ContainerNotExistsException,
    PhenotypeNotExistsException,
)


class PhenotypeInteractor(BaseInteractor):
    def _must_load_phenotype(
        self, phenotype_id: d.PhenotypeID, writeable: bool = True
    ) -> d.Phenotype:
        """
        _must_load_phenotype loads the phenotype with the given ID from
        the database and checks if the current user has the required
        permissions to read or write the phenotype.
        If the phenotype does not exist or the user does not have the
        required permissions, a PhenotypeNotExistsException is raised.
        """
        phenotype = self.phenotype_repository.get(phenotype_id)

        if phenotype is None:
            raise PhenotypeNotExistsException(phenotype_id)

        if (
            writeable
            and self.is_writable_by_current_user(phenotype)
            or not writeable
            and self.is_readable_by_current_user(phenotype)
        ):
            return phenotype

        raise PhenotypeNotExistsException(phenotype_id)


class CreatePhenotype(PhenotypeInteractor):
    def __call__(self, dto: gql.CreatePhenotypeRequestDto) -> d.Phenotype:
        (ref_ctr, ref_pht) = self._identify_ref(
            dto.position, item_type=d.ItemType.Phenotype
        )
        ref_pht = cast(d.Phenotype, ref_pht)
        ref_ctr = cast(d.Collection, ref_ctr)

        if not self.is_writable_by_current_user(ref_ctr):
            raise ContainerNotExistsException(ref_ctr.id, ref_ctr.container_type)

        all_props = self.session.property_repository.get_all(d.PropertyClass.Phenotype)
        obj_properties = d.init_property_bag(
            all_props=all_props, current_user_id=self.user.id
        )
        d.update_property_bag(
            property_bag=obj_properties,
            input_=dto.properties,
            all_props=all_props,
            current_user_id=self.user.id,
        )

        phenotype = d.Phenotype(
            id=self.phenotype_repository.new_id(),
            name=dto.name,
            item_ids=[],
            medical_description=dto.medical_description or "",
            operational_description=dto.operational_description or "",
            properties=obj_properties,
            container=ref_ctr.to_spec(),
            reference_id=dto.reference_id,
        )

        d.add_or_move_item(
            container=None, item=phenotype, ref_container=ref_ctr, ref_item=ref_pht
        )

        self.session.add(phenotype)

        return phenotype


class UpdatePhenotype(PhenotypeInteractor):  # noqa: radon complexity
    def __call__(  # noqa: radon complexity
        self, dto: gql.UpdatePhenotypeRequestDto
    ) -> d.Phenotype:
        phenotype = self._must_load_phenotype(dto.phenotype_id)
        prop_repo = self.session.property_repository
        all_props = prop_repo.get_all(d.PropertyClass.Phenotype)
        all_props_by_name = {p.name: p for p in all_props}

        root_collection = self._must_load_root_collection_of(phenotype)
        if root_collection.locked:
            raise ValueError(
                f"Collection {root_collection.id} of phenotype {phenotype.id} is locked"
                " and cannot be updated"
            )

        if dto.name is not None:
            phenotype.name = dto.name

        if dto.medical_description is not None:
            phenotype.medical_description = dto.medical_description

        if dto.operational_description is not None:
            phenotype.operational_description = dto.operational_description

        if dto.properties is not None:
            d.update_property_bag(
                property_bag=phenotype.properties,
                input_=dto.properties,
                all_props=all_props,
                current_user_id=self.user.id,
            )

        if dto.reference_id is not None:
            phenotype.reference_id = dto.reference_id

        if dto.position is not None:
            container = self._must_load_container(phenotype.container)
            (ref_ctr, ref_pht) = self._identify_ref(
                dto.position,
                default_container=container,
                item_type=d.ItemType.Phenotype,
            )

            assert isinstance(ref_ctr, d.Collection)
            assert ref_pht is None or isinstance(ref_pht, d.Phenotype)
            assert isinstance(container, d.Collection)
            assert phenotype in container

            if not self.is_writable_by_current_user(ref_ctr):
                raise ContainerNotExistsException(ref_ctr.id, ref_ctr.container_type)

            d.add_or_move_item(
                container=container,
                item=phenotype,
                ref_container=ref_ctr,
                ref_item=ref_pht,
            )

        d.set_auto_generated_props(
            phenotype.properties, self.user.id, all_props_by_name
        )

        return phenotype


class DeletePhenotype(PhenotypeInteractor):
    def __call__(self, dto: gql.DeletePhenotypeRequestDto) -> bool:
        phenotype = self._must_load_phenotype(dto.phenotype_id)
        container = self._must_load_container(phenotype.container)
        assert isinstance(container, d.Collection)
        assert phenotype in container

        root_collection = self._must_load_root_collection_of(phenotype)
        if root_collection.locked:
            raise ValueError(
                f"Collection {root_collection.id} of phenotype {phenotype.id} is locked"
                " and cannot be deleted"
            )

        container.remove_item(phenotype.id)

        items = self.codelist_repository.get_all(phenotype.item_ids)
        phenotype.item_ids.clear()
        for item in items:
            d.delete_codelist(
                container=phenotype,
                codelist=item,
                referencing_codelists=self.codelist_repository.get_by(
                    "reference_id", item.id
                ),
            )

        self.phenotype_repository.delete(phenotype.id)

        return True


class ClonePhenotype(PhenotypeInteractor):
    def __call__(self, dto: gql.ClonePhenotypeRequestDto) -> d.Phenotype:
        phenotype = self._must_load_phenotype(dto.phenotype_id)
        container = self._must_load_container(phenotype.container)
        assert isinstance(container, d.Collection)
        assert phenotype in container

        ref_container: d.Collection = container
        ref_item: d.Phenotype = phenotype

        if dto.position:
            ref_container, ref_item = cast(
                tuple[d.Collection, d.Phenotype],
                self._identify_ref(
                    dto.position,
                    default_container=container,
                    item_type=d.ItemType.Phenotype,
                ),
            )

        if not self.is_writable_by_current_user(ref_container):
            raise ValueError("The cloning target is not writable by the current user")

        codelists = self.codelist_repository.get_all(phenotype.item_ids)

        new_codelists: list[d.Codelist] = []
        for codelist in codelists:
            new_codelist = d.squash_codelist(
                codelist=codelist,
                new_id=self.codelist_repository.new_id(),
                author_id=self.user.id,
            )
            new_codelists.append(new_codelist)

        new_phenotype = d.Phenotype(
            id=self.phenotype_repository.new_id(),
            name=phenotype.name,
            medical_description=phenotype.medical_description,
            operational_description=phenotype.operational_description,
            container=ref_container.to_spec(),
            reference_id=phenotype.id,
            item_ids=[c.id for c in new_codelists],
            properties=deepcopy(phenotype.properties),
        )

        d.add_or_move_item(
            container=None,
            item=new_phenotype,
            ref_container=ref_container,
            ref_item=ref_item,
        )

        self.session.add(new_phenotype)
        for i in new_codelists:
            self.session.add(i)

        return new_phenotype
